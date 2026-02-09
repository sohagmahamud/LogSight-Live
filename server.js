
import express from 'express';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 8080;
const upload = multer({ storage: multer.memoryStorage() });

app.use(express.json());
app.use(express.static(__dirname));

const MARATHON_SYSTEM_INSTRUCTION = `You are an Autonomous SRE Marathon Agent. 
Your task is to conduct a multi-level autonomous investigation of a production incident.

LEVELS OF ANALYSIS:
- TRIAGE: Rapid surface-level impact assessment.
- CORRELATION: Connecting disparate log lines and visual spikes across systems.
- DEEP_DIVE: Using deep reasoning to find architectural root causes.

MARATHON PRINCIPLES:
1. EXPOSE THOUGHT SIGNATURES: Detail your internal reasoning process for every step.
2. SELF-CORRECT: If new evidence contradicts your L1 findings, explicitly mark them as REFUTED and pivot.
3. CONTINUITY: Maintain a ledger of active leads.

OUTPUT FORMAT: Return ONLY valid JSON matching the provided schema.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    investigation_ledger: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          timestamp: { type: Type.STRING },
          level: { type: Type.STRING, enum: ['TRIAGE', 'CORRELATION', 'DEEP_DIVE'] },
          thought_signature: { type: Type.STRING },
          finding: { type: Type.STRING },
          status: { type: Type.STRING, enum: ['PROBING', 'CONFIRMED', 'REFUTED'] },
          evidence_links: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["timestamp", "level", "thought_signature", "finding", "status"]
      }
    },
    root_cause_hypotheses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hypothesis: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          supporting_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          unknowns: { type: Type.ARRAY, items: { type: Type.STRING } },
          corrected_from: { type: Type.STRING }
        },
        required: ["hypothesis", "confidence", "supporting_evidence", "unknowns"]
      }
    },
    next_actions: { type: Type.ARRAY, items: { type: Type.STRING } },
    active_leads: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["summary", "investigation_ledger", "root_cause_hypotheses", "next_actions", "active_leads"]
};

app.post('/analyze', upload.array('images'), async (req, res) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("[CRITICAL] API_KEY environment variable is missing.");
      return res.status(500).json({ error: 'Server configuration error: API_KEY is missing.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { mode, logContent } = req.body;
    const files = req.files || [];

    const isMarathon = mode === 'MARATHON';
    // Use gemini-3-pro-preview for deep architectural probes and gemini-3-flash-preview for quick assessment.
    const modelName = isMarathon ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    console.log(`[LogSight] Starting ${mode} analysis using model ${modelName}...`);

    // Only Gemini 3 series supports thinkingBudget
    const thinkingConfig = isMarathon ? { thinkingBudget: 24000 } : undefined;

    const parts = [{ text: isMarathon ? "Begin autonomous marathon investigation." : "Perform quick triage." }];
    if (logContent) parts.push({ text: `DATA_LOGS:\n${logContent}` });
    
    // Convert uploaded image buffers to base64 inlineData for the Gemini model
    for (const file of files) {
      parts.push({
        inlineData: { mimeType: file.mimetype, data: file.buffer.toString('base64') }
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: MARATHON_SYSTEM_INSTRUCTION,
        temperature: isMarathon ? 0.4 : 0.2,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("Gemini returned an empty response. Check safety filters.");
    }

    // Extract JSON from potential Markdown blocks
    const cleanedText = text.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleanedText);
    res.json(result);

  } catch (error) {
    console.error('[LogSight] Analysis Error:', error);
    res.status(500).json({ 
      error: error.message || 'An unexpected error occurred in the analysis engine.',
      details: error.toString() 
    });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API_KEY missing' });

    const ai = new GoogleGenAI({ apiKey });
    const { message, history } = req.body;

    // Convert history to the format required by the Chat SDK
    const contents = (history || []).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: contents,
      config: { 
        systemInstruction: "Continue the SRE Marathon Agent diagnostic session. Answer technical queries based on previous investigation leads." 
      }
    });

    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error) {
    console.error('[LogSight] Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.listen(port, () => {
  console.log(`[LogSight] Marathon Agent active on port ${port}`);
});

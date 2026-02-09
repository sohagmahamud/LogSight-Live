
import express from 'express';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 8080;

// Configuration for large multimodal payloads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } 
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// --- API Routes (MUST BE DEFINED BEFORE STATIC MIDDLEWARE) ---

app.post('/analyze', upload.array('images'), async (req, res) => {
  console.log(`[LogSight] Received /analyze request. Mode: ${req.body.mode}`);
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Internal Server Error: API_KEY is not configured.' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { mode, logContent } = req.body;
    const files = req.files || [];

    const isMarathon = mode === 'MARATHON';
    const modelName = isMarathon ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    // Marathon Mode gets the maximum thinking budget for deepest architectural reasoning
    const thinkingConfig = isMarathon ? { thinkingBudget: 32768 } : undefined;

    const parts = [
      { text: isMarathon ? "Begin deep autonomous marathon investigation." : "Perform rapid triage." }
    ];
    
    if (logContent) {
      parts.push({ text: `CONTEXT_LOGS:\n${logContent}` });
    }
    
    for (const file of files) {
      parts.push({
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString('base64')
        }
      });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [{ role: 'user', parts }],
      config: {
        systemInstruction: MARATHON_SYSTEM_INSTRUCTION,
        temperature: isMarathon ? 0.4 : 0.2,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig,
      },
    });

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('[LogSight] Analysis Error:', error);
    res.status(500).json({ 
      error: error.message || 'The investigation engine encountered a processing error.',
      details: error.toString()
    });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API_KEY not configured' });

    const ai = new GoogleGenAI({ apiKey });
    const { message, history } = req.body;

    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      history: (history || []).map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      })),
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

// --- Static File Serving ---

app.use(express.static(__dirname));

// Catch-all route for SPA navigation - MUST BE LAST
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`[LogSight] Marathon Agent active on port ${port}`);
});


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

const SYSTEM_INSTRUCTION = `You are a conservative, expert Site Reliability Engineer (SRE).
Your goal is to analyze provided logs and dashboard screenshots to explain production incidents.
PRINCIPLES:
1. Prioritize factual evidence from logs/images.
2. Be clear about uncertainty - if you don't know, say so.
3. Do not hallucinate remediation steps unless supported by evidence.
4. Focus on "Why did this happen?" and "What to check next?".
OUTPUT FORMAT:
Return ONLY valid JSON. Do not include markdown code block backticks.`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    root_cause_hypotheses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hypothesis: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          supporting_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          unknowns: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["hypothesis", "confidence", "supporting_evidence", "unknowns"]
      }
    },
    next_actions: { type: Type.ARRAY, items: { type: Type.STRING } }
  },
  required: ["summary", "root_cause_hypotheses", "next_actions"]
};

app.post('/analyze', upload.array('images'), async (req, res) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error('CRITICAL: API_KEY is not set in environment variables.');
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { mode, logContent } = req.body;
    const files = req.files || [];
    
    console.log(`Starting analysis. Mode: ${mode}, Logs: ${logContent?.length || 0} chars, Images: ${files.length}`);

    const modelName = mode === 'QUICK' ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
    const temperature = mode === 'QUICK' ? 0.2 : 0.4;
    const thinkingConfig = mode === 'DEEP' ? { thinkingBudget: 16384 } : undefined;

    const parts = [];
    if (logContent) {
      parts.push({ text: `Analyze based on log data:\n${logContent}` });
    }
    
    for (const file of files) {
      parts.push({
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString('base64')
        }
      });
      parts.push({ text: "Analyze dashboard for visible issues in this screenshot." });
    }

    if (logContent && files.length > 0) {
      parts.unshift({ text: "Analyze using both logs and screenshot" });
    }

    if (parts.length === 0) {
      return res.status(400).json({ error: 'No content provided for analysis' });
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
        thinkingConfig,
      },
    });

    if (!response.text) {
      throw new Error('Gemini returned an empty response');
    }

    res.json(JSON.parse(response.text));
  } catch (error) {
    console.error('Analysis Error Detail:', error);
    res.status(500).json({ 
      error: error.message,
      suggestion: 'Check if the API Key has sufficient quotas or if the input is too large.'
    });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server configuration error: Missing API Key' });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { message } = req.body;
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are an expert SRE. Continue the incident analysis conversation based on the previous findings.",
      },
    });
    const response = await chat.sendMessage({ message });
    res.json({ text: response.text });
  } catch (error) {
    console.error('Chat Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(port, () => {
  console.log(`LogSight Live SRE Engine listening on port ${port}`);
});

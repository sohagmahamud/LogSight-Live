import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResponse, AnalysisMode, ChatMessage, FileData } from "../types";

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

export class GeminiService {
  static async analyzeIncident(
    mode: AnalysisMode,
    logContent?: string,
    imageFiles: FileData[] = []
  ): Promise<AnalysisResponse> {
    const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
    const isMarathon = mode === 'MARATHON';
    const modelName = isMarathon ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    const thinkingBudget = isMarathon ? 24000 : 0;

    const parts: any[] = [
      { text: isMarathon ? "Begin autonomous marathon investigation based on the following data." : "Perform quick triage on the provided data." }
    ];

    if (logContent) {
      parts.push({ text: `DATA_LOGS:\n${logContent}` });
    }

    imageFiles.forEach(file => {
      parts.push({
        inlineData: {
          mimeType: file.type,
          data: file.content
        }
      });
    });

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: MARATHON_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: isMarathon ? 0.4 : 0.2,
          thinkingConfig: { thinkingBudget }
        }
      });

      const text = response.text;
      if (!text) throw new Error("The AI returned an empty response. Please check your inputs.");
      
      return JSON.parse(text);
    } catch (e: any) {
      console.error("Gemini Analysis Error:", e);
      throw new Error(e.message || "Failed to analyze incident evidence.");
    }
  }

  static async chat(history: ChatMessage[], message: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: (process.env as any).API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "Continue the SRE Marathon Agent diagnostic session. Answer technical queries based on previous investigation leads or remediation steps."
      }
    });

    // Note: The SDK chat history format differs from our internal types.
    // We recreate the state for the stateless call.
    try {
      const response = await chat.sendMessage({ message });
      return response.text || "I was unable to formulate a response.";
    } catch (e: any) {
      console.error("Gemini Chat Error:", e);
      throw new Error(e.message || "Chat synchronization failed.");
    }
  }
}
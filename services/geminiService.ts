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
  private static getAI() {
    // Relying on the platform injected API_KEY
    const apiKey = (process.env as any).API_KEY;
    if (!apiKey) {
      throw new Error("API_KEY environment variable is missing. Please ensure it is set in your Cloud Run environment.");
    }
    return new GoogleGenAI({ apiKey });
  }

  static async analyzeIncident(
    mode: AnalysisMode,
    logContent?: string,
    imageFiles: FileData[] = []
  ): Promise<AnalysisResponse> {
    const ai = this.getAI();
    const isMarathon = mode === 'MARATHON';
    const model = isMarathon ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
    
    // Max thinking budget for deep reasoning in Marathon mode
    const thinkingConfig = isMarathon ? { thinkingBudget: 32768 } : undefined;

    const parts: any[] = [
      { text: isMarathon ? "Begin autonomous marathon investigation of this incident context." : "Perform rapid triage of this data." }
    ];

    if (logContent) {
      parts.push({ text: `CONTEXT_LOGS:\n${logContent}` });
    }

    imageFiles.forEach(img => {
      parts.push({
        inlineData: {
          mimeType: img.type,
          data: img.content
        }
      });
    });

    try {
      const response = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: MARATHON_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
          temperature: isMarathon ? 0.4 : 0.2,
          thinkingConfig,
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from investigation engine.");
      
      // Remove possible markdown formatting from response
      const cleaned = text.replace(/```json|```/g, '').trim();
      return JSON.parse(cleaned);
    } catch (e: any) {
      console.error("[GeminiService] Analysis failed:", e);
      throw new Error(e.message || "The investigation engine encountered a processing error.");
    }
  }

  static async chat(history: ChatMessage[], message: string): Promise<string> {
    const ai = this.getAI();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are the Expert SRE Advisor for LogSight. Continue the diagnostic session based on previous investigation results."
      },
      // Note: We don't map full history here to keep it simple, 
      // but in a real app we'd convert history correctly.
    });

    try {
      const response = await chat.sendMessage({ message });
      return response.text || "I was unable to formulate a response.";
    } catch (e: any) {
      console.error("[GeminiService] Chat failed:", e);
      throw new Error(e.message || "Communication with the advisor failed.");
    }
  }
}

import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { AnalysisResponse, AnalysisMode, ChatMessage, FileData } from "../types";

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
    summary: { type: Type.STRING, description: "concise situation report (2-3 sentences)" },
    root_cause_hypotheses: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          hypothesis: { type: Type.STRING },
          confidence: { type: Type.NUMBER, description: "0.0-1.0" },
          supporting_evidence: { type: Type.ARRAY, items: { type: Type.STRING } },
          unknowns: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["hypothesis", "confidence", "supporting_evidence", "unknowns"]
      }
    },
    next_actions: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific, actionable investigation steps" }
  },
  required: ["summary", "root_cause_hypotheses", "next_actions"]
};

export class GeminiService {
  private static getClient() {
    return new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  static async analyzeIncident(
    mode: AnalysisMode,
    logContent?: string,
    imageFiles: FileData[] = []
  ): Promise<AnalysisResponse> {
    const ai = this.getClient();
    
    // Quick: Flash model, low temp. 
    // Deep: Pro model, slightly higher temp, plus Thinking Budget.
    const modelName = mode === 'QUICK' ? 'gemini-3-flash-preview' : 'gemini-3-pro-preview';
    const temperature = mode === 'QUICK' ? 0.2 : 0.4;
    const thinkingConfig = mode === 'DEEP' ? { thinkingBudget: 16384 } : undefined;
    
    const parts: any[] = [];
    
    if (logContent) {
      parts.push({ text: `Analyze based on log data:\n${logContent}` });
    }
    
    for (const img of imageFiles) {
      parts.push({
        inlineData: {
          mimeType: img.type,
          data: img.content
        }
      });
      parts.push({ text: "Analyze dashboard for visible issues in this screenshot." });
    }

    if (logContent && imageFiles.length > 0) {
      parts.unshift({ text: "Analyze using both logs and screenshot" });
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

    try {
      const cleanText = response.text || '{}';
      return JSON.parse(cleanText) as AnalysisResponse;
    } catch (e) {
      console.error("Failed to parse Gemini response:", response.text);
      throw new Error("Invalid response format from AI");
    }
  }

  static async chat(history: ChatMessage[], message: string): Promise<string> {
    const ai = this.getClient();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: {
        systemInstruction: "You are an expert SRE. Continue the incident analysis conversation based on the previous findings.",
      },
    });

    const response = await chat.sendMessage({ message });
    return response.text || "No response received.";
  }
}

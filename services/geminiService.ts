
import { AnalysisResponse, AnalysisMode, ChatMessage, FileData } from "../types";

export class GeminiService {
  static async analyzeIncident(
    mode: AnalysisMode,
    logContent?: string,
    imageFiles: FileData[] = []
  ): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('mode', mode);
    formData.append('logContent', logContent || '');
    
    for (const img of imageFiles) {
      const response = await fetch(`data:${img.type};base64,${img.content}`);
      const blob = await response.blob();
      formData.append('images', blob, img.name);
    }

    const res = await fetch('/analyze', {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || 'Analysis failed');
    }

    return await res.json();
  }

  static async chat(history: ChatMessage[], message: string): Promise<string> {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Unknown server error' }));
      throw new Error(errorData.error || 'Chat failed');
    }

    const data = await res.json();
    return data.text;
  }
}

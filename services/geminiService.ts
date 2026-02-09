
import { AnalysisResponse, AnalysisMode, ChatMessage, FileData } from "../types";

export class GeminiService {
  static async checkHealth(): Promise<any> {
    try {
      const res = await fetch('/health');
      if (!res.ok) return { status: 'ERROR', code: res.status };
      return await res.json();
    } catch (e) {
      return { status: 'UNREACHABLE', error: e instanceof Error ? e.message : String(e) };
    }
  }

  static async analyzeIncident(
    mode: AnalysisMode,
    logContent?: string,
    imageFiles: FileData[] = []
  ): Promise<AnalysisResponse> {
    const formData = new FormData();
    formData.append('mode', mode);
    formData.append('logContent', logContent || '');
    
    for (const img of imageFiles) {
      try {
        const response = await fetch(`data:${img.type};base64,${img.content}`);
        if (!response.ok) throw new Error("Failed to process image data");
        const blob = (await response.blob()) as Blob;
        formData.append('images', blob, img.name);
      } catch (e) {
        console.error("Error processing image for upload:", e);
      }
    }

    try {
      const res = await fetch('/analyze', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        let errorMessage = 'Analysis failed';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          const textError = await res.text();
          errorMessage = `Server Error (${res.status}): The custom domain mapping might be misconfigured.`;
        }
        throw new Error(errorMessage);
      }

      return await res.json();
    } catch (e) {
      if (e instanceof Error && e.name === 'TypeError') {
        throw new Error("Network connection failed. Verify DNS propagation and Cloud Run custom domain mapping.");
      }
      throw e;
    }
  }

  static async chat(history: ChatMessage[], message: string): Promise<string> {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Chat failed' }));
      throw new Error(errorData.error || 'Chat failed');
    }

    const data = await res.json();
    return data.text;
  }
}

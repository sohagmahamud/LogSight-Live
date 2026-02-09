
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
        // Note: Do not manually set Content-Type header when sending FormData
        body: formData
      });

      if (!res.ok) {
        let errorMessage = 'Analysis failed';
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          if (res.status === 413) {
            errorMessage = "Payload too large. Please try with fewer images or shorter logs.";
          } else {
            errorMessage = `Server Error (${res.status}): The investigation engine encountered a routing error.`;
          }
        }
        throw new Error(errorMessage);
      }

      return await res.json();
    } catch (e) {
      if (e instanceof Error && e.name === 'TypeError') {
        throw new Error("Network connection failed. Please check your internet connection or deployment status.");
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

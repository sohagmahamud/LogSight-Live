
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
    
    // Explicitly iterate over imageFiles to process blobs for multipart upload
    for (const img of imageFiles) {
      try {
        // Use a data URL fetch to convert base64 to Blob
        const response = await fetch(`data:${img.type};base64,${img.content}`);
        if (!response.ok) throw new Error("Failed to process image data");
        
        // Cast the result to Blob to fix 'unknown' type errors during assignment
        const blob = (await response.blob()) as Blob;
        formData.append('images', blob, img.name);
      } catch (e) {
        console.error("Error processing image for upload:", e);
      }
    }

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
        // Fallback for non-JSON error pages (e.g. 502/504 Gateway errors)
        const textError = await res.text();
        console.error("Server returned non-JSON error:", textError);
        errorMessage = `Server Error (${res.status}): Please check deployment logs.`;
      }
      throw new Error(errorMessage);
    }

    return await res.json();
  }

  static async chat(history: ChatMessage[], message: string): Promise<string> {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send both current message and conversation history to maintain context on the server
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

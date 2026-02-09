
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
    
    // Convert base64 back to Blobs for multipart upload
    for (const img of imageFiles) {
      try {
        const byteCharacters = atob(img.content);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: img.type });
        formData.append('images', blob, img.name);
      } catch (e) {
        console.error("Error encoding image for backend transfer:", e);
      }
    }

    const res = await fetch('/analyze', {
      method: 'POST',
      body: formData // Let browser set Content-Type to multipart/form-data
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
      throw new Error(errorData.error || 'The investigation engine failed to start.');
    }

    return await res.json();
  }

  static async chat(history: ChatMessage[], message: string): Promise<string> {
    const res = await fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Communication error' }));
      throw new Error(errorData.error || 'Chat engine synchronization failed.');
    }

    const data = await res.json();
    return data.text;
  }
}

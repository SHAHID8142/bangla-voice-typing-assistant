import { AIProvider, CleanupOptions } from '../../types';

export class OllamaProvider implements AIProvider {
  name = "Ollama";
  private baseUrl: string;

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async cleanText(text: string, options: CleanupOptions): Promise<string> {
    const systemPrompt = `You are a Bangla dictation correction assistant. Your task is to clean raw Bangla speech-to-text output. 
Fix spelling mistakes, wrongly understood words, punctuation, spacing, and grammar. 
Keep the original meaning unchanged. Do not add new information. Do not translate unless requested. 
Return only the corrected Bangla text.
Punctuation Mode: ${options.punctuationMode}
Correction Strength: ${options.correctionStrength}`;

    try {
      const requestBody = {
        model: options.model || "gemma:2b",
        prompt: `${systemPrompt}\n\nRaw Text: ${text}\n\nCorrected Text:`,
        stream: false,
      };

      let response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      // If model is not found, auto-pull it
      if (response.status === 404) {
        console.warn(`Ollama model ${requestBody.model} not found. Attempting to pull...`);
        await this.pullModel(requestBody.model);
        
        // Retry generate request after pulling
        response = await fetch(`${this.baseUrl}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Ollama request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.response.trim();
    } catch (error) {
      console.error("Ollama Error:", error);
      throw error;
    }
  }

  async pullModel(modelName: string, onProgress?: (status: string) => void): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/pull`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: modelName }),
    });

    if (!response.ok) throw new Error("Failed to pull model");

    const reader = response.body?.getReader();
    if (!reader) return;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = new TextDecoder().decode(value);
      try {
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (!line) continue;
          const status = JSON.parse(line);
          if (onProgress) onProgress(status.status);
        }
      } catch (e) {
        // Ignore parse errors for partial chunks
      }
    }
  }
}

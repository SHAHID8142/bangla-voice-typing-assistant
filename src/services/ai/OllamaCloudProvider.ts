import { AIProvider, CleanupOptions } from '../../types';

export class OllamaCloudProvider implements AIProvider {
  name = "Ollama Cloud";
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string, apiKey: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = apiKey;
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
        model: options.model || "gemma4:e2b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Raw Text: ${text}\n\nCorrected Text:` }
        ],
        stream: false,
      };

      // Assuming OpenAI compatible endpoint for Ollama Cloud models
      const response = await fetch(`${this.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
         const errorText = await response.text();
         throw new Error(`Ollama Cloud request failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim() || text;
    } catch (error) {
      console.error("Ollama Cloud Error:", error);
      throw error;
    }
  }
}

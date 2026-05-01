import { AIProvider, CleanupOptions } from '../../types';

export class OllamaProvider implements AIProvider {
  name = "Ollama";
  private baseUrl: string;
  private modelPulled: Set<string> = new Set();

  constructor(baseUrl: string = "http://localhost:11434") {
    this.baseUrl = baseUrl;
  }

  async cleanText(text: string, options: CleanupOptions): Promise<string> {
    const model = options.model || "gemma4:e2b";
    const systemPrompt = `You are a Bangla dictation correction assistant. Your task is to clean raw Bangla speech-to-text output.
Fix spelling mistakes, wrongly understood words, punctuation, spacing, and grammar.
Keep the original meaning unchanged. Do not add new information. Do not translate unless requested.
Return only the corrected Bangla text.
Punctuation Mode: ${options.punctuationMode}
Correction Strength: ${options.correctionStrength}`;

    const requestBody = {
      model: model,
      prompt: `${systemPrompt}\n\nRaw Text: ${text}\n\nCorrected Text:`,
      stream: false,
    };

    // First attempt
    let response = await this.makeRequest(requestBody);

    // If model not found, try to pull it once
    if (response.status === 404 && !this.modelPulled.has(model)) {
      console.warn(`Ollama model ${model} not found. Attempting to pull...`);
      this.modelPulled.add(model);

      // Start pulling in background, don't await - it's too slow
      this.pullModelAsync(model);

      // Retry anyway - maybe it was just pulled
      response = await this.makeRequest(requestBody);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Ollama request failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();
    return data.response?.trim() || text;
  }

  private async makeRequest(body: object): Promise<Response> {
    return fetch(`${this.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async pullModelAsync(model: string): Promise<void> {
    try {
      console.log(`Background pulling model: ${model}`);
      // This will take a while but won't block
      await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model }),
      });
      console.log(`Model ${model} pulled successfully`);
    } catch (e) {
      console.error(`Failed to pull model ${model}:`, e);
    }
  }
}
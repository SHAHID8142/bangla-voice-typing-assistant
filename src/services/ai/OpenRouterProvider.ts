import OpenAI from 'openai';
import { AIProvider, CleanupOptions } from '../../types';

export class OpenRouterProvider implements AIProvider {
  name = "OpenRouter";
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey,
      dangerouslyAllowBrowser: true,
      defaultHeaders: {
        "HTTP-Referer": "http://localhost:1420/", // Update if hosting
        "X-Title": "Bangla Voice Typing Assistant",
      }
    });
  }

  async cleanText(text: string, options: CleanupOptions): Promise<string> {
    const systemPrompt = `You are a Bangla dictation correction assistant. Your task is to clean raw Bangla speech-to-text output. 
Fix spelling mistakes, wrongly understood words, punctuation, spacing, and grammar. 
Keep the original meaning unchanged. Do not add new information. Do not translate unless requested. 
Return only the corrected Bangla text.
Punctuation Mode: ${options.punctuationMode}
Correction Strength: ${options.correctionStrength}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: options.model || "google/gemini-pro",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Raw Text: ${text}\n\nCorrected Text:` }
        ],
        temperature: 0.3,
      });

      return response.choices[0].message.content?.trim() || text;
    } catch (error) {
      console.error("OpenRouter Error:", error);
      throw error;
    }
  }
}

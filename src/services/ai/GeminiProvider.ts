import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIProvider, CleanupOptions } from '../../types';

export class GeminiProvider implements AIProvider {
  name = "Gemini";
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async cleanText(text: string, options: CleanupOptions): Promise<string> {
    const systemPrompt = `You are a Bangla dictation correction assistant. Your task is to clean raw Bangla speech-to-text output. 
Fix spelling mistakes, wrongly understood words, punctuation, spacing, and grammar. 
Keep the original meaning unchanged. Do not add new information. Do not translate unless requested. 
Return only the corrected Bangla text.
Punctuation Mode: ${options.punctuationMode}
Correction Strength: ${options.correctionStrength}`;

    try {
      const model = this.genAI.getGenerativeModel({ 
        model: options.model || "gemini-2.5-flash",
        systemInstruction: systemPrompt 
      });

      const result = await model.generateContent(`Raw Text: ${text}\n\nCorrected Text:`);
      const response = result.response;
      return response.text().trim() || text;
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { SpeechProvider, TranscriptionResult } from "../../types";

export class GeminiSpeechProvider implements SpeechProvider {
  name = "Gemini STT";
  isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private mimeType = "audio/webm";
  private genAI: GoogleGenerativeAI;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async startRecording(
    onResult: (result: TranscriptionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = this.pickSupportedMimeType();
      this.mimeType = mimeType;
      this.mediaRecorder = new MediaRecorder(stream, { mimeType });
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        const audioBlob = new Blob(this.audioChunks, { type: this.mimeType });
        await this.transcribe(audioBlob, onResult, onError);
        stream.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.start();
    } catch (_err) {
      onError("Microphone access denied or not found.");
    }
  }

  async stopRecording(): Promise<void> {
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  private async transcribe(
    blob: Blob,
    onResult: (result: TranscriptionResult) => void,
    onError: (error: string) => void
  ) {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const base64Audio = await this.blobToBase64(blob);
      const mimeType = this.normalizeMimeType(blob.type || this.mimeType);

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType,
            data: base64Audio,
          },
        },
        "Generate a verbatim Bangla transcript of this audio. Return only the transcript text without extra commentary.",
      ]);

      const transcript = result.response.text().trim();
      if (!transcript) {
        onError("Gemini returned an empty transcript.");
        return;
      }

      onResult({ text: transcript, isFinal: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gemini transcription failed";
      onError(message);
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(arrayBuffer);

    for (let i = 0; i < bytes.byteLength; i += 1) {
      binary += String.fromCharCode(bytes[i]);
    }

    return btoa(binary);
  }

  private pickSupportedMimeType(): string {
    const supportedTypes = [
      "audio/ogg;codecs=opus",
      "audio/webm;codecs=opus",
      "audio/webm",
    ];

    const matched = supportedTypes.find((type) => MediaRecorder.isTypeSupported(type));
    return matched || "audio/webm";
  }

  private normalizeMimeType(mimeType: string): string {
    const normalized = mimeType.split(";")[0]?.trim();
    return normalized || "audio/webm";
  }
}

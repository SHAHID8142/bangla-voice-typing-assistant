import OpenAI from "openai";
import { SpeechProvider, TranscriptionResult } from "../../types";

export class WhisperSpeechProvider implements SpeechProvider {
  name = "OpenAI Whisper";
  isRecording = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async startRecording(
    onResult: (result: TranscriptionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      this.isRecording = true;

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = async () => {
        this.isRecording = false;
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        await this.transcribe(audioBlob, onResult, onError);
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      this.mediaRecorder.start();
    } catch (err) {
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
    const openai = new OpenAI({
      apiKey: this.apiKey,
      dangerouslyAllowBrowser: true, // Required for client-side transcription
    });

    try {
      const file = new File([blob], "recording.webm", { type: "audio/webm" });
      const transcription = await openai.audio.transcriptions.create({
        file: file,
        model: "whisper-1",
        language: "bn", // Force Bangla
      });

      onResult({ text: transcription.text, isFinal: true });
    } catch (err: any) {
      onError(err.message || "Transcription failed");
    }
  }
}

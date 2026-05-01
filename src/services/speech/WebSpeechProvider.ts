import { SpeechProvider, TranscriptionResult } from "../../types";

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultLike>;
}

interface SpeechRecognitionErrorEventLike {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

export class WebSpeechProvider implements SpeechProvider {
  name = "Local Speech";
  isRecording = false;
  private recognition: SpeechRecognitionLike | null = null;
  private localeCandidates = ["hi-IN", "en-US"];
  private activeLocaleIndex = 0;

  async startRecording(
    onResult: (result: TranscriptionResult) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const SpeechRecognitionCtor = this.getSpeechRecognition();
    if (!SpeechRecognitionCtor) {
      onError("Local speech recognition is not available on this system.");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    this.recognition = recognition;
    this.isRecording = true;

    this.activeLocaleIndex = 0;
    recognition.lang = this.localeCandidates[this.activeLocaleIndex];
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEventLike) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (!result) continue;

        const transcript = result[0]?.transcript?.trim();
        if (!transcript) continue;

        onResult({
          text: transcript,
          isFinal: result.isFinal,
        });
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEventLike) => {
      if (event.error === "language-not-supported") {
        const nextLocaleIndex = this.activeLocaleIndex + 1;
        if (nextLocaleIndex < this.localeCandidates.length) {
          this.activeLocaleIndex = nextLocaleIndex;
          recognition.lang = this.localeCandidates[this.activeLocaleIndex];
          try {
            recognition.stop();
            recognition.start();
            return;
          } catch (_e) {
            // Fall through to generic error if restart fails.
          }
        }
      }
      onError(event.error || "Local speech recognition failed.");
    };

    recognition.onend = () => {
      this.isRecording = false;
    };

    recognition.start();
  }

  async stopRecording(): Promise<void> {
    if (this.recognition && this.isRecording) {
      this.recognition.stop();
    }
    this.isRecording = false;
  }

  private getSpeechRecognition(): SpeechRecognitionConstructor | null {
    const speechWindow = window as Window & {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };

    return speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition || null;
  }
}

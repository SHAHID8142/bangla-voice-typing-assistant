import { SpeechProvider, TranscriptionResult } from '../../types';

/**
 * A mock provider for development and testing UI/UX flows without API keys.
 * Demo mode is OFF by default - user must explicitly enable it.
 */
export class MockSpeechProvider implements SpeechProvider {
  name = "Mock STT";
  isRecording = false;
  private timeout: number | null = null;
  private demoMode: boolean = false;

  /**
   * Enable demo mode to automatically generate text every few seconds.
   * Must be explicitly called before recording.
   */
  setDemoMode(enabled: boolean) {
    this.demoMode = enabled;
  }

  async startRecording(
    onResult: (result: TranscriptionResult) => void,
    _onError: (error: string) => void
  ): Promise<void> {
    this.isRecording = true;

    if (this.demoMode) {
      const phrases = [
        "আসসালামু আলাইকুম",
        "আমি এখন কথা বলছি",
        "বাংলা ভয়েস টাইপিং চমৎকার কাজ করে",
        "ভবিষ্যৎ প্রযুক্তির মাধ্যমে",
        "সবকিছু সহজ হয়ে যাচ্ছে"
      ];

      let count = 0;
      this.timeout = window.setInterval(() => {
        if (count < phrases.length && this.isRecording) {
          onResult({ text: phrases[count], isFinal: true });
          count++;
        } else {
          this.stopRecording();
        }
      }, 3000);
    }
    // Without demoMode, this just waits - no auto text generation
  }

  async stopRecording(): Promise<void> {
    this.isRecording = false;
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}
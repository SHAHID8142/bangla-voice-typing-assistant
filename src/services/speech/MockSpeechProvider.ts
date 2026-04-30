import { SpeechProvider, TranscriptionResult } from '../../types';

/**
 * A mock provider for development and testing UI/UX flows without API keys.
 */
export class MockSpeechProvider implements SpeechProvider {
  name = "Mock STT";
  isRecording = false;
  private interval: number | null = null;

  async startRecording(onResult: (result: TranscriptionResult) => void, _onError: (error: string) => void): Promise<void> {
    this.isRecording = true;
    const phrases = [
        "আসসালামু আলাইকুম",
        "আমি এখন কথা বলছি",
        "বাংলা ভয়েস টাইপিং চমৎকার কাজ করে",
        "ভবিষ্যৎ প্রযুক্তির মাধ্যমে",
        "সবকিছু সহজ হয়ে যাচ্ছে"
    ];
    
    let count = 0;
    this.interval = window.setInterval(() => {
        if (count < phrases.length) {
            onResult({ text: phrases[count], isFinal: true });
            count++;
        } else {
            this.stopRecording();
        }
    }, 2000);
  }

  async stopRecording(): Promise<void> {
    this.isRecording = false;
    if (this.interval) {
        clearInterval(this.interval);
        this.interval = null;
    }
  }
}

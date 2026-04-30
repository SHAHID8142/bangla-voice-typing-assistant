export interface TranscriptionResult {
  text: string;
  isFinal: boolean;
}

export interface SpeechProvider {
  name: string;
  startRecording: (onResult: (result: TranscriptionResult) => void, onError: (error: string) => void) => Promise<void>;
  stopRecording: () => Promise<void>;
  isRecording: boolean;
}

export interface AIProvider {
  name: string;
  cleanText: (text: string, options: CleanupOptions) => Promise<string>;
}

export interface CleanupOptions {
  punctuationMode: 'off' | 'light' | 'standard' | 'formal';
  correctionStrength: 'minimal' | 'balanced' | 'strong';
  model?: string;
}

export interface AppSettings {
  sttProvider: string;
  sttApiKey?: string;
  aiProvider: string; // This will now act as the Primary Provider
  aiModel: string;
  secondaryAiProvider?: string;
  secondaryAiModel?: string;
  tertiaryAiProvider?: string;
  tertiaryAiModel?: string;
  ollamaUrl: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  openrouterApiKey?: string;
  autoCopy: boolean;
  autoCleanup: boolean;
  punctuationMode: CleanupOptions['punctuationMode'];
  correctionStrength: CleanupOptions['correctionStrength'];
  recordingMode: 'toggle' | 'hold';
  shortcutKey: string;
}

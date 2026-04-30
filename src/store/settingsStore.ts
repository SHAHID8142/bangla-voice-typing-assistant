import { create } from 'zustand';
import { AppSettings } from '../types';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  settings: {
    sttProvider: 'OpenAI Whisper',
    aiProvider: 'Ollama',
    aiModel: 'gemma:2b',
    secondaryAiProvider: 'Gemini',
    secondaryAiModel: 'gemini-1.5-flash',
    tertiaryAiProvider: 'OpenAI',
    tertiaryAiModel: 'gpt-4o-mini',
    ollamaUrl: 'http://localhost:11434',
    openaiApiKey: '',
    geminiApiKey: '',
    openrouterApiKey: '',
    autoCopy: true,
    autoCleanup: true,
    punctuationMode: 'standard',
    correctionStrength: 'balanced',
    recordingMode: 'toggle',
    shortcutKey: 'OptionOrAlt+Space',
  },
  updateSettings: (newSettings) => 
    set((state) => ({ settings: { ...state.settings, ...newSettings } })),
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AppSettings } from '../types';

interface SettingsState {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: {
        sttProvider: 'OpenAI Whisper',
        aiProvider: 'Ollama',
        aiModel: 'gemma4:e2b',
        secondaryAiProvider: 'OllamaCloud',
        secondaryAiModel: 'gemma4:e2b',
        tertiaryAiProvider: 'Gemini',
        tertiaryAiModel: 'gemini-1.5-flash',
        ollamaUrl: 'http://localhost:11434',
        ollamaCloudUrl: '',
        ollamaCloudApiKey: '',
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
    }),
    {
      name: 'bangla-voice-settings',
    }
  )
);

import React, { useState } from 'react';
import { Mic, Settings, HelpCircle, Copy, Trash2, Wand2, Pause, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import React, { useState, useCallback, useEffect } from 'react';
import { Mic, Settings, HelpCircle, Copy, Trash2, Wand2, Pause, Square, Loader2 } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';
import { WhisperSpeechProvider } from '../services/speech/WhisperSpeechProvider';
import { MockSpeechProvider } from '../services/speech/MockSpeechProvider';
import { OllamaProvider } from '../services/ai/OllamaProvider';
import { windowManager } from '../services/windowManager';
import { listen } from '@tauri-apps/api/event';

const MainPage: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { settings } = useSettingsStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawText, setRawText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Sync with Global/Rust Events
  useEffect(() => {
    const unlisten = listen("recording_toggled", () => {
        handleToggleRecording();
    });
    return () => { unlisten.then(f => f()); };
  }, [isRecording]);

  const handleToggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      await windowManager.hideOverlay();
      // WhisperSpeechProvider's stop is handled by the instance created in start
    } else {
      setIsRecording(true);
      await windowManager.showOverlay();
      startDictationFlow();
    }
  };

  const startDictationFlow = async () => {
    setError(null);
    const provider = settings.sttApiKey 
        ? new WhisperSpeechProvider(settings.sttApiKey) 
        : new MockSpeechProvider();

    provider.startRecording(
      (result) => {
        setRawText(prev => prev + " " + result.text);
        if (settings.autoCleanup) handleAICleanup(result.text);
      },
      (err) => {
        setError(err);
        setIsRecording(false);
        windowManager.hideOverlay();
      }
    );
  };

  const handleAICleanup = async (textToClean?: string) => {
    const targetText = textToClean || rawText;
    if (!targetText) return;

    setIsProcessing(true);
    try {
      const ai = new OllamaProvider(settings.ollamaUrl);
      const cleaned = await ai.cleanText(targetText, {
        punctuationMode: settings.punctuationMode,
        correctionStrength: settings.correctionStrength,
        model: settings.aiModel
      });
      setCorrectedText(prev => prev + " " + cleaned);
      if (settings.autoCopy) {
        // navigator.clipboard.writeText(cleaned); // Add clipboard logic
      }
    } catch (err) {
      setError("AI Cleanup failed. Is Ollama running?");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Error Toast */}
      {error && (
        <div className="absolute top-20 right-6 bg-red-50 border border-red-200 p-4 rounded-xl shadow-lg text-red-600 text-sm z-50 animate-in fade-in slide-in-from-top-4">
          {error}
        </div>
      )}

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
            <Mic className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Bangla Voice</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600">
            <HelpCircle className="w-6 h-6" />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-600"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex gap-6 p-6 overflow-hidden">
        {/* Left Column: Editor */}
        <div className="flex-1 flex flex-col gap-4 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-700">Corrected Bangla Text</span>
                {isProcessing && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigator.clipboard.writeText(correctedText)} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-slate-200"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button 
                onClick={() => { setCorrectedText(""); setRawText(""); }} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
          <textarea
            className="flex-1 p-6 text-2xl leading-relaxed resize-none focus:outline-none placeholder:text-slate-300 font-medium"
            placeholder="আপনার কথা এখানে পরিষ্কার বাংলা টেক্সট হিসেবে আসবে..."
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
          />
        </div>

        {/* Right Column: Raw Preview & Controls */}
        <div className="w-80 flex flex-col gap-6">
          {/* Raw Text Preview */}
          <div className="flex-1 flex flex-col bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest text-[10px]">Raw Transcription</span>
            </div>
            <div className="flex-1 p-5 text-slate-500 text-base italic overflow-y-auto leading-relaxed">
              {rawText || "Dictate something to see the raw output..."}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => windowManager.toggleRecording()}
              className={`w-full py-5 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-xl ${
                isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
              }`}
            >
              {isRecording ? (
                <>
                  <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
                  Stop Dictation
                </>
              ) : (
                <>
                  <Mic className="w-6 h-6" />
                  Start Dictation
                </>
              )}
            </button>
            
            <button 
              disabled={!rawText || isProcessing}
              className="w-full py-5 bg-white border border-slate-200 rounded-3xl font-bold text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => handleAICleanup()}
            >
              <Wand2 className={`w-5 h-5 text-purple-500 ${isProcessing ? 'animate-pulse' : ''}`} />
              AI Cleanup
            </button>
          </div>

          {/* Status Indicators */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">STT:</span>
              <span className="font-bold text-slate-700 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{settings.sttApiKey ? 'Whisper' : 'Mock'}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Model:</span>
              <span className="font-bold text-slate-700 px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full">{settings.aiModel}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-3 text-center text-[10px] uppercase tracking-widest font-bold text-slate-400 bg-white border-t border-slate-100">
        Local-First AI • Bangla Voice Typing Assistant
      </footer>
    </div>
  );
};

export default MainPage;

export default MainPage;

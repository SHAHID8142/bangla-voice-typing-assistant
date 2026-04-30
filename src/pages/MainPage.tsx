import React, { useState, useEffect } from 'react';
import { Mic, Settings, HelpCircle, Copy, Trash2, Wand2, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';
import { WhisperSpeechProvider } from '../services/speech/WhisperSpeechProvider';
import { MockSpeechProvider } from '../services/speech/MockSpeechProvider';
import { OllamaProvider } from '../services/ai/OllamaProvider';
import { OllamaCloudProvider } from '../services/ai/OllamaCloudProvider';
import { GeminiProvider } from '../services/ai/GeminiProvider';
import { OpenAIProvider } from '../services/ai/OpenAIProvider';
import { OpenRouterProvider } from '../services/ai/OpenRouterProvider';
import { windowManager } from '../services/windowManager';
import { listen } from '@tauri-apps/api/event';
import { Waveform } from '../components/Waveform';
import { invoke } from '@tauri-apps/api/core';
import { isRegistered, register } from '@tauri-apps/plugin-global-shortcut';

const MainPage: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { settings } = useSettingsStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawText, setRawText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Global Shortcut Registration
  useEffect(() => {
    const setupShortcut = async () => {
      try {
        const registered = await isRegistered(settings.shortcutKey);
        if (!registered) {
          await register(settings.shortcutKey, (event) => {
            if (event.state === 'Pressed') {
              if (settings.recordingMode === 'toggle') {
                handleToggleRecording();
              } else {
                // Hold to talk: Start
                startRecording();
              }
            } else if (event.state === 'Released' && settings.recordingMode === 'hold') {
               // Hold to talk: Stop
               stopRecording();
            }
          });
        }
      } catch (err) {
        console.warn("Failed to bind global shortcut", err);
      }
    };
    
    setupShortcut();
  }, [settings.shortcutKey, settings.recordingMode, isRecording]);

  useEffect(() => {
    const unlisten = listen("recording_toggled", () => {
        handleToggleRecording();
    });
    return () => { unlisten.then(f => f()); };
  }, [isRecording]);

  const startRecording = async () => {
    if (isRecording) return;
    setIsRecording(true);
    await invoke('set_tray_recording_state', { isRecording: true });
    // Tell backend not to show overlay if we are visible
    await windowManager.showOverlay(); 
    startDictationFlow();
  };

  const stopRecording = async () => {
    if (!isRecording) return;
    setIsRecording(false);
    await invoke('set_tray_recording_state', { isRecording: false });
    await windowManager.hideOverlay();
  };

  const handleToggleRecording = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
        stopRecording();
      }
    );
  };

  const executeProvider = async (providerName: string, modelName: string, text: string) => {
    let ai;
    if (providerName === "Gemini" && settings.geminiApiKey) {
      ai = new GeminiProvider(settings.geminiApiKey);
    } else if (providerName === "OpenRouter" && settings.openrouterApiKey) {
      ai = new OpenRouterProvider(settings.openrouterApiKey);
    } else if (providerName === "OpenAI" && settings.openaiApiKey) {
      ai = new OpenAIProvider(settings.openaiApiKey);
    } else if (providerName === "OllamaCloud" && settings.ollamaCloudUrl && settings.ollamaCloudApiKey) {
      ai = new OllamaCloudProvider(settings.ollamaCloudUrl, settings.ollamaCloudApiKey);
    } else if (providerName === "Ollama") {
      ai = new OllamaProvider(settings.ollamaUrl);
    } else {
      throw new Error(`Provider ${providerName} not configured or missing API key.`);
    }

    return await ai.cleanText(text, {
      punctuationMode: settings.punctuationMode,
      correctionStrength: settings.correctionStrength,
      model: modelName
    });
  };

  const handleAICleanup = async (textToClean?: string) => {
    const targetText = textToClean || rawText;
    if (!targetText) return;

    setIsProcessing(true);
    setError(null);
    
    try {
      // 1. Try Primary
      let cleaned = await executeProvider(settings.aiProvider, settings.aiModel, targetText).catch(async (e) => {
        console.warn("Primary failed", e);
        // 2. Try Secondary
        if (settings.secondaryAiProvider && settings.secondaryAiModel) {
           setError(`Primary (${settings.aiProvider}) failed. Trying fallback...`);
           return await executeProvider(settings.secondaryAiProvider, settings.secondaryAiModel, targetText).catch(async (e2) => {
              console.warn("Secondary failed", e2);
              // 3. Try Tertiary
              if (settings.tertiaryAiProvider && settings.tertiaryAiModel) {
                 setError(`Secondary (${settings.secondaryAiProvider}) failed. Trying final fallback...`);
                 return await executeProvider(settings.tertiaryAiProvider, settings.tertiaryAiModel, targetText);
              }
              throw e2;
           });
        }
        throw e;
      });

      setCorrectedText(prev => prev + " " + cleaned);
      setError(null); // Clear errors if successful
    } catch (err: any) {
      console.error("All AI cleanups failed", err);
      setError(`AI Cleanup failed. ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { type: "spring", stiffness: 120 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col h-screen bg-[#F1F5F9] text-slate-900 font-sans overflow-hidden"
    >
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-20 right-6 bg-red-50/90 backdrop-blur-xl border border-red-200 p-4 rounded-2xl shadow-2xl text-red-600 text-sm z-50 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Info className="w-4 h-4" />
            </div>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header variants={itemVariants} className="flex items-center justify-between px-10 py-6 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 z-10 relative">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-md opacity-20 rounded-full" />
            <motion.div 
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg relative z-10"
            >
              <Mic className="text-white w-6 h-6" />
            </motion.div>
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-slate-800">Bangla Voice</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Studio Edition</p>
            </div>
          </div>
        </div>

        {/* Header Waveform (Premium Touch) */}
        <div className="flex-1 max-w-[200px] mx-8">
           <Waveform isRecording={isRecording} theme="light" className="h-10 opacity-70" />
        </div>

        <div className="flex items-center gap-3">
          <button className="p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-700 shadow-sm border border-slate-100">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-700 shadow-sm border border-slate-100"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      <main className="flex-1 flex gap-8 p-10 overflow-hidden relative z-0">
        {/* Editor Area */}
        <motion.div variants={itemVariants} className="flex-1 flex flex-col gap-0 bg-white/80 backdrop-blur-3xl rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white overflow-hidden relative group">
          <div className="px-8 py-6 border-b border-slate-100/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <span className="font-black text-[12px] uppercase tracking-[0.25em] text-slate-400">Final Text</span>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-50 to-blue-50 rounded-full border border-purple-100"
                    >
                      <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                      <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest">Enhancing</span>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
            <div className="flex items-center gap-3">
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigator.clipboard.writeText(correctedText)} 
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-2xl transition-colors"
              >
                <Copy className="w-4 h-4" />
                Copy
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setCorrectedText(""); setRawText(""); }} 
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 text-xs font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </motion.button>
            </div>
          </div>
          <textarea
            className="flex-1 p-10 text-3xl leading-[1.7] resize-none focus:outline-none placeholder:text-slate-200 font-medium text-slate-800 bg-transparent selection:bg-blue-200"
            placeholder="Speak freely. Your ideas will appear here, perfectly formatted..."
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
          />
        </motion.div>

        {/* Right Sidebar */}
        <div className="w-[420px] flex flex-col gap-6">
          <motion.div variants={itemVariants} className="flex-1 flex flex-col bg-white/80 backdrop-blur-3xl rounded-[40px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)] border border-white overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-100/50">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Live Dictation</span>
            </div>
            <div className="flex-1 p-8 text-slate-500 text-xl font-medium italic overflow-y-auto leading-relaxed scrollbar-hide">
              {rawText || "Raw text will stream here as you speak..."}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <motion.button 
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onPointerDown={() => { if(settings.recordingMode==='hold') startRecording() }}
              onPointerUp={() => { if(settings.recordingMode==='hold') stopRecording() }}
              onPointerLeave={() => { if(settings.recordingMode==='hold') stopRecording() }}
              onClick={() => { if(settings.recordingMode==='toggle') handleToggleRecording() }}
              className={`w-full py-8 rounded-[32px] font-black text-2xl flex items-center justify-center gap-4 transition-all relative overflow-hidden group ${
                isRecording 
                ? 'bg-red-500 text-white shadow-[0_20px_40px_-10px_rgba(239,68,68,0.5)]' 
                : 'bg-slate-900 text-white shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] hover:bg-blue-600'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {isRecording ? (
                <>
                  <div className="w-5 h-5 bg-white rounded-full animate-ping" />
                  {settings.recordingMode === 'hold' ? 'Release to Stop' : 'Stop Dictation'}
                </>
              ) : (
                <>
                  <Mic className="w-8 h-8" />
                  {settings.recordingMode === 'hold' ? 'Hold to Talk' : 'Start Dictation'}
                </>
              )}
            </motion.button>
            
            <motion.button 
              whileHover={rawText && !isProcessing ? { scale: 1.02 } : {}}
              whileTap={rawText && !isProcessing ? { scale: 0.98 } : {}}
              disabled={!rawText || isProcessing}
              className="w-full py-6 bg-white border border-slate-100 rounded-[32px] font-black text-slate-700 text-lg flex items-center justify-center gap-3 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-100 transition-all shadow-sm disabled:opacity-40 disabled:grayscale cursor-pointer disabled:cursor-not-allowed"
              onClick={() => handleAICleanup()}
            >
              <Wand2 className={`w-6 h-6 ${isProcessing ? 'animate-bounce text-purple-500' : ''}`} />
              Magic Cleanup
            </motion.button>
          </motion.div>
        </div>
      </main>
    </motion.div>
  );
};

export default MainPage;

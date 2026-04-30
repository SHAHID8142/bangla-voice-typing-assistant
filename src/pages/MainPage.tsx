import React, { useState, useEffect } from 'react';
import { Mic, Settings, HelpCircle, Copy, Trash2, Wand2, Loader2, Info } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';
import { WhisperSpeechProvider } from '../services/speech/WhisperSpeechProvider';
import { MockSpeechProvider } from '../services/speech/MockSpeechProvider';
import { OllamaProvider } from '../services/ai/OllamaProvider';
import { GeminiProvider } from '../services/ai/GeminiProvider';
import { OpenAIProvider } from '../services/ai/OpenAIProvider';
import { OpenRouterProvider } from '../services/ai/OpenRouterProvider';
import { windowManager } from '../services/windowManager';
import { listen } from '@tauri-apps/api/event';

const MainPage: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { settings } = useSettingsStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawText, setRawText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [error, setError] = useState<string | null>(null);

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
      let ai;
      if (settings.aiProvider === "Gemini" && settings.geminiApiKey) {
        ai = new GeminiProvider(settings.geminiApiKey);
      } else if (settings.aiProvider === "OpenRouter" && settings.openrouterApiKey) {
        ai = new OpenRouterProvider(settings.openrouterApiKey);
      } else if (settings.aiProvider === "OpenAI" && settings.openaiApiKey) {
        ai = new OpenAIProvider(settings.openaiApiKey);
      } else {
        // Default to Ollama if selected or as a fallback
        ai = new OllamaProvider(settings.ollamaUrl);
      }

      const cleaned = await ai.cleanText(targetText, {
        punctuationMode: settings.punctuationMode,
        correctionStrength: settings.correctionStrength,
        model: settings.aiModel
      });
      setCorrectedText(prev => prev + " " + cleaned);
    } catch (err: any) {
      console.error(err);
      setError(`AI Cleanup failed. ${err.message || "Is the provider configured correctly?"}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 font-sans overflow-hidden"
    >
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-20 right-6 bg-red-50 border border-red-200 p-4 rounded-2xl shadow-2xl text-red-600 text-sm z-50 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <Info className="w-4 h-4" />
            </div>
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.header variants={itemVariants} className="flex items-center justify-between px-8 py-5 bg-white border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-3">
          <motion.div 
            whileHover={{ rotate: 15 }}
            className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200"
          >
            <Mic className="text-white w-6 h-6" />
          </motion.div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-800">Bangla Voice</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">AI Dictation Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-600">
            <HelpCircle className="w-5 h-5" />
          </button>
          <button 
            onClick={onOpenSettings}
            className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </motion.header>

      <main className="flex-1 flex gap-8 p-8 overflow-hidden">
        <motion.div variants={itemVariants} className="flex-1 flex flex-col gap-4 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden relative group transition-all hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)]">
          <div className="px-8 py-5 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
            <div className="flex items-center gap-3">
                <span className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Editor</span>
                <AnimatePresence>
                  {isProcessing && (
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 px-2 py-0.5 bg-purple-50 rounded-full"
                    >
                      <Loader2 className="w-3 h-3 text-purple-500 animate-spin" />
                      <span className="text-[10px] font-bold text-purple-600 uppercase tracking-tighter">Cleaning...</span>
                    </motion.div>
                  )}
                </AnimatePresence>
            </div>
            <div className="flex items-center gap-2">
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigator.clipboard.writeText(correctedText)} 
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-white hover:text-blue-600 rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setCorrectedText(""); setRawText(""); }} 
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-500 hover:bg-white hover:text-red-600 rounded-xl transition-all border border-transparent hover:border-slate-100 shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
              </motion.button>
            </div>
          </div>
          <textarea
            className="flex-1 p-8 text-2xl leading-[1.6] resize-none focus:outline-none placeholder:text-slate-200 font-medium text-slate-700 selection:bg-blue-100"
            placeholder="আপনার কথা এখানে পরিষ্কার বাংলা টেক্সট হিসেবে আসবে..."
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
          />
        </motion.div>

        <div className="w-96 flex flex-col gap-8">
          <motion.div variants={itemVariants} className="flex-1 flex flex-col bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 overflow-hidden group hover:shadow-[0_8px_40px_rgb(0,0,0,0.06)] transition-all">
            <div className="px-6 py-4 border-b border-slate-50 bg-slate-50/30">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Raw Dictation</span>
            </div>
            <div className="flex-1 p-6 text-slate-400 text-lg italic overflow-y-auto leading-relaxed scrollbar-hide">
              {rawText || "Start dictating to see raw output..."}
            </div>
          </motion.div>

          <motion.div variants={itemVariants} className="flex flex-col gap-4">
            <motion.button 
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => windowManager.toggleRecording()}
              className={`w-full py-6 rounded-[28px] font-black text-xl flex items-center justify-center gap-4 transition-all shadow-2xl ${
                isRecording 
                ? 'bg-red-500 text-white shadow-red-200' 
                : 'bg-blue-600 text-white shadow-blue-200'
              }`}
            >
              {isRecording ? (
                <>
                  <div className="w-4 h-4 bg-white rounded-full animate-ping" />
                  Stop
                </>
              ) : (
                <>
                  <Mic className="w-7 h-7" />
                  Dictate
                </>
              )}
            </motion.button>
            
            <motion.button 
              whileHover={rawText && !isProcessing ? { scale: 1.02 } : {}}
              whileTap={rawText && !isProcessing ? { scale: 0.98 } : {}}
              disabled={!rawText || isProcessing}
              className="w-full py-5 bg-white border border-slate-100 rounded-[28px] font-black text-slate-600 flex items-center justify-center gap-4 hover:bg-slate-50 transition-all shadow-lg shadow-slate-100 disabled:opacity-30 disabled:grayscale cursor-pointer disabled:cursor-not-allowed"
              onClick={() => handleAICleanup()}
            >
              <Wand2 className={`w-5 h-5 text-purple-500 ${isProcessing ? 'animate-bounce' : ''}`} />
              Magic Cleanup
            </motion.button>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-slate-100/40 p-6 rounded-[32px] border border-slate-100 space-y-4">
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400 uppercase tracking-widest">STT Engine</span>
              <span className="text-blue-600 px-3 py-1 bg-blue-50 rounded-full">{settings.sttApiKey ? 'Whisper' : 'Mock'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400 uppercase tracking-widest">AI Brain</span>
              <span className="text-purple-600 px-3 py-1 bg-purple-50 rounded-full">{settings.aiProvider}: {settings.aiModel}</span>
            </div>
          </motion.div>
        </div>
      </main>

      <motion.footer 
        variants={itemVariants}
        className="px-8 py-4 text-center text-[9px] uppercase tracking-[0.3em] font-black text-slate-300 bg-white border-t border-slate-50"
      >
        Developed for Professional Bangla Dictation • 2026
      </motion.footer>
    </motion.div>
  );
};

export default MainPage;

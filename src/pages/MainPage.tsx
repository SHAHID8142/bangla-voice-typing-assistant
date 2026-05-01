import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Mic,
  Settings,
  Copy,
  Trash2,
  Wand2,
  Loader2,
  Check,
  Sparkles,
  FileText,
  AudioLines,
  Workflow,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';
import { WhisperSpeechProvider } from '../services/speech/WhisperSpeechProvider';
import { GeminiSpeechProvider } from '../services/speech/GeminiSpeechProvider';
import { MockSpeechProvider } from '../services/speech/MockSpeechProvider';
import { OllamaProvider } from '../services/ai/OllamaProvider';
import { OllamaCloudProvider } from '../services/ai/OllamaCloudProvider';
import { GeminiProvider } from '../services/ai/GeminiProvider';
import { OpenAIProvider } from '../services/ai/OpenAIProvider';
import { OpenRouterProvider } from '../services/ai/OpenRouterProvider';
import { windowManager } from '../services/windowManager';
import { listen } from '@tauri-apps/api/event';
import { register, unregister } from '@tauri-apps/plugin-global-shortcut';
import { SpeechProvider } from '../types';
import { useVoiceReactiveWaveform } from '../hooks/useVoiceReactiveWaveform';

const PRIMARY_WAVE_BARS = 28;
const RIBBON_WAVE_BARS = 46;

const MainPage: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const { settings, updateSettings } = useSettingsStore();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawText, setRawText] = useState('');
  const [correctedText, setCorrectedText] = useState('');
  const [focusView, setFocusView] = useState<'raw' | 'cleaned'>('raw');
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'raw' | 'corrected' | null>(null);
  const providerRef = useRef<SpeechProvider | null>(null);
  const { levels: voiceLevels, energy: voiceEnergy } = useVoiceReactiveWaveform(isRecording, 64);
  const uiMode = settings.uiMode || 'focus';

  const getAIProvider = useCallback(
    (providerName: string, overrides?: { ollamaUrl?: string }) => {
      if (providerName === 'Gemini' && settings.geminiApiKey) return new GeminiProvider(settings.geminiApiKey);
      if (providerName === 'OpenRouter' && settings.openrouterApiKey) return new OpenRouterProvider(settings.openrouterApiKey);
      if (providerName === 'OpenAI' && settings.openaiApiKey) return new OpenAIProvider(settings.openaiApiKey);
      if (providerName === 'OllamaCloud' && settings.ollamaCloudUrl && settings.ollamaCloudApiKey) {
        return new OllamaCloudProvider(settings.ollamaCloudUrl, settings.ollamaCloudApiKey);
      }
      if (providerName === 'Ollama') return new OllamaProvider(overrides?.ollamaUrl || settings.ollamaUrl);
      return null;
    },
    [settings],
  );

  const executeProvider = async (
    providerName: string,
    modelName: string,
    text: string,
    overrides?: { ollamaUrl?: string },
  ): Promise<string> => {
    const ai = getAIProvider(providerName, overrides);
    if (!ai) throw new Error(`Provider ${providerName} not configured`);

    const resolveModelForProvider = (provider: string, rawModel?: string) => {
      const model = (rawModel || '').trim();

      if (provider === 'Gemini') {
        if (!model || model.includes(':') || model.startsWith('gpt-')) return 'gemini-2.5-flash';
        return model.replace(/^models\//, '');
      }

      if (provider === 'OpenAI') {
        if (!model || model.includes(':') || model.startsWith('gemini-')) return 'gpt-4o-mini';
        return model;
      }

      if (provider === 'Ollama' || provider === 'OllamaCloud') {
        if (!model || model.startsWith('gemini-') || model.startsWith('gpt-')) return 'gemma4:e2b';
        return model;
      }

      if (provider === 'OpenRouter') {
        return model || 'openrouter/auto';
      }

      return model || undefined;
    };

    return ai.cleanText(text, {
      punctuationMode: settings.punctuationMode,
      correctionStrength: settings.correctionStrength,
      model: resolveModelForProvider(providerName, modelName),
    });
  };

  const getSpeechProvider = useCallback((): SpeechProvider | null => {
    const openaiApiKey = settings.openaiApiKey?.trim();
    const geminiApiKey = settings.geminiApiKey?.trim();

    if (settings.sttProvider === 'Mock') return new MockSpeechProvider();

    if (settings.sttProvider === 'OpenAI Whisper' && openaiApiKey) {
      return new WhisperSpeechProvider(openaiApiKey);
    }

    if (settings.sttProvider === 'Gemini' && geminiApiKey) {
      return new GeminiSpeechProvider(geminiApiKey);
    }

    if (openaiApiKey) return new WhisperSpeechProvider(openaiApiKey);
    if (geminiApiKey) return new GeminiSpeechProvider(geminiApiKey);

    return null;
  }, [settings.openaiApiKey, settings.geminiApiKey, settings.sttProvider]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    try { if (providerRef.current) await providerRef.current.stopRecording(); } catch (e) { console.warn('Failed to stop provider:', e); }
    try { await windowManager.hideOverlay(); } catch (_e) { /* optional UI sync */ }
  }, []);

  const handleAICleanup = useCallback(
    async (textToClean?: string) => {
      const targetText = textToClean || rawText;
      if (!targetText?.trim()) return;

      setIsProcessing(true);
      setError(null);

      try {
        const aiModel = settings.aiModel?.trim() || '';
        const shouldForceLocalOllama =
          settings.sttProvider === 'Gemma 4 E2B' ||
          settings.aiProvider === 'Ollama' ||
          aiModel.includes(':');

        const primaryChain = shouldForceLocalOllama
          ? [{ provider: 'Ollama', model: aiModel || 'gemma4:e2b' }]
          : [];

        const fallbackChain = shouldForceLocalOllama
          ? []
          : [
              { provider: settings.aiProvider, model: settings.aiModel },
              { provider: settings.secondaryAiProvider, model: settings.secondaryAiModel },
              { provider: settings.tertiaryAiProvider, model: settings.tertiaryAiModel },
            ];

        const chain = [...primaryChain, ...fallbackChain].filter((p) => p.provider);

        let cleaned = targetText;
        let lastError: Error | null = null;

        for (const p of chain) {
          try {
            if (p.provider === 'Ollama') {
              const ollamaCandidates = Array.from(
                new Set(
                  [settings.ollamaUrl, settings.lastWorkingOllamaUrl]
                    .map((value) => value?.trim())
                    .filter((value): value is string => Boolean(value)),
                ),
              );

              let ollamaSucceeded = false;
              let ollamaError: Error | null = null;

              for (const candidateUrl of ollamaCandidates) {
                try {
                  cleaned = await executeProvider('Ollama', p.model!, cleaned, { ollamaUrl: candidateUrl });
                  if (candidateUrl !== settings.lastWorkingOllamaUrl) {
                    updateSettings({ lastWorkingOllamaUrl: candidateUrl });
                  }
                  ollamaSucceeded = true;
                  break;
                } catch (err: unknown) {
                  ollamaError = err instanceof Error ? err : new Error('Unknown Ollama error');
                }
              }

              if (!ollamaSucceeded) {
                if (ollamaError) throw ollamaError;
                throw new Error('No reachable Ollama endpoint found.');
              }
            } else {
              cleaned = await executeProvider(p.provider!, p.model!, cleaned);
            }
            break;
          } catch (e: unknown) {
            lastError = e instanceof Error ? e : new Error('Unknown cleanup error');
          }
        }

        if (lastError && cleaned === targetText) {
          if (shouldForceLocalOllama) {
            throw new Error(
              `Could not use local Ollama at ${settings.ollamaUrl}. If Ollama runs on another PC, set Ollama URL to http://<PC-IP>:11434 and start Ollama with OLLAMA_HOST=0.0.0.0.`,
            );
          }
          throw lastError;
        }
        setCorrectedText((prev) => `${prev} ${cleaned}`.trim());
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'AI Cleanup failed';
        setError(`AI Cleanup failed: ${message}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [rawText, settings, executeProvider, updateSettings],
  );

  const startRecording = useCallback(async () => {
    if (isRecording) return;

    setIsRecording(true);
    setError(null);

    try {
      const provider = getSpeechProvider();
      if (!provider) {
        setIsRecording(false);
        setError('No speech API key found. Add OpenAI or Gemini key in API Keys section.');
        return;
      }
      if (provider instanceof MockSpeechProvider) provider.setDemoMode(settings.demoMode || false);

      providerRef.current = provider;

      await provider.startRecording(
        (result) => {
          if (!result.text?.trim()) return;
          setRawText((prev) => `${prev} ${result.text}`.trim());
          if (settings.autoCleanup && result.isFinal) {
            void handleAICleanup(result.text);
          }
        },
        (err) => {
          setError(err);
          void stopRecording();
        },
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to start recording';
      setError(message);
      void stopRecording();
    }
  }, [isRecording, getSpeechProvider, settings.demoMode, settings.autoCleanup, handleAICleanup, stopRecording]);

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) await stopRecording();
    else await startRecording();
  }, [isRecording, startRecording, stopRecording]);

  useEffect(() => {
    let mounted = true;

    const setupShortcut = async () => {
      try {
        try {
          await unregister(settings.shortcutKey);
        } catch (_e) {
          // ignore stale shortcut failures
        }

        if (!mounted) return;

        await register(settings.shortcutKey, (event) => {
          if (event.state === 'Pressed') {
            if (settings.recordingMode === 'toggle') void handleToggleRecording();
            else void startRecording();
          } else if (event.state === 'Released' && settings.recordingMode === 'hold') {
            void stopRecording();
          }
        });
      } catch (err) {
        console.warn('Failed to bind global shortcut:', err);
      }
    };

    void setupShortcut();

    return () => {
      mounted = false;
      unregister(settings.shortcutKey).catch(() => {});
    };
  }, [settings.shortcutKey, settings.recordingMode, handleToggleRecording, startRecording, stopRecording]);

  useEffect(() => {
    const unlistenPromise = listen('recording_toggled', () => void handleToggleRecording());
    return () => {
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [handleToggleRecording]);

  useEffect(() => {
    return () => {
      providerRef.current?.stopRecording().catch(() => {});
    };
  }, []);

  const copyToClipboard = async (text: string, type: 'raw' | 'corrected') => {
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
  };

  const clearAll = () => {
    setRawText('');
    setCorrectedText('');
    setError(null);
  };

  const wordCount = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 pb-4 pt-3 text-slate-50 md:px-6">
      <header className="panel-glass relative z-10 rounded-[26px] p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-cyan-200/75">Bangla Voice Lab</p>
            <h1 className="mt-1 text-xl font-bold leading-tight md:text-2xl">
              <span className="gradient-brand">Playful Speech Studio</span>
            </h1>
            <p className="mt-1.5 text-xs text-slate-300/80">Capture. Clean. Copy. Faster than typing.</p>
          </div>

          <motion.button
            onClick={onOpenSettings}
            whileHover={{ scale: 1.06, rotate: 4 }}
            whileTap={{ scale: 0.94 }}
            className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-3 text-cyan-100 transition-colors hover:bg-cyan-300/20"
          >
            <Settings className="h-5 w-5" />
          </motion.button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-4">
          <div className="rounded-xl border border-cyan-200/15 bg-cyan-200/5 px-2.5 py-2 text-cyan-100/85">
            STT: {settings.sttProvider}
          </div>
          <div className="rounded-xl border border-lime-200/15 bg-lime-200/5 px-2.5 py-2 text-lime-100/85">
            AI: {settings.aiProvider}
          </div>
          <div className="rounded-xl border border-orange-200/15 bg-orange-200/5 px-2.5 py-2 text-orange-100/85">
            Model: {settings.aiModel}
          </div>
          <div className="rounded-xl border border-slate-200/15 bg-slate-200/5 px-2.5 py-2 text-slate-100/85">
            Mode: {settings.recordingMode}
          </div>
        </div>

        <div className="mt-3 inline-flex rounded-xl border border-slate-200/15 bg-slate-100/5 p-1 text-xs">
          <button
            onClick={() => updateSettings({ uiMode: 'focus' })}
            className={`rounded-lg px-3 py-1.5 transition ${uiMode === 'focus' ? 'bg-cyan-300/25 text-cyan-100' : 'text-slate-300 hover:text-slate-100'}`}
          >
            Focus Mode
          </button>
          <button
            onClick={() => updateSettings({ uiMode: 'studio' })}
            className={`rounded-lg px-3 py-1.5 transition ${uiMode === 'studio' ? 'bg-lime-300/25 text-lime-100' : 'text-slate-300 hover:text-slate-100'}`}
          >
            Studio Mode
          </button>
        </div>
      </header>

      <section className="relative z-10 mt-4 panel-glass rounded-[26px] p-4 md:p-6">
        <div className="flex flex-col items-center gap-4">
          <motion.button
            onClick={() => void handleToggleRecording()}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.92 }}
            className={`relative grid h-24 w-24 place-items-center rounded-[28px] border border-white/20 text-white transition-all ${
              isRecording
                ? 'bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300 record-glow'
                : 'bg-gradient-to-br from-cyan-500 via-teal-400 to-lime-300 idle-glow'
            }`}
          >
            <AnimatePresence mode="wait">
              {isRecording ? (
                <motion.div
                  key="recording-stop"
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 90 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                  className="h-7 w-7 rounded-md bg-white"
                />
              ) : (
                <motion.div
                  key="recording-mic"
                  initial={{ scale: 0, rotate: 100 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -100 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 20 }}
                >
                  <Mic className="h-9 w-9" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="w-full max-w-[560px] rounded-2xl border border-cyan-200/15 bg-[#0d2536]/70 px-3 py-3">
            <div className="flex items-center justify-between text-[11px] text-slate-300/90">
              <span className="inline-flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-orange-300 dot-blink' : 'bg-lime-300'}`} />
                {isRecording ? 'Live capture' : 'Idle'}
              </span>
              <span className="font-mono">{settings.shortcutKey.split('+').pop()}</span>
            </div>

            <div className="mt-2 flex h-16 items-end justify-center gap-1 overflow-hidden">
              {Array.from({ length: PRIMARY_WAVE_BARS }).map((_, index) => {
                const sampled = voiceLevels[(index * 2) % voiceLevels.length] || 0.05;
                const base = 8;
                const height = base + sampled * 42;

                return (
                  <motion.div
                    key={`main-wave-${index}`}
                    className="w-1.5 rounded-full shadow-[0_0_14px_rgba(255,216,95,0.35)]"
                    style={{
                      background: isRecording
                        ? 'linear-gradient(180deg, rgba(255,216,95,0.98), rgba(255,122,98,0.95))'
                        : 'linear-gradient(180deg, rgba(158,242,107,0.85), rgba(53,211,242,0.7))',
                    }}
                    animate={{
                      height,
                      opacity: isRecording ? [0.58, 1, 0.58] : [0.45, 0.68, 0.45],
                    }}
                    transition={{ duration: 0.46, repeat: Infinity, ease: 'easeInOut', delay: index * 0.012 }}
                  />
                );
              })}
            </div>
          </div>

          <p className="text-xs text-slate-300/90">
            {isRecording ? 'Tap to stop recording' : 'Tap to start recording'}
          </p>
        </div>
      </section>

      <AnimatePresence>
        {isRecording && (
          <motion.section
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 78 }}
            exit={{ opacity: 0, y: -6, height: 0 }}
            transition={{ duration: 0.26 }}
            className="relative z-10 mt-3 overflow-hidden rounded-2xl border border-orange-200/20 bg-orange-200/10"
          >
            <motion.div
              className="pointer-events-none absolute inset-0"
              animate={{
                opacity: [0.35, 0.62, 0.35],
              }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: `radial-gradient(circle at center, rgba(255, 173, 86, ${Math.min(
                  0.36,
                  0.16 + voiceEnergy * 0.28,
                )}), transparent 72%)`,
              }}
            />
            <div className="flex h-full items-end justify-center gap-[5px] px-4 pb-3">
              {Array.from({ length: RIBBON_WAVE_BARS }).map((_, index) => {
                const sampled = voiceLevels[(index + 7) % voiceLevels.length] || 0.05;
                const sampledMirror = voiceLevels[(voiceLevels.length - 1 - index + voiceLevels.length) % voiceLevels.length] || 0.05;
                const size = 8 + (sampled + sampledMirror) * 18;
                return (
                  <motion.div
                    key={`ribbon-wave-${index}`}
                    className="w-1 rounded-full shadow-[0_0_12px_rgba(255,171,98,0.35)]"
                    style={{ background: 'linear-gradient(180deg, rgba(255,216,95,0.95), rgba(255,122,98,0.85))' }}
                    animate={{ height: size, opacity: [0.4, 0.95, 0.4] }}
                    transition={{ duration: 0.58, repeat: Infinity, delay: index * 0.009, ease: 'easeInOut' }}
                  />
                );
              })}
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      <main className="relative z-10 mt-3 min-h-0 flex-1 overflow-y-auto">
        {uiMode === 'focus' ? (
          <section className="panel-glass rounded-3xl p-4">
            <div className="inline-flex rounded-xl border border-slate-200/15 bg-slate-100/5 p-1 text-xs">
              <button
                onClick={() => setFocusView('raw')}
                className={`rounded-lg px-3 py-1.5 transition ${focusView === 'raw' ? 'bg-cyan-300/25 text-cyan-100' : 'text-slate-300'}`}
              >
                Raw
              </button>
              <button
                onClick={() => setFocusView('cleaned')}
                className={`rounded-lg px-3 py-1.5 transition ${focusView === 'cleaned' ? 'bg-lime-300/25 text-lime-100' : 'text-slate-300'}`}
              >
                Cleaned
              </button>
            </div>

            <div className="mt-3 rounded-2xl border border-cyan-200/15 bg-[#0a2030]/65 p-4 min-h-[260px]">
              {focusView === 'raw' ? (
                rawText ? (
                  <p className="bangla-text text-[15px] leading-7 text-slate-100">{rawText}</p>
                ) : (
                  <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-slate-400">
                    <AudioLines className="mb-2 h-8 w-8 text-cyan-200/60" />
                    <p className="text-sm">Your spoken words appear here in real-time.</p>
                  </div>
                )
              ) : correctedText ? (
                <p className="bangla-text text-[15px] leading-7 text-slate-100">{correctedText}</p>
              ) : (
                <div className="flex h-full min-h-[220px] flex-col items-center justify-center text-center text-slate-400">
                  <Sparkles className="mb-2 h-8 w-8 text-lime-200/60" />
                  <p className="text-sm">Run AI Cleanup to see polished output.</p>
                </div>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ y: -1 }}
                onClick={() => void handleAICleanup(rawText)}
                disabled={!rawText || isProcessing}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/20 bg-gradient-to-r from-emerald-300/25 via-lime-300/30 to-cyan-300/25 px-3 py-2 text-sm font-semibold text-emerald-50 disabled:opacity-40"
              >
                {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                AI Cleanup
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                whileHover={{ y: -1 }}
                onClick={() => void copyToClipboard(focusView === 'raw' ? rawText : correctedText, focusView === 'raw' ? 'raw' : 'corrected')}
                disabled={focusView === 'raw' ? !rawText : !correctedText}
                className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 p-2.5 text-cyan-100 disabled:opacity-35"
              >
                {copied === (focusView === 'raw' ? 'raw' : 'corrected') ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.94 }}
                whileHover={{ y: -1 }}
                onClick={clearAll}
                disabled={!rawText && !correctedText}
                className="rounded-xl border border-rose-200/20 bg-rose-200/10 p-2.5 text-rose-100 disabled:opacity-35"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            </div>
          </section>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <section className="panel-glass rounded-3xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-cyan-100">
                    <FileText className="h-4 w-4" />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">Raw Transcript</h2>
                  </div>
                  <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-2 py-0.5 text-[10px] text-cyan-100/90">
                    {wordCount(rawText)} words
                  </span>
                </div>

                <div className="mt-3 rounded-2xl border border-cyan-200/15 bg-[#0a2030]/65 p-4 min-h-[180px]">
                  {rawText ? (
                    <p className="bangla-text text-[15px] leading-7 text-slate-100">{rawText}</p>
                  ) : (
                    <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-center text-slate-400">
                      <AudioLines className="mb-2 h-8 w-8 text-cyan-200/60" />
                      <p className="text-sm">Your spoken words appear here in real-time.</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ y: -1 }}
                    onClick={() => void copyToClipboard(rawText, 'raw')}
                    disabled={!rawText}
                    className="rounded-xl border border-cyan-200/20 bg-cyan-200/10 p-2.5 text-cyan-100 disabled:opacity-35"
                  >
                    {copied === 'raw' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ y: -1 }}
                    onClick={() => setRawText('')}
                    disabled={!rawText}
                    className="rounded-xl border border-rose-200/20 bg-rose-200/10 p-2.5 text-rose-100 disabled:opacity-35"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </section>

              <section className="panel-glass rounded-3xl p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-lime-100">
                    <Workflow className="h-4 w-4" />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.16em]">AI Cleaned</h2>
                  </div>
                  <span className="rounded-full border border-lime-200/20 bg-lime-200/10 px-2 py-0.5 text-[10px] text-lime-100/90">
                    {wordCount(correctedText)} words
                  </span>
                </div>

                <div className="mt-3 rounded-2xl border border-lime-200/15 bg-[#0d251f]/65 p-4 min-h-[180px]">
                  {correctedText ? (
                    <p className="bangla-text text-[15px] leading-7 text-slate-100">{correctedText}</p>
                  ) : (
                    <div className="flex h-full min-h-[140px] flex-col items-center justify-center text-center text-slate-400">
                      <Sparkles className="mb-2 h-8 w-8 text-lime-200/60" />
                      <p className="text-sm">Cleaner, punctuated Bangla text appears here.</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    whileHover={{ y: -1 }}
                    onClick={() => void handleAICleanup(rawText)}
                    disabled={!rawText || isProcessing}
                    className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/20 bg-gradient-to-r from-emerald-300/25 via-lime-300/30 to-cyan-300/25 px-3 py-2 text-sm font-semibold text-emerald-50 disabled:opacity-40"
                  >
                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    AI Cleanup
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ y: -1 }}
                    onClick={() => void copyToClipboard(correctedText, 'corrected')}
                    disabled={!correctedText}
                    className="rounded-xl border border-lime-200/20 bg-lime-200/10 p-2.5 text-lime-100 disabled:opacity-35"
                  >
                    {copied === 'corrected' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    whileHover={{ y: -1 }}
                    onClick={() => setCorrectedText('')}
                    disabled={!correctedText}
                    className="rounded-xl border border-rose-200/20 bg-rose-200/10 p-2.5 text-rose-100 disabled:opacity-35"
                  >
                    <Trash2 className="h-4 w-4" />
                  </motion.button>
                </div>
              </section>
            </div>

            <div className="mt-3 panel-glass rounded-2xl p-3">
              <button
                onClick={clearAll}
                disabled={!rawText && !correctedText}
                className="w-full rounded-xl border border-slate-200/10 bg-slate-200/5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-slate-200/10 disabled:opacity-35"
              >
                Clear all text
              </button>
            </div>
          </>
        )}
      </main>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 24, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 24, x: '-50%' }}
            className="absolute bottom-5 left-1/2 z-[100] flex max-w-[92%] items-center gap-2 rounded-2xl border border-rose-300/30 bg-[#3a1b1f]/92 px-4 py-3 text-sm text-rose-100 shadow-2xl"
          >
            <span className="h-2 w-2 rounded-full bg-rose-300 dot-blink" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-2 text-base text-rose-200/90">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MainPage;

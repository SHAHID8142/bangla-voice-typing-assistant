import React, { useEffect, useState } from 'react';
import { ChevronLeft, Keyboard, Mic2, Cpu, Wand2, ToggleLeft, Radio } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '../store/settingsStore';
import { CleanupOptions, STTProviderName } from '../types';

const normalizeKey = (key: string) => {
  const lower = key.toLowerCase();
  if (lower === ' ') return 'Space';
  if (lower === 'arrowup') return 'Up';
  if (lower === 'arrowdown') return 'Down';
  if (lower === 'arrowleft') return 'Left';
  if (lower === 'arrowright') return 'Right';
  if (lower === 'escape') return 'Esc';
  if (lower === 'control') return 'Ctrl';
  if (lower === 'alt') return 'Alt';
  if (lower === 'shift') return 'Shift';
  if (lower === 'meta') return 'Meta';
  return key.length === 1 ? key.toUpperCase() : key;
};

const buildShortcutFromEvent = (event: KeyboardEvent): string | null => {
  const parts: string[] = [];
  const hasModifier = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;

  if (!hasModifier) return null;

  if (event.ctrlKey || event.metaKey) parts.push('CommandOrControl');
  if (event.altKey) parts.push('Alt');
  if (event.shiftKey) parts.push('Shift');

  const normalized = normalizeKey(event.key);
  const modifierOnly = ['Ctrl', 'Alt', 'Shift', 'Meta'].includes(normalized);
  if (!modifierOnly) parts.push(normalized);

  if (!parts.length || modifierOnly) return null;
  return parts.join('+');
};

const SettingsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings, updateSettings } = useSettingsStore();
  const [isCapturingShortcut, setIsCapturingShortcut] = useState(false);
  const [shortcutDraft, setShortcutDraft] = useState(settings.shortcutKey);
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  const [isDiscoveringOllama, setIsDiscoveringOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<string | null>(null);
  const [discoveredOllamaUrls, setDiscoveredOllamaUrls] = useState<string[]>([]);
  const hasSpeechApiKey = Boolean(settings.openaiApiKey?.trim() || settings.geminiApiKey?.trim());

  const normalizeOllamaUrl = (value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
    return withScheme.replace(/\/+$/, '');
  };

  const extractHost = (endpoint: string): string | null => {
    try {
      const parsed = new URL(normalizeOllamaUrl(endpoint));
      return parsed.hostname;
    } catch (_e) {
      return null;
    }
  };

  const testOllamaEndpoint = async (endpoint: string): Promise<{ ok: boolean; modelCount?: number; error?: string }> => {
    const normalized = normalizeOllamaUrl(endpoint);
    if (!normalized) return { ok: false, error: 'Endpoint is empty.' };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`${normalized}/api/tags`, { signal: controller.signal });
      if (!response.ok) {
        return { ok: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      const modelCount = Array.isArray(data?.models) ? data.models.length : 0;
      return { ok: true, modelCount };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Network error';
      return { ok: false, error: message };
    } finally {
      clearTimeout(timeout);
    }
  };

  const getLocalIPv4Hosts = async (): Promise<string[]> => {
    const hosts = new Set<string>();
    const baseHost = extractHost(settings.ollamaUrl || '');
    const lastHost = extractHost(settings.lastWorkingOllamaUrl || '');
    if (baseHost) hosts.add(baseHost);
    if (lastHost) hosts.add(lastHost);

    hosts.add('localhost');
    hosts.add('127.0.0.1');

    if (typeof RTCPeerConnection === 'undefined') {
      return Array.from(hosts);
    }

    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      pc.createDataChannel('probe');
      const localIps = new Set<string>();
      const ipPattern = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/;

      pc.onicecandidate = (event) => {
        const candidate = event.candidate;
        if (!candidate) return;
        const directAddress = (candidate as RTCIceCandidate & { address?: string }).address;
        if (directAddress && ipPattern.test(directAddress)) localIps.add(directAddress);
        const raw = candidate.candidate;
        const matched = raw?.match(ipPattern);
        if (matched?.[1]) localIps.add(matched[1]);
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await new Promise((resolve) => setTimeout(resolve, 1200));
      pc.close();

      localIps.forEach((ip) => hosts.add(ip));
      localIps.forEach((ip) => {
        const parts = ip.split('.');
        if (parts.length !== 4) return;
        const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
        [2, 3, 4, 5, 10, 11, 12, 20, 21, 22, 30].forEach((tail) => hosts.add(`${prefix}.${tail}`));
      });
    } catch (_e) {
      // discovery is best-effort
    }

    return Array.from(hosts);
  };

  const runOllamaConnectivityTest = async (endpoint: string) => {
    setIsTestingOllama(true);
    setOllamaStatus('Testing Ollama connection...');
    const result = await testOllamaEndpoint(endpoint);
    const normalized = normalizeOllamaUrl(endpoint);

    if (result.ok) {
      updateSettings({ ollamaUrl: normalized, lastWorkingOllamaUrl: normalized });
      setOllamaStatus(`Connected. Found ${result.modelCount ?? 0} model(s).`);
    } else {
      setOllamaStatus(`Failed: ${result.error || 'Unable to connect'}`);
    }

    setIsTestingOllama(false);
  };

  const discoverOllamaEndpoints = async () => {
    setIsDiscoveringOllama(true);
    setOllamaStatus('Discovering Ollama endpoints on local network...');
    setDiscoveredOllamaUrls([]);

    const hosts = await getLocalIPv4Hosts();
    const endpoints = hosts.map((host) => `http://${host}:11434`);
    const checks = await Promise.all(
      endpoints.map(async (endpoint) => {
        const result = await testOllamaEndpoint(endpoint);
        return { endpoint: normalizeOllamaUrl(endpoint), result };
      }),
    );

    const working = checks.filter((item) => item.result.ok).map((item) => item.endpoint);
    setDiscoveredOllamaUrls(working);

    if (working.length) {
      const preferred = working[0];
      updateSettings({ ollamaUrl: preferred, lastWorkingOllamaUrl: preferred });
      setOllamaStatus(`Discovered ${working.length} endpoint(s). Using ${preferred}.`);
    } else {
      setOllamaStatus('No reachable Ollama endpoint discovered. Verify OLLAMA_HOST and firewall.');
    }

    setIsDiscoveringOllama(false);
  };

  const SectionCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    tone: string;
    children: React.ReactNode;
  }> = ({ icon, title, tone, children }) => (
    <section className="space-y-2.5">
      <div className={`inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] ${tone}`}>
        {icon}
        {title}
      </div>
      <div className="panel-glass rounded-3xl p-4 md:p-5">{children}</div>
    </section>
  );

  const Toggle = ({ enabled, onClick }: { enabled: boolean; onClick: () => void }) => (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      className={`relative h-7 w-12 rounded-full border transition-colors ${enabled ? 'border-lime-200/40 bg-lime-300/50' : 'border-slate-200/20 bg-slate-500/25'}`}
    >
      <motion.div
        animate={{ left: enabled ? 24 : 3 }}
        transition={{ type: 'spring', stiffness: 450, damping: 27 }}
        className="absolute top-[3px] h-5 w-5 rounded-full bg-white"
      />
    </motion.button>
  );

  const inputClass =
    'w-full rounded-2xl border border-slate-200/15 bg-slate-100/5 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-400/70 outline-none transition focus:border-cyan-300/40';

  useEffect(() => {
    setShortcutDraft(settings.shortcutKey);
  }, [settings.shortcutKey]);

  useEffect(() => {
    if (!isCapturingShortcut) return;

    const onKeyDown = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const capturedShortcut = buildShortcutFromEvent(event);
      if (!capturedShortcut) return;

      setShortcutDraft(capturedShortcut);
      updateSettings({ shortcutKey: capturedShortcut });
      setIsCapturingShortcut(false);
    };

    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [isCapturingShortcut, updateSettings]);

  return (
    <div className="flex h-full flex-col overflow-hidden px-4 pb-4 pt-3 md:px-6">
      <header className="panel-glass rounded-[26px] p-4 md:p-5">
        <div className="flex items-start gap-3">
          <motion.button
            whileTap={{ scale: 0.93 }}
            whileHover={{ y: -1 }}
            onClick={onBack}
            className="rounded-2xl border border-cyan-200/20 bg-cyan-300/10 p-2.5 text-cyan-100"
          >
            <ChevronLeft className="h-5 w-5" />
          </motion.button>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] text-cyan-100/75">Control Deck</p>
            <h1 className="mt-1 text-xl font-bold md:text-2xl">
              <span className="gradient-brand">Studio Settings</span>
            </h1>
            <p className="mt-1 text-xs text-slate-300/80">Tune recording behavior, speech engines, and cleanup pipeline.</p>
          </div>
        </div>
      </header>

      <main className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <SectionCard icon={<Keyboard className="h-4 w-4" />} title="Recording" tone="text-cyan-100">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-300">Shortcut Key</label>
              <button
                type="button"
                onClick={() => setIsCapturingShortcut(true)}
                className={`${inputClass} font-mono text-left ${isCapturingShortcut ? 'border-cyan-300/60 bg-cyan-300/10' : ''}`}
              >
                {isCapturingShortcut ? 'Press keys now...' : shortcutDraft}
              </button>
              <p className="mt-1.5 text-[11px] text-slate-400">
                Click then press your preferred keys. Example: CommandOrControl+Shift+Space
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs text-slate-300">Recording Mode</label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(['toggle', 'hold'] as const).map((mode) => {
                  const active = settings.recordingMode === mode;
                  return (
                    <button
                      key={mode}
                      onClick={() => updateSettings({ recordingMode: mode })}
                      className={`rounded-2xl border px-3 py-3 text-sm transition ${
                        active
                          ? 'border-cyan-300/40 bg-cyan-300/20 text-cyan-100'
                          : 'border-slate-200/15 bg-slate-200/5 text-slate-300 hover:bg-slate-200/10'
                      }`}
                    >
                      {mode === 'toggle' ? 'Toggle (Press once)' : 'Hold (Press and hold)'}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200/10 bg-slate-100/5 px-3 py-2.5">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Demo Mode</h4>
                <p className="text-xs text-slate-400">Generate sample Bangla text for UI testing.</p>
              </div>
              <Toggle enabled={settings.demoMode || false} onClick={() => updateSettings({ demoMode: !settings.demoMode })} />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Mic2 className="h-4 w-4" />} title="Speech Recognition" tone="text-orange-100">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-slate-300">Provider</label>
              <select
                value={settings.sttProvider}
                onChange={(e) => updateSettings({ sttProvider: e.target.value as STTProviderName })}
                className={inputClass}
              >
                <option value="Gemma 4 E2B">Gemma 4 E2B (Default)</option>
                <option value="OpenAI Whisper">OpenAI Whisper</option>
                <option value="Gemini">Google Gemini</option>
                <option value="Mock">Mock</option>
              </select>
            </div>

            <p className={`rounded-xl border px-3 py-2 text-xs ${hasSpeechApiKey ? 'border-lime-200/20 bg-lime-200/10 text-lime-100' : 'border-rose-200/20 bg-rose-200/10 text-rose-100'}`}>
              {hasSpeechApiKey
                ? 'Speech recognition will automatically use API keys from the API Keys section.'
                : 'No OpenAI/Gemini key found. Please add one in API Keys section.'}
            </p>
          </div>
        </SectionCard>

        <SectionCard icon={<Cpu className="h-4 w-4" />} title="AI Correction" tone="text-lime-100">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-300">Primary Provider</label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => updateSettings({ aiProvider: e.target.value })}
                  className={inputClass}
                >
                  <option value="Ollama">Ollama (Local)</option>
                  <option value="OllamaCloud">Ollama Cloud</option>
                  <option value="Gemini">Google Gemini</option>
                  <option value="OpenRouter">OpenRouter</option>
                  <option value="OpenAI">OpenAI</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-300">Model</label>
                <input
                  type="text"
                  value={settings.aiModel}
                  onChange={(e) => updateSettings({ aiModel: e.target.value })}
                  className={inputClass}
                  placeholder="gemma4:e2b"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  Example: `gemma4:e2b` for Ollama, `gemini-2.5-flash` for Gemini, `gpt-4o-mini` for OpenAI.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs text-slate-300">Ollama URL</label>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
                  className={inputClass}
                  placeholder="http://localhost:11434"
                />
                <p className="mt-1.5 text-[11px] text-slate-400">
                  If Ollama is on another PC, use `http://PC_IP:11434` (not localhost).
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs text-slate-300">Correction Strength</label>
                <select
                  value={settings.correctionStrength}
                  onChange={(e) =>
                    updateSettings({ correctionStrength: e.target.value as CleanupOptions['correctionStrength'] })
                  }
                  className={inputClass}
                >
                  <option value="minimal">Minimal</option>
                  <option value="balanced">Balanced</option>
                  <option value="strong">Strong</option>
                </select>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-200/15 bg-cyan-200/5 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => void runOllamaConnectivityTest(settings.ollamaUrl)}
                  disabled={isTestingOllama}
                  className="rounded-lg border border-cyan-200/25 bg-cyan-300/15 px-3 py-1.5 text-xs text-cyan-100 disabled:opacity-40"
                >
                  {isTestingOllama ? 'Testing...' : 'Test Current URL'}
                </button>
                <button
                  onClick={() => void discoverOllamaEndpoints()}
                  disabled={isDiscoveringOllama}
                  className="rounded-lg border border-lime-200/25 bg-lime-300/15 px-3 py-1.5 text-xs text-lime-100 disabled:opacity-40"
                >
                  {isDiscoveringOllama ? 'Discovering...' : 'Auto-Discover'}
                </button>
                {settings.lastWorkingOllamaUrl ? (
                  <button
                    onClick={() => updateSettings({ ollamaUrl: settings.lastWorkingOllamaUrl })}
                    className="rounded-lg border border-amber-200/25 bg-amber-300/15 px-3 py-1.5 text-xs text-amber-100"
                  >
                    Use Last Working
                  </button>
                ) : null}
              </div>

              {ollamaStatus ? <p className="mt-2 text-[11px] text-slate-300">{ollamaStatus}</p> : null}

              {discoveredOllamaUrls.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {discoveredOllamaUrls.map((url) => (
                    <button
                      key={url}
                      onClick={() => updateSettings({ ollamaUrl: url, lastWorkingOllamaUrl: url })}
                      className="rounded-lg border border-cyan-200/25 bg-cyan-300/10 px-2 py-1 text-[11px] text-cyan-100"
                    >
                      {url}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-300">Punctuation Mode</label>
              <select
                value={settings.punctuationMode}
                onChange={(e) => updateSettings({ punctuationMode: e.target.value as CleanupOptions['punctuationMode'] })}
                className={inputClass}
              >
                <option value="off">Off</option>
                <option value="light">Light</option>
                <option value="standard">Standard</option>
                <option value="formal">Formal</option>
              </select>
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<Wand2 className="h-4 w-4" />} title="API Keys" tone="text-yellow-100">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs text-slate-300">Gemini</label>
              <input
                type="password"
                placeholder="AIza..."
                value={settings.geminiApiKey || ''}
                onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-300">OpenAI</label>
              <input
                type="password"
                placeholder="sk-..."
                value={settings.openaiApiKey || ''}
                onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-300">OpenRouter</label>
              <input
                type="password"
                placeholder="sk-or-..."
                value={settings.openrouterApiKey || ''}
                onChange={(e) => updateSettings({ openrouterApiKey: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs text-slate-300">Ollama Cloud</label>
              <input
                type="password"
                placeholder="sk-..."
                value={settings.ollamaCloudApiKey || ''}
                onChange={(e) => updateSettings({ ollamaCloudApiKey: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>
        </SectionCard>

        <SectionCard icon={<ToggleLeft className="h-4 w-4" />} title="Behavior" tone="text-cyan-100">
          <div className="space-y-2.5">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200/10 bg-slate-100/5 px-3 py-2.5">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Auto Cleanup</h4>
                <p className="text-xs text-slate-400">Run AI cleanup after each finalized speech chunk.</p>
              </div>
              <Toggle enabled={settings.autoCleanup || false} onClick={() => updateSettings({ autoCleanup: !settings.autoCleanup })} />
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200/10 bg-slate-100/5 px-3 py-2.5">
              <div>
                <h4 className="text-sm font-semibold text-slate-100">Auto Copy</h4>
                <p className="text-xs text-slate-400">Automatically copy cleaned text to clipboard.</p>
              </div>
              <Toggle enabled={settings.autoCopy || false} onClick={() => updateSettings({ autoCopy: !settings.autoCopy })} />
            </div>
          </div>
        </SectionCard>
      </main>

      <footer className="mt-3 panel-glass rounded-2xl p-3">
        <button
          onClick={onBack}
          className="w-full rounded-xl border border-cyan-200/20 bg-gradient-to-r from-cyan-300/25 via-lime-300/25 to-yellow-300/25 py-3 text-sm font-semibold text-slate-50"
        >
          <span className="inline-flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Save and Return
          </span>
        </button>
      </footer>
    </div>
  );
};

export default SettingsPage;

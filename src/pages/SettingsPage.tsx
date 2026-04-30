import React from 'react';
import { ChevronLeft, Globe, Cpu, Save, Keyboard } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

const SettingsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings, updateSettings } = useSettingsStore();

  const renderAIProviderSelect = (value: string | undefined, onChange: (val: string) => void, includeNone = false) => (
    <select 
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 outline-none shadow-sm transition-all font-bold text-slate-700"
    >
      {includeNone && <option value="">None (Disable Fallback)</option>}
      <option value="Ollama">Ollama (Local - e.g. gemma4:e2b)</option>
      <option value="OllamaCloud">Ollama Cloud (Custom Endpoint)</option>
      <option value="Gemini">Google Gemini (Free - gemini-2.5-flash)</option>
      <option value="OpenRouter">OpenRouter (Free - openrouter/free)</option>
      <option value="OpenAI">OpenAI (Paid API - gpt-4o-mini)</option>
    </select>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9] text-slate-900 font-sans">
      <header className="flex items-center gap-4 px-10 py-6 bg-white/60 backdrop-blur-xl border-b border-slate-200/50 z-10 sticky top-0">
        <button 
          onClick={onBack}
          className="p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-700 shadow-sm border border-slate-100"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-800">Advanced Settings</h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none">Studio Configuration</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-10 max-w-4xl mx-auto w-full space-y-12 pb-32 scrollbar-hide">
        
        {/* Hotkeys & Modes */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-emerald-600">
            <Keyboard className="w-5 h-5" />
            <h2 className="font-black uppercase text-[11px] tracking-[0.2em]">Workflow & Hotkeys</h2>
          </div>
          <div className="grid gap-6 p-8 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Shortcut (Start/Stop)</label>
              <input 
                type="text" 
                value={settings.shortcutKey}
                onChange={(e) => updateSettings({ shortcutKey: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none shadow-sm transition-all font-bold text-slate-700" 
              />
              <p className="text-[10px] text-slate-500 mt-1">Example: <code className="bg-slate-100 px-1 rounded">CommandOrControl+Space</code> or <code className="bg-slate-100 px-1 rounded">F10</code></p>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Recording Mode</label>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                <button
                  onClick={() => updateSettings({ recordingMode: 'toggle' })}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${settings.recordingMode === 'toggle' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Press to Toggle
                </button>
                <button
                  onClick={() => updateSettings({ recordingMode: 'hold' })}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all ${settings.recordingMode === 'hold' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  Press and Hold (Push-to-Talk)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* STT Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-blue-600">
            <Globe className="w-5 h-5" />
            <h2 className="font-black uppercase text-[11px] tracking-[0.2em]">Speech Recognition (STT)</h2>
          </div>
          <div className="grid gap-6 p-8 bg-white rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">STT Engine</label>
              <select 
                value={settings.sttApiKey ? "Whisper" : "Mock"}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-bold text-slate-700"
                disabled
              >
                <option value="Whisper">OpenAI Whisper (Cloud)</option>
                <option value="Mock">Mock Provider (Local Testing)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">OpenAI API Key (For Whisper)</label>
              <input 
                type="password" 
                placeholder="sk-..." 
                value={settings.sttApiKey || ""}
                onChange={(e) => updateSettings({ sttApiKey: e.target.value })}
                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-medium text-slate-700" 
              />
            </div>
          </div>
        </section>

        {/* AI Cleanup Section - Cascade */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-purple-600">
            <Cpu className="w-5 h-5" />
            <h2 className="font-black uppercase text-[11px] tracking-[0.2em]">AI Brain Cascade (Fallbacks)</h2>
          </div>
          <div className="grid gap-8 p-8 bg-gradient-to-br from-white to-purple-50/30 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-purple-100/50">
            
            {/* Primary Model */}
            <div className="space-y-4 p-6 bg-white rounded-3xl border border-purple-100 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500" />
              <h3 className="font-black text-purple-800 text-xs uppercase tracking-widest">1. Primary AI Brain</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</label>
                  {renderAIProviderSelect(settings.aiProvider, (val) => updateSettings({ aiProvider: val }))}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model Name</label>
                  <input 
                    type="text" 
                    value={settings.aiModel}
                    onChange={(e) => updateSettings({ aiModel: e.target.value })}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700" 
                  />
                </div>
              </div>
            </div>

            {/* Secondary Model */}
            <div className="space-y-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-400" />
              <h3 className="font-black text-slate-700 text-xs uppercase tracking-widest">2. Secondary (Fallback)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</label>
                  {renderAIProviderSelect(settings.secondaryAiProvider, (val) => updateSettings({ secondaryAiProvider: val }), true)}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model Name</label>
                  <input 
                    type="text" 
                    value={settings.secondaryAiModel || ""}
                    onChange={(e) => updateSettings({ secondaryAiModel: e.target.value })}
                    disabled={!settings.secondaryAiProvider}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 disabled:opacity-50" 
                  />
                </div>
              </div>
            </div>

            {/* Tertiary Model */}
            <div className="space-y-4 p-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-slate-300" />
              <h3 className="font-black text-slate-500 text-xs uppercase tracking-widest">3. Tertiary (Last Resort)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Provider</label>
                  {renderAIProviderSelect(settings.tertiaryAiProvider, (val) => updateSettings({ tertiaryAiProvider: val }), true)}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model Name</label>
                  <input 
                    type="text" 
                    value={settings.tertiaryAiModel || ""}
                    onChange={(e) => updateSettings({ tertiaryAiModel: e.target.value })}
                    disabled={!settings.tertiaryAiProvider}
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-bold text-slate-700 disabled:opacity-50" 
                  />
                </div>
              </div>
            </div>

            {/* Global API Keys */}
            <div className="pt-6 border-t border-purple-100/50 space-y-4">
               <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Global API Keys</h3>
               <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ollama Endpoint</label>
                    <input 
                      type="text" 
                      value={settings.ollamaUrl}
                      onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-700" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ollama Cloud Endpoint</label>
                    <input 
                      type="text" 
                      placeholder="https://api.ollama.com"
                      value={settings.ollamaCloudUrl || ""}
                      onChange={(e) => updateSettings({ ollamaCloudUrl: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-700" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ollama Cloud API Key</label>
                    <input 
                      type="password" 
                      placeholder="sk-..." 
                      value={settings.ollamaCloudApiKey || ""}
                      onChange={(e) => updateSettings({ ollamaCloudApiKey: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-700" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gemini API Key</label>
                    <input 
                      type="password" 
                      value={settings.geminiApiKey || ""}
                      onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-700" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OpenAI API Key</label>
                    <input 
                      type="password" 
                      value={settings.openaiApiKey || ""}
                      onChange={(e) => updateSettings({ openaiApiKey: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-700" 
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">OpenRouter API Key</label>
                    <input 
                      type="password" 
                      value={settings.openrouterApiKey || ""}
                      onChange={(e) => updateSettings({ openrouterApiKey: e.target.value })}
                      className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none font-medium text-slate-700" 
                    />
                  </div>
               </div>
            </div>

          </div>
        </section>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-200/50">
        <button 
          onClick={onBack}
          className="w-full max-w-4xl mx-auto py-6 bg-slate-900 text-white rounded-[28px] font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-[0_20px_40px_-10px_rgba(15,23,42,0.3)] hover:shadow-[0_20px_50px_-10px_rgba(15,23,42,0.4)]"
        >
          <Save className="w-5 h-5" />
          Save & Return
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

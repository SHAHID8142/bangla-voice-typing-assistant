import React from 'react';
import { ChevronLeft, Globe, Cpu, Save } from 'lucide-react';
import { useSettingsStore } from '../store/settingsStore';

const SettingsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { settings, updateSettings } = useSettingsStore();

  return (
    <div className="flex flex-col h-screen bg-white text-slate-900 font-sans">
      <header className="flex items-center gap-4 px-8 py-5 border-b border-slate-100 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <button 
          onClick={onBack}
          className="p-3 hover:bg-slate-50 rounded-2xl transition-all text-slate-400 hover:text-slate-600"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-lg font-black tracking-tight text-slate-800">Settings</h1>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">Preferences & API Keys</p>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-8 max-w-2xl mx-auto w-full space-y-12">
        {/* STT Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-blue-600">
            <Globe className="w-5 h-5" />
            <h2 className="font-black uppercase text-[11px] tracking-[0.2em]">Speech Recognition</h2>
          </div>
          <div className="grid gap-6 p-8 bg-slate-50/50 rounded-[32px] border border-slate-100">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">STT Provider</label>
              <select 
                value={settings.sttApiKey ? "Whisper" : "Mock"}
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-bold text-slate-700"
                disabled
              >
                <option value="Whisper">OpenAI Whisper (Cloud)</option>
                <option value="Mock">Mock Provider (Local Testing)</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">OpenAI API Key</label>
              <input 
                type="password" 
                placeholder="sk-..." 
                value={settings.sttApiKey || ""}
                onChange={(e) => updateSettings({ sttApiKey: e.target.value })}
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-blue-500/10 outline-none shadow-sm transition-all font-medium text-slate-700" 
              />
            </div>
          </div>
        </section>

        {/* AI Cleanup Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 text-purple-600">
            <Cpu className="w-5 h-5" />
            <h2 className="font-black uppercase text-[11px] tracking-[0.2em]">AI Text Correction</h2>
          </div>
          <div className="grid gap-6 p-8 bg-purple-50/20 rounded-[32px] border border-purple-100/50">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ollama Model</label>
              <input 
                type="text" 
                placeholder="gemma2:2b" 
                value={settings.aiModel}
                onChange={(e) => updateSettings({ aiModel: e.target.value })}
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 outline-none shadow-sm transition-all font-bold text-slate-700" 
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Ollama Endpoint</label>
              <input 
                type="text" 
                value={settings.ollamaUrl}
                onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
                className="w-full p-4 bg-white border border-slate-100 rounded-2xl focus:ring-4 focus:ring-purple-500/10 outline-none shadow-sm transition-all font-medium text-slate-700" 
              />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-6 pt-6 border-t border-slate-100">
          <div className="flex items-center justify-between p-6 bg-slate-50/30 rounded-2xl border border-slate-50">
            <div>
              <p className="font-black text-xs text-slate-700 uppercase tracking-widest">Auto-copy to Clipboard</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Copy corrected text automatically</p>
            </div>
            <input 
                type="checkbox" 
                checked={settings.autoCopy}
                onChange={(e) => updateSettings({ autoCopy: e.target.checked })}
                className="w-6 h-6 rounded-lg accent-blue-600 transition-all cursor-pointer" 
            />
          </div>
          <div className="flex items-center justify-between p-6 bg-slate-50/30 rounded-2xl border border-slate-50">
            <div>
              <p className="font-black text-xs text-slate-700 uppercase tracking-widest">Auto-cleanup</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Run AI correction immediately</p>
            </div>
            <input 
                type="checkbox" 
                checked={settings.autoCleanup}
                onChange={(e) => updateSettings({ autoCleanup: e.target.checked })}
                className="w-6 h-6 rounded-lg accent-blue-600 transition-all cursor-pointer" 
            />
          </div>
        </section>

        <button 
          onClick={onBack}
          className="w-full py-6 bg-slate-900 text-white rounded-[28px] font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200"
        >
          <Save className="w-5 h-5" />
          Save & Return
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

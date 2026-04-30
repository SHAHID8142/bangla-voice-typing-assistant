import React, { useState } from 'react';
import { ChevronLeft, Database, Globe, Cpu, Save } from 'lucide-react';

const SettingsPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <div className="flex flex-col h-screen bg-white text-slate-900">
      <header className="flex items-center gap-4 px-6 py-4 border-b">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </header>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-8">
        {/* STT Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-blue-600">
            <Globe className="w-5 h-5" />
            <h2 className="font-bold uppercase text-sm tracking-wider">Speech Recognition</h2>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">STT Provider</label>
              <select className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none">
                <option>OpenAI Whisper (Cloud)</option>
                <option>Google Speech-to-Text</option>
                <option disabled>Local (Coming Soon)</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">API Key</label>
              <input type="password" placeholder="sk-..." className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
        </section>

        {/* AI Cleanup Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-purple-600">
            <Cpu className="w-5 h-5" />
            <h2 className="font-bold uppercase text-sm tracking-wider">AI Text Correction</h2>
          </div>
          <div className="grid gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">AI Provider</label>
              <select className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none">
                <option>Ollama (Local)</option>
                <option>OpenAI</option>
                <option>Gemini</option>
                <option>OpenRouter</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">Model Name</label>
              <input type="text" placeholder="gemma2:2b" className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none" />
            </div>
          </div>
        </section>

        {/* Preferences */}
        <section className="space-y-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Auto-copy to Clipboard</p>
              <p className="text-sm text-slate-500">Copy corrected text automatically after dictation</p>
            </div>
            <input type="checkbox" className="w-5 h-5 accent-blue-600" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Auto-cleanup</p>
              <p className="text-sm text-slate-500">Run AI correction immediately after stopping</p>
            </div>
            <input type="checkbox" className="w-5 h-5 accent-blue-600" defaultChecked />
          </div>
        </section>

        <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
          <Save className="w-5 h-5" />
          Save Settings
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;

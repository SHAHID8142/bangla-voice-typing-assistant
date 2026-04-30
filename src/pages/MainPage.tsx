import React, { useState } from 'react';
import { Mic, Settings, HelpCircle, Copy, Trash2, Wand2, Pause, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MainPage: React.FC<{ onOpenSettings: () => void }> = ({ onOpenSettings }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [rawText, setRawText] = useState("");
  const [correctedText, setCorrectedText] = useState("");

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
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
        <div className="flex-1 flex flex-col gap-4 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <span className="font-semibold text-slate-700">Corrected Bangla Text</span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {}} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-blue-600 rounded-lg transition-all border border-transparent hover:border-slate-200"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              <button 
                onClick={() => setCorrectedText("")} 
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-white hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-slate-200"
              >
                <Trash2 className="w-4 h-4" />
                Clear
              </button>
            </div>
          </div>
          <textarea
            className="flex-1 p-6 text-xl leading-relaxed resize-none focus:outline-none placeholder:text-slate-300"
            placeholder="আপনার কথা এখানে পরিষ্কার বাংলা টেক্সট হিসেবে আসবে..."
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
          />
        </div>

        {/* Right Column: Raw Preview & Controls */}
        <div className="w-80 flex flex-col gap-6">
          {/* Raw Text Preview */}
          <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/50">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Raw Transcription</span>
            </div>
            <div className="flex-1 p-4 text-slate-600 text-sm italic overflow-y-auto">
              {rawText || "Dictate something to see the raw output..."}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => setIsRecording(!isRecording)}
              className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all transform active:scale-95 shadow-lg ${
                isRecording 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-200' 
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200'
              }`}
            >
              {isRecording ? (
                <>
                  <Square className="w-6 h-6 fill-current" />
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
              className="w-full py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 flex items-center justify-center gap-3 hover:bg-slate-50 transition-all shadow-sm"
              onClick={() => {}}
            >
              <Wand2 className="w-5 h-5 text-purple-500" />
              AI Cleanup
            </button>
          </div>

          {/* Status Indicators */}
          <div className="bg-slate-100/50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-slate-500">STT Provider:</span>
              <span className="font-semibold text-slate-700 text-blue-600">Cloud (Whisper)</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">AI Model:</span>
              <span className="font-semibold text-slate-700 text-purple-600">Ollama (Gemma 2)</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer / Info */}
      <footer className="px-6 py-3 text-center text-xs text-slate-400 bg-white border-t border-slate-100">
        Press <span className="px-1.5 py-0.5 bg-slate-100 rounded border border-slate-200 font-mono text-slate-600 text-[10px]">Ctrl + Space</span> to toggle recording anywhere
      </footer>
    </div>
  );
};

export default MainPage;

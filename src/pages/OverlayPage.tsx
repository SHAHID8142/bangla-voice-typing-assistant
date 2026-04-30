import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Square, X, Mic } from 'lucide-react';

const OverlayPage: React.FC = () => {
  // We'll simulate some wave data for now until the audio service is ready
  const [waveData, setWaveData] = useState<number[]>(Array(20).fill(10));

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveData(prev => prev.map(() => Math.random() * 40 + 5));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden select-none">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white/90 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl w-full h-full flex flex-col items-center justify-between p-4 overflow-hidden"
      >
        {/* Top Status */}
        <div className="flex items-center gap-2 text-blue-600">
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-2 h-2 bg-blue-600 rounded-full"
          />
          <span className="text-xs font-bold uppercase tracking-widest">Listening...</span>
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-end justify-center gap-1 h-12 w-full px-4">
          {waveData.map((height, i) => (
            <motion.div
              key={i}
              animate={{ height }}
              className="w-1 bg-gradient-to-t from-blue-600 to-blue-400 rounded-full"
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          <button className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-2xl shadow-lg shadow-red-200 transition-all active:scale-90 group">
            <Square className="w-5 h-5 fill-current" />
          </button>
          <button className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all active:scale-90">
            <X className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OverlayPage;

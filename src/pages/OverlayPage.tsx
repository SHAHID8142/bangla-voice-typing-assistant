import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Square, X } from 'lucide-react';

const OverlayPage: React.FC = () => {
  // Number of bars in the visualizer
  const BAR_COUNT = 32;
  const [amplitudes, setAmplitudes] = useState<number[]>(Array(BAR_COUNT).fill(10));
  const requestRef = useRef<number>(0);

  // Simulate a "liquid" organic movement for the visualizer
  const animate = (time: number) => {
    setAmplitudes(prev => 
      prev.map((_, i) => {
        // Create organic movement using sine waves + randomness
        const base = Math.sin(time / 500 + i / 2) * 20 + 25;
        const noise = Math.random() * 15;
        return Math.max(8, base + noise);
      })
    );
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  return (
    <div className="w-full h-full flex items-center justify-center p-4 overflow-hidden select-none font-sans">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 30, rotateX: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
        className="bg-white/80 backdrop-blur-2xl border border-white/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] rounded-[40px] w-full h-full flex flex-col items-center justify-between p-6 overflow-hidden relative"
      >
        {/* Animated Background Glow */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl -z-10"
        />

        {/* Top Status Header */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full border border-blue-100/50">
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-blue-600 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.6)]"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700/80">Recording</span>
          </div>
        </div>

        {/* Visualizer Container */}
        <div className="flex items-center justify-center gap-[3px] h-20 w-full">
          {amplitudes.map((height, i) => (
            <motion.div
              key={i}
              style={{ height }}
              className={`w-1 rounded-full ${
                i % 2 === 0 ? 'bg-blue-500' : 'bg-blue-400'
              } opacity-80`}
              animate={{ 
                height,
                backgroundColor: height > 35 ? "#3b82f6" : "#60a5fa"
              }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          ))}
        </div>

        {/* Floating Controls Area */}
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-slate-900 text-white rounded-3xl shadow-xl shadow-slate-200 transition-all flex items-center justify-center relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <Square className="w-5 h-5 fill-current" />
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-4 bg-white border border-slate-200 text-slate-400 rounded-3xl shadow-sm transition-all hover:text-red-500 hover:border-red-100"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Subtle Hint */}
        <div className="text-[9px] text-slate-300 font-medium uppercase tracking-widest pb-1">
          Double-click to expand
        </div>
      </motion.div>
    </div>
  );
};

export default OverlayPage;

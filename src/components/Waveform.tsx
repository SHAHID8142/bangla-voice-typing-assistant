import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface WaveformProps {
  isRecording: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

export const Waveform: React.FC<WaveformProps> = ({ isRecording, className = "", theme = 'light' }) => {
  const BAR_COUNT = 24;
  const [amplitudes, setAmplitudes] = useState<number[]>(Array(BAR_COUNT).fill(12));
  const requestRef = useRef<number>(0);

  const animate = (time: number) => {
    if (!isRecording) {
      // Return to a calm state when not recording
      setAmplitudes(prev => prev.map(val => {
        const diff = 12 - val;
        return val + diff * 0.1;
      }));
    } else {
      // Playful organic wave movement
      setAmplitudes(prev => 
        prev.map((_, i) => {
          // Complex sine waves for a "jelly/fluid" feel
          const base1 = Math.sin(time / 400 + i / 3) * 15;
          const base2 = Math.cos(time / 300 - i / 2) * 10;
          const noise = Math.random() * 12;
          return Math.max(8, 25 + base1 + base2 + noise);
        })
      );
    }
    requestRef.current = requestAnimationFrame(animate);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isRecording]);

  const barColor = theme === 'dark' ? '#ffffff' : '#3b82f6';
  const barColorAlt = theme === 'dark' ? 'rgba(255,255,255,0.6)' : '#60a5fa';

  return (
    <div className={`flex items-center justify-center gap-[3px] h-20 w-full ${className}`}>
      {amplitudes.map((height, i) => (
        <motion.div
          key={i}
          className="w-1.5 rounded-full"
          animate={{ 
            height,
            backgroundColor: height > 35 ? barColor : barColorAlt
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      ))}
    </div>
  );
};

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Square, Mic, Dot, Waves } from 'lucide-react';
import { invoke } from '@tauri-apps/api/core';
import { useVoiceReactiveWaveform } from '../hooks/useVoiceReactiveWaveform';

const OUTER_WAVE_BARS = 54;
const INNER_WAVE_BARS = 34;
const RIBBON_WAVE_BARS = 40;

const OverlayPage: React.FC = () => {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { levels, energy } = useVoiceReactiveWaveform(true, 72);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setSeconds((s) => s + 1);
    }, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStop = async () => {
    try {
      await invoke('toggle_recording');
    } catch (err) {
      console.error('Failed to toggle recording:', err);
    }
  };

  return (
    <div className="h-full w-full select-none overflow-hidden p-3">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 22 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className="panel-glass relative mx-auto flex h-full max-h-[560px] w-full max-w-[560px] flex-col overflow-hidden rounded-[2.8rem] border border-cyan-200/20"
      >
        <div className="absolute inset-0">
          <motion.div
            animate={{ rotate: [0, 360], scale: [1, 1.08, 1] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            className="absolute left-[-30%] top-[-30%] h-[160%] w-[160%] rounded-full"
            style={{
              background:
                'conic-gradient(from 130deg, rgba(53,211,242,0.22), rgba(158,242,107,0.18), rgba(255,216,95,0.16), rgba(255,122,98,0.18), rgba(53,211,242,0.22))',
            }}
          />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(8,40,52,0.2),rgba(6,16,24,0.88))]" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5">
          <div className="relative grid h-[300px] w-[300px] place-items-center">
            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: OUTER_WAVE_BARS }).map((_, idx) => {
                const angle = (idx / OUTER_WAVE_BARS) * 360;
                const base = 10;
                const level = levels[(idx * 2) % levels.length] || 0.05;
                const amp = level * 42;

                return (
                  <motion.div
                    key={`outer-${idx}`}
                    className="absolute origin-bottom rounded-full"
                    style={{
                      width: 2.4,
                      height: base,
                      transform: `rotate(${angle}deg) translateY(-136px)`,
                      background: 'linear-gradient(180deg, rgba(255,216,95,0.95), rgba(255,122,98,0.75))',
                    }}
                    animate={{
                      height: base + amp,
                      opacity: [0.45, 1, 0.45],
                    }}
                    transition={{ duration: 1.05, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.012 }}
                  />
                );
              })}
            </div>

            <div className="absolute inset-0 flex items-center justify-center">
              {Array.from({ length: INNER_WAVE_BARS }).map((_, idx) => {
                const angle = (idx / INNER_WAVE_BARS) * 360;
                const base = 8;
                const level = levels[(idx + 9) % levels.length] || 0.05;
                const amp = level * 26;

                return (
                  <motion.div
                    key={`inner-${idx}`}
                    className="absolute origin-bottom rounded-full"
                    style={{
                      width: 3,
                      height: base,
                      transform: `rotate(${angle}deg) translateY(-94px)`,
                      background: 'linear-gradient(180deg, rgba(158,242,107,0.95), rgba(53,211,242,0.78))',
                    }}
                    animate={{
                      height: base + amp,
                      opacity: [0.4, 0.95, 0.4],
                    }}
                    transition={{ duration: 0.82, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.01 }}
                  />
                );
              })}
            </div>

            <motion.div
              animate={{ scale: [1, 1 + Math.min(0.18, energy * 0.35), 1], opacity: [0.45, 0.7, 0.45] }}
              transition={{ duration: 2.6, repeat: Infinity }}
              className="absolute h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,122,98,0.4),rgba(255,122,98,0))]"
            />

            <motion.div
              animate={{
                boxShadow: [
                  '0 0 0 0 rgba(255,122,98,0.5)',
                  '0 0 0 22px rgba(255,122,98,0)',
                  '0 0 0 0 rgba(255,122,98,0)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="relative z-10 grid h-24 w-24 place-items-center rounded-[28px] border border-white/25 bg-gradient-to-br from-rose-500 via-orange-400 to-amber-300"
            >
              <Mic className="h-10 w-10 text-white" />
            </motion.div>
          </div>

          <div className="w-full max-w-[420px] rounded-2xl border border-cyan-200/20 bg-[#0b2331]/75 px-4 py-3">
            <div className="flex items-center justify-between text-xs text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                <Dot className="h-4 w-4 text-rose-300 dot-blink" />
                Recording Live
              </span>
              <span className="font-mono text-sm">{formatTime(seconds)}</span>
            </div>

            <div className="mt-2 flex h-14 items-end justify-center gap-1 overflow-hidden">
              {Array.from({ length: RIBBON_WAVE_BARS }).map((_, idx) => {
                const level = levels[idx % levels.length] || 0.05;
                const mirror = levels[(levels.length - 1 - idx + levels.length) % levels.length] || 0.05;
                const h = 8 + (level + mirror) * 17;
                return (
                  <motion.div
                    key={`ribbon-${idx}`}
                    className="w-1.5 rounded-full"
                    style={{ background: 'linear-gradient(180deg, rgba(53,211,242,0.95), rgba(158,242,107,0.78))' }}
                    animate={{ height: h, opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 0.72, repeat: Infinity, delay: idx * 0.01, ease: 'easeInOut' }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between px-5 pb-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1.5 text-xs text-cyan-100">
            <Waves className="h-3.5 w-3.5" />
            Mini Studio
          </div>

          <motion.button
            onClick={handleStop}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.92 }}
            className="grid h-14 w-14 place-items-center rounded-2xl border border-rose-200/40 bg-gradient-to-br from-rose-500 to-orange-400 text-white shadow-[0_16px_36px_rgba(255,122,98,0.42)]"
          >
            <Square className="h-5 w-5 fill-current" />
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default OverlayPage;

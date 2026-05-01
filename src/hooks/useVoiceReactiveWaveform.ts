import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const makeLevels = (count: number) => Array.from({ length: count }, () => 0.05);

export const useVoiceReactiveWaveform = (active: boolean, barCount: number) => {
  const [levels, setLevels] = useState<number[]>(() => makeLevels(barCount));
  const [energy, setEnergy] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const dataRef = useRef<Uint8Array | null>(null);

  const resetLevels = useCallback(() => {
    setLevels(makeLevels(barCount));
    setEnergy(0);
  }, [barCount]);

  const cleanup = useCallback(async () => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (sourceRef.current) {
      try {
        sourceRef.current.disconnect();
      } catch (_e) {
        // no-op
      }
      sourceRef.current = null;
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (_e) {
        // no-op
      }
      analyserRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      try {
        await audioContextRef.current.close();
      } catch (_e) {
        // no-op
      }
      audioContextRef.current = null;
    }

    dataRef.current = null;
    resetLevels();
  }, [resetLevels]);

  const drawLoop = useCallback(() => {
    const analyser = analyserRef.current;
    const data = dataRef.current;

    if (!analyser || !data) return;

    analyser.getByteFrequencyData(data);

    const segment = Math.max(1, Math.floor(data.length / barCount));
    const nextLevels = new Array<number>(barCount).fill(0.05);
    let total = 0;

    for (let i = 0; i < barCount; i += 1) {
      const start = i * segment;
      const end = Math.min(data.length, start + segment);
      if (start >= end) continue;

      let sum = 0;
      for (let j = start; j < end; j += 1) sum += data[j];
      const avg = sum / (end - start);
      const normalized = Math.min(1, Math.max(0.04, avg / 255));

      nextLevels[i] = normalized;
      total += normalized;
    }

    setLevels(nextLevels);
    setEnergy(total / barCount);
    rafRef.current = requestAnimationFrame(drawLoop);
  }, [barCount]);

  const start = useCallback(async () => {
    try {
      setError(null);
      await cleanup();

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      sourceRef.current = source;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.86;
      analyser.minDecibels = -95;
      analyser.maxDecibels = -15;
      analyserRef.current = analyser;
      source.connect(analyser);
      dataRef.current = new Uint8Array(analyser.frequencyBinCount);

      drawLoop();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Microphone visualizer failed";
      setError(message);
      await cleanup();
    }
  }, [cleanup, drawLoop]);

  useEffect(() => {
    if (active) void start();
    else void cleanup();

    return () => {
      void cleanup();
    };
  }, [active, cleanup, start]);

  const hasSignal = useMemo(() => energy > 0.08, [energy]);

  return { levels, energy, hasSignal, error };
};


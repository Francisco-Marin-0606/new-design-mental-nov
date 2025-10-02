import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type RevealProgressState = {
  progressById: Record<string, number>;
  revealingById: Record<string, boolean>;
  startReveal: (id: string, opts?: { durationMs?: number; max?: number }) => void;
  stopReveal: (id: string) => void;
  setProgress: (id: string, value: number) => void;
  getProgress: (id: string) => number;
  isRevealing: (id: string) => boolean;
};

const STORAGE_KEY = 'revealProgress:v1';

export const [RevealProgressProvider, useRevealProgress] = createContextHook<RevealProgressState>(() => {
  const [progressById, setProgressById] = useState<Record<string, number>>({});
  const [revealingById, setRevealingById] = useState<Record<string, boolean>>({});
  const timersRef = useRef<Record<string, number>>({});
  const lastSavedRef = useRef<number>(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as { progressById?: Record<string, number> };
          setProgressById(parsed.progressById ?? {});
        }
      } catch (e) {
        console.log('[RevealProgress] load error', e);
      }
    })();
  }, []);

  useEffect(() => {
    const now = Date.now();
    if (now - lastSavedRef.current < 400) return; // throttle saves
    lastSavedRef.current = now;
    (async () => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ progressById }));
      } catch (e) {
        console.log('[RevealProgress] save error', e);
      }
    })();
  }, [progressById]);

  const setProgress = useCallback((id: string, value: number) => {
    setProgressById((prev) => ({ ...prev, [id]: Math.max(0, Math.min(1, value)) }));
  }, []);

  const stopReveal = useCallback((id: string) => {
    const h = timersRef.current[id];
    if (h) {
      clearInterval(h as unknown as number);
    }
    timersRef.current[id] = 0 as unknown as number;
    setRevealingById((prev) => ({ ...prev, [id]: false }));
  }, []);

  const startReveal = useCallback((id: string, opts?: { durationMs?: number; max?: number }) => {
    const durationMs = opts?.durationMs ?? 20000;
    const max = Math.max(0, Math.min(1, opts?.max ?? 0.85));

    if (revealingById[id]) return;

    setRevealingById((prev) => ({ ...prev, [id]: true }));

    const stepMs = 50;
    const stepCount = Math.max(1, Math.round(durationMs / stepMs));
    let i = 0;

    const start = Date.now();
    const initial = progressById[id] ?? 0;
    const target = max;

    const handle = setInterval(() => {
      i += 1;
      const elapsed = Date.now() - start;
      const ratio = Math.min(1, elapsed / durationMs);
      const next = initial + (target - initial) * ratio;
      setProgress(id, next);
      if (ratio >= 1) {
        stopReveal(id);
      }
    }, stepMs) as unknown as number;

    timersRef.current[id] = handle;
  }, [progressById, revealingById, setProgress, stopReveal]);

  const getProgress = useCallback((id: string) => progressById[id] ?? 0, [progressById]);
  const isRevealing = useCallback((id: string) => revealingById[id] ?? false, [revealingById]);

  return {
    progressById,
    revealingById,
    startReveal,
    stopReveal,
    setProgress,
    getProgress,
    isRevealing,
  };
});

export function useSessionReveal(sessionId: string) {
  const ctx = useRevealProgress();
  const progress = ctx.getProgress(sessionId);
  const revealing = ctx.isRevealing(sessionId);
  return useMemo(() => ({ progress, revealing }), [progress, revealing]);
}

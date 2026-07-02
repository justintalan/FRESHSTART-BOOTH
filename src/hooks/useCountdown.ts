"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface CountdownOptions {
  seconds: number;
  autoStart?: boolean;
  onDone?: () => void;
  // tick resolution in ms (default 100ms so the bar animates smoothly)
  intervalMs?: number;
}

interface CountdownApi {
  remaining: number; // seconds remaining, float
  running: boolean;
  start: () => void;
  stop: () => void;
  reset: (seconds?: number) => void;
}

// A wall-clock countdown that survives re-renders and fires onDone once.
export function useCountdown({
  seconds,
  autoStart = false,
  onDone,
  intervalMs = 100,
}: CountdownOptions): CountdownApi {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(autoStart);
  const endRef = useRef<number>(0);
  const doneRef = useRef(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  const start = useCallback(() => {
    doneRef.current = false;
    endRef.current = Date.now() + remaining * 1000;
    setRunning(true);
  }, [remaining]);

  const stop = useCallback(() => setRunning(false), []);

  const reset = useCallback(
    (s?: number) => {
      doneRef.current = false;
      setRunning(false);
      setRemaining(s ?? seconds);
    },
    [seconds],
  );

  // Kick off the wall-clock target when autoStart flips on.
  useEffect(() => {
    if (autoStart) {
      endRef.current = Date.now() + seconds * 1000;
      setRunning(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!running) return;
    if (!endRef.current) endRef.current = Date.now() + remaining * 1000;
    const tick = () => {
      const left = Math.max(0, (endRef.current - Date.now()) / 1000);
      setRemaining(left);
      if (left <= 0 && !doneRef.current) {
        doneRef.current = true;
        setRunning(false);
        onDoneRef.current?.();
      }
    };
    tick();
    const h = window.setInterval(tick, intervalMs);
    return () => window.clearInterval(h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, intervalMs]);

  return { remaining, running, start, stop, reset };
}

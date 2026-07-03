"use client";

import { useEffect, useRef } from "react";

// After `timeoutMs` of no user input, invoke onIdle (used to return any game
// to the attract screen). Any pointer / key / touch resets the timer.
export function useIdleReset(onIdle: () => void, timeoutMs = 30_000): void {
  const onIdleRef = useRef(onIdle);
  useEffect(() => {
    onIdleRef.current = onIdle;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    let timer = 0;

    const kick = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => onIdleRef.current(), timeoutMs);
    };

    const events: (keyof WindowEventMap)[] = [
      "pointerdown",
      "pointermove",
      "keydown",
      "touchstart",
      "wheel",
    ];
    events.forEach((e) => window.addEventListener(e, kick, { passive: true }));
    kick();

    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, kick));
    };
  }, [timeoutMs]);
}

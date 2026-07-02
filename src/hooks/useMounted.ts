"use client";

import { useEffect, useState } from "react";

// True only after the first client render. Gate any time/random-derived UI on
// this so the server-rendered HTML and first client render match (no flashes).
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

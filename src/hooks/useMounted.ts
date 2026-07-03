"use client";

import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

// True only after hydration on the client. Gate any localStorage/random
// derived UI on this so server HTML and the first client render match.
export function useMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

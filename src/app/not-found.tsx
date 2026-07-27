"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Any unmatched route bounces back to the attract screen.
export default function NotFound() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
  }, [router]);
  return (
    <div className="grid h-full place-items-center bg-cabinet font-mono text-label">
      redirecting…
    </div>
  );
}

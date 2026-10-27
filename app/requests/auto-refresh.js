"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-renders the server page on an interval while the agent is working. The
// page stops rendering this once the session settles, which ends the polling.
export default function AutoRefresh({ seconds }) {
  const router = useRouter();
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = setInterval(refresh, seconds * 1000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router, seconds]);
  return null;
}

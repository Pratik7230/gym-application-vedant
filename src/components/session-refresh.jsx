"use client";

import { useEffect, useRef } from "react";

/** Refresh access token periodically and when the tab becomes visible; back off on 401 */
export function SessionRefresh() {
  const failedRef = useRef(false);

  useEffect(() => {
    async function refresh() {
      if (failedRef.current) return;
      try {
        const res = await fetch("/api/auth/refresh", { method: "POST", credentials: "include" });
        if (res.status === 401) {
          failedRef.current = true;
        }
      } catch {
        /* network errors — retry on next tick */
      }
    }

    const id = setInterval(refresh, 10 * 60 * 1000);

    function onVisible() {
      if (document.visibilityState === "visible") refresh();
    }

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}

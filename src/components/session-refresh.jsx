"use client";

import { useEffect } from "react";

/** Refresh access token before 15m expiry */
export function SessionRefresh() {
  useEffect(() => {
    const id = setInterval(
      () => {
        fetch("/api/auth/refresh", { method: "POST", credentials: "include" }).catch(() => {});
      },
      10 * 60 * 1000
    );
    return () => clearInterval(id);
  }, []);
  return null;
}

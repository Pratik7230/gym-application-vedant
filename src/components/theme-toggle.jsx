"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <span className="h-8 w-16" />;
  const isDark = (theme === "system" ? resolvedTheme : theme) === "dark";
  return (
    <button
      type="button"
      disabled
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-xl border border-cyan-300/55 bg-cyan-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-950 transition opacity-50 cursor-not-allowed dark:border-cyan-300/45 dark:bg-white dark:text-slate-900"
      aria-label="Toggle theme"
    >
      {isDark ? "Light" : "Dark"}
    </button>
  );
}

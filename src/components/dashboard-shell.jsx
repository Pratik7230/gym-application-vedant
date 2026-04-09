"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle.jsx";

function isActivePath(pathname, href) {
  const depth = href.split("/").filter(Boolean).length;
  if (depth <= 1) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const linkClass = (active) =>
  `group flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm font-medium transition ${active
    ? "border-cyan-300/60 bg-cyan-300/20 text-slate-900 shadow-sm dark:border-cyan-300/50 dark:bg-cyan-300/15 dark:text-cyan-50"
    : "border-transparent text-slate-700 hover:border-slate-200 hover:bg-white/75 dark:text-slate-300 dark:hover:border-white/15 dark:hover:bg-white/5"
  }`;

export function DashboardShell({ title, nav, children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-100 text-slate-900 dark:bg-[#02070f] dark:text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_10%,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_95%_95%,rgba(245,158,11,0.12),transparent_40%)]" />
      <div className="spot-grid pointer-events-none absolute inset-0 opacity-20" />

      <div className="relative mx-auto flex w-full max-w-[1700px] flex-col gap-4 p-3 md:flex-row md:p-6">
        <aside className="glass-panel h-fit rounded-3xl p-3 md:sticky md:top-6 md:h-[calc(100vh-3rem)] md:w-72 md:p-4">
          <div className="rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4 dark:border-white/15 dark:bg-white/5">
            <p className="font-display text-4xl leading-none text-slate-900 dark:text-white">Iron Fitness</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">
              {title} panel
            </p>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-900/10 bg-slate-50/80 px-3 py-2 dark:border-white/15 dark:bg-white/5">
            <span className="text-xs font-semibold uppercase tracking-[0.17em] text-slate-600 dark:text-slate-300">
              Theme
            </span>
            <ThemeToggle />
          </div>

          <nav className="mt-4 grid gap-1.5">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(isActivePath(pathname, item.href))}>
                <span>{item.label}</span>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-0 transition group-hover:opacity-70" />
              </Link>
            ))}
          </nav>

          <div className="mt-4">
            <button
              type="button"
              onClick={logout}
              className="w-full rounded-2xl border border-red-300/40 bg-red-500/10 px-3 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-500/20 dark:border-red-300/35 dark:text-red-200"
            >
              Log out
            </button>
          </div>
        </aside>

        <section className="glass-panel flex min-h-[calc(100vh-3rem)] flex-1 flex-col overflow-hidden rounded-3xl">
          <header className="border-b border-slate-900/10 px-5 py-4 dark:border-white/10">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-700 dark:text-cyan-200">
              {title} workspace
            </p>
            <h2 className="font-display mt-2 text-5xl leading-none text-slate-900 dark:text-white">Dashboard</h2>
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </section>
      </div>
    </div>
  );
}

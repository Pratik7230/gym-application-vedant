"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle.jsx";

const linkClass = (active) =>
  `block rounded-lg px-3 py-2 text-sm font-medium ${
    active
      ? "bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
  }`;

export function DashboardShell({ title, nav, children }) {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950 md:flex-row">
      <aside className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:w-56 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between gap-2 p-4">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{title}</span>
          <ThemeToggle />
        </div>
        <nav className="flex flex-wrap gap-1 px-2 pb-4 md:flex-col">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className={linkClass(pathname === item.href)}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden px-2 pb-4 md:block">
          <button
            type="button"
            onClick={logout}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8">{children}</main>
      <div className="border-t border-zinc-200 p-4 md:hidden dark:border-zinc-800">
        <button
          type="button"
          onClick={logout}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 dark:border-zinc-600 dark:text-zinc-100"
        >
          Log out
        </button>
      </div>
    </div>
  );
}

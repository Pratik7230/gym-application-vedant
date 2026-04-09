"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell } from "@/components/auth-shell.jsx";

const labelClass = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300";
const inputClass =
  "mt-2 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300 focus:bg-white/10";
const primaryButtonClass =
  "w-full rounded-2xl border border-cyan-300/70 bg-cyan-300 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:opacity-60";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "";
  const urlError = searchParams.get("error") || "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (urlError === "server_config") {
      setError(
        "Server is misconfigured (missing auth secrets). Set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in production."
      );
    }
  }, [urlError]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      const role = data.user?.role;
      let dest = "/client";
      if (role === "admin") dest = "/admin";
      if (role === "trainer") dest = "/trainer";
      if (from && from.startsWith("/")) {
        dest = from;
      }
      router.replace(dest);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Welcome Back"
      subtitle="Sign in to access memberships, payments, workouts, and attendance in one dashboard."
      badge="Member portal"
      imageSrc="/Images/login_bg_hd.png"
      imageAlt="Modern gym interior"
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Enter your password"
          />
        </div>
        <p className="text-right text-sm text-slate-300">
          <Link href="/forgot-password" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
            Forgot password?
          </Link>
        </p>
        {error ? <p className="rounded-xl border border-red-300/45 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        No account?{" "}
        <Link href="/signup" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
          Create one
        </Link>
      </p>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#02070f] text-slate-300">
          <p>Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

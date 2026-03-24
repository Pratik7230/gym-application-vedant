"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(69,255,202,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(69,255,202,0.12),transparent_30%)]" />
      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-3xl border border-[#45ffca]/40 bg-[#111]/95 shadow-[0_0_40px_rgba(69,255,202,0.2)] md:grid-cols-2">
        <div className="hidden flex-col justify-between bg-black/40 p-10 md:flex">
          <div>
            <Link href="/" className="text-3xl font-extrabold tracking-wide">
              Iron <span className="text-[#45ffca]">Fitness</span>
            </Link>
            <p className="mt-8 max-w-sm text-sm text-zinc-300">
              Build your dream physique with expert coaching and personalized fitness plans.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Train Hard. Stay Consistent.</p>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="mt-2 text-sm text-zinc-400">Use your gym account credentials.</p>
          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#45ffca]/40 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#45ffca] focus:shadow-[0_0_12px_rgba(69,255,202,0.4)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-xl border border-[#45ffca]/40 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#45ffca] focus:shadow-[0_0_12px_rgba(69,255,202,0.4)]"
                placeholder="Enter password"
              />
            </div>
            <p className="text-right text-sm">
              <Link href="/forgot-password" className="font-semibold text-[#45ffca] hover:underline">
                Forgot password?
              </Link>
            </p>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-[#45ffca] bg-[#45ffca] py-3 text-sm font-semibold text-black transition hover:shadow-[0_0_18px_rgba(69,255,202,0.6)] disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">
            No account?{" "}
            <Link href="/signup" className="font-semibold text-[#45ffca] hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-black">
          <p className="text-zinc-500">Loading...</p>
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}

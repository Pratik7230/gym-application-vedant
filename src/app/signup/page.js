"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [bootstrap, setBootstrap] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onRequestOtp(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const headers = { "Content-Type": "application/json" };
      if (bootstrap) headers["x-admin-bootstrap-secret"] = bootstrap;
      const res = await fetch("/api/auth/register/request-otp", {
        method: "POST",
        headers,
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
      setMessage("OTP sent to your email. Enter it below to complete signup.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onVerifyOtp(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");
      router.replace("/client");
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
              Join the community and start your transformation with personalized training support.
            </p>
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Progress Starts Today.</p>
        </div>
        <div className="p-6 sm:p-10">
          <h1 className="text-3xl font-bold">Create Account</h1>
          <p className="mt-2 text-sm text-zinc-400">Default role is member (client).</p>
          <form onSubmit={otpSent ? onVerifyOtp : onRequestOtp} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300">Name</label>
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={otpSent}
                className="mt-2 w-full rounded-xl border border-[#45ffca]/40 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#45ffca] focus:shadow-[0_0_12px_rgba(69,255,202,0.4)]"
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={otpSent}
                className="mt-2 w-full rounded-xl border border-[#45ffca]/40 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#45ffca] focus:shadow-[0_0_12px_rgba(69,255,202,0.4)]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={otpSent}
                className="mt-2 w-full rounded-xl border border-[#45ffca]/40 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#45ffca] focus:shadow-[0_0_12px_rgba(69,255,202,0.4)]"
                placeholder="At least 8 characters"
              />
            </div>
            {otpSent ? (
              <div>
                <label className="block text-sm font-medium text-zinc-300">OTP</label>
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="mt-2 w-full rounded-xl border border-[#45ffca]/40 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#45ffca] focus:shadow-[0_0_12px_rgba(69,255,202,0.4)]"
                  placeholder="6-digit code"
                />
              </div>
            ) : null}
            <div>
              <label className="block text-sm font-medium text-zinc-300">
                Bootstrap secret (admin/trainer only)
              </label>
              <input
                type="password"
                value={bootstrap}
                onChange={(e) => setBootstrap(e.target.value)}
                placeholder="Optional"
                disabled={otpSent}
                className="mt-2 w-full rounded-xl border border-[#45ffca]/40 bg-black/40 px-4 py-3 text-sm text-white outline-none transition focus:border-[#45ffca] focus:shadow-[0_0_12px_rgba(69,255,202,0.4)]"
              />
            </div>
            {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl border border-[#45ffca] bg-[#45ffca] py-3 text-sm font-semibold text-black transition hover:shadow-[0_0_18px_rgba(69,255,202,0.6)] disabled:opacity-60"
            >
              {loading ? "Please wait..." : otpSent ? "Verify OTP & Sign up" : "Send OTP"}
            </button>
            {otpSent ? (
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setMessage("");
                  setError("");
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500"
              >
                Edit details
              </button>
            ) : null}
          </form>
          <p className="mt-6 text-center text-sm text-zinc-400">
            Have an account?{" "}
            <Link href="/login" className="font-semibold text-[#45ffca] hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

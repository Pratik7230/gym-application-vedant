"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth-shell.jsx";

const labelClass = "block text-xs font-semibold uppercase tracking-[0.16em] text-slate-300";
const inputClass =
  "mt-2 w-full rounded-2xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-300 focus:bg-white/10 disabled:opacity-70";
const primaryButtonClass =
  "w-full rounded-2xl border border-cyan-300/70 bg-cyan-300 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200 disabled:opacity-60";
const secondaryButtonClass =
  "w-full rounded-2xl border border-white/25 bg-white/5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-100 transition hover:bg-white/10";

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
    <AuthShell
      title="Create Account"
      subtitle="Register once, verify with OTP, and start managing your fitness journey instantly."
      badge="Quick onboarding"
      imageSrc="/Images/image4.jpg"
      imageAlt="Member training in gym"
    >
      <form onSubmit={otpSent ? onVerifyOtp : onRequestOtp} className="space-y-5">
        <div>
          <label className={labelClass}>Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={otpSent}
            className={inputClass}
            placeholder="Your full name"
          />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={otpSent}
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={otpSent}
            className={inputClass}
            placeholder="At least 8 characters"
          />
        </div>

        {otpSent ? (
          <div>
            <label className={labelClass}>OTP code</label>
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className={inputClass}
              placeholder="6-digit code"
            />
          </div>
        ) : null}

        <div>
          <label className={labelClass}>Bootstrap secret (admin/trainer only)</label>
          <input
            type="password"
            value={bootstrap}
            onChange={(e) => setBootstrap(e.target.value)}
            placeholder="Optional"
            disabled={otpSent}
            className={inputClass}
          />
        </div>

        {message ? (
          <p className="rounded-xl border border-emerald-300/45 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}
        {error ? <p className="rounded-xl border border-red-300/45 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Please wait..." : otpSent ? "Verify OTP and Sign up" : "Send OTP"}
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
            className={secondaryButtonClass}
          >
            Edit details
          </button>
        ) : null}
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Have an account?{" "}
        <Link href="/login" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
          Log in
        </Link>
      </p>
    </AuthShell>
  );
}

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

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
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
      const res = await fetch("/api/auth/forgot-password/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setOtpSent(true);
      setMessage(data.message || "If this account exists, an OTP was sent to your email.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function onResetPassword(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      setMessage("Password reset successful. Redirecting to login...");
      setTimeout(() => {
        router.replace("/login");
        router.refresh();
      }, 1000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Reset Password"
      subtitle="Request a one-time code, verify it, and set a fresh password securely."
      badge="Account recovery"
      imageSrc="/Images/image2.jpg"
      imageAlt="Gym workout equipment"
    >
      <form onSubmit={otpSent ? onResetPassword : onRequestOtp} className="space-y-5">
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

        {otpSent ? (
          <>
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
            <div>
              <label className={labelClass}>New password</label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={inputClass}
                placeholder="At least 8 characters"
              />
            </div>
          </>
        ) : null}

        {message ? (
          <p className="rounded-xl border border-emerald-300/45 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}
        {error ? <p className="rounded-xl border border-red-300/45 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p> : null}

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Please wait..." : otpSent ? "Reset Password" : "Send OTP"}
        </button>

        {otpSent ? (
          <button
            type="button"
            onClick={() => {
              setOtpSent(false);
              setOtp("");
              setNewPassword("");
              setMessage("");
              setError("");
            }}
            className={secondaryButtonClass}
          >
            Use different email
          </button>
        ) : null}
      </form>

      <p className="mt-6 text-center text-sm text-slate-400">
        Remembered your password?{" "}
        <Link href="/login" className="font-semibold text-cyan-200 transition hover:text-cyan-100">
          Back to login
        </Link>
      </p>
    </AuthShell>
  );
}
"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiJson } from "@/lib/fetcher.js";

export default function ClientHome() {
  const [sub, setSub] = useState(null);
  const [banner, setBanner] = useState("");
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    apiJson("/api/client/subscription")
      .then((d) => {
        setSub(d);
        if (d.status === "expired") setBanner("Your subscription has expired.");
        else if (d.status === "expiring_soon")
          setBanner(`Your subscription expires in ${d.remainingDays} day(s).`);
      })
      .catch(() => setLoadError("Could not load subscription."));
  }, []);

  const status = sub?.status || "not_started";
  const statusClass =
    status === "active"
      ? "border-emerald-300/50 bg-emerald-500/15 text-emerald-100"
      : status === "expiring_soon"
        ? "border-amber-300/50 bg-amber-500/20 text-amber-100"
        : "border-red-300/45 bg-red-500/20 text-red-100";

  return (
    <div className="animate-lift-in space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/20">
        <Image
          src="/Images/heroImage.jpg"
          alt="Athlete training"
          width={4608}
          height={3456}
          className="h-56 w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#02070f]/90 via-[#02070f]/55 to-transparent" />
        <div className="absolute inset-0 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Member space</p>
          <h1 className="font-display mt-2 text-5xl leading-none text-white sm:text-6xl">Welcome Back</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
            Review subscription details, workouts, and attendance from one place.
          </p>
          <div className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${statusClass}`}>
            Subscription status: {status.replace("_", " ")}
          </div>
        </div>
      </section>

      {loadError ? (
        <div className="rounded-2xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {loadError}
        </div>
      ) : null}

      {banner ? (
        <div className="rounded-2xl border border-amber-300/50 bg-amber-500/15 px-4 py-3 text-sm text-amber-800 dark:text-amber-100">
          {banner}
        </div>
      ) : null}

      <article className="rounded-2xl border border-slate-900/10 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
          Current subscription
        </p>
        {sub?.subscription ? (
          <p className="mt-2 text-base font-medium text-slate-900 dark:text-slate-100">
            {sub.subscription.plan?.name} — ends{" "}
            {new Date(sub.subscription.endDate).toLocaleDateString()} ({sub.status})
          </p>
        ) : (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">No active subscription on file.</p>
        )}
      </article>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { href: "/client/workouts", title: "Workouts", image: "/Images/image4.jpg", detail: "Open your latest training plan." },
          { href: "/client/attendance", title: "Attendance and QR", image: "/Images/image5.jpg", detail: "Check visit history and check in quickly." },
          { href: "/client/payments", title: "Payments", image: "/Images/image2.jpg", detail: "Track paid invoices and billing entries." },
        ].map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group overflow-hidden rounded-2xl border border-white/20 bg-[#030a16]"
          >
            <div className="relative h-32 overflow-hidden">
              <Image
                src={card.image}
                alt={card.title}
                fill
                className="object-cover transition duration-500 group-hover:scale-110"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#02070f] via-[#02070f]/45 to-transparent" />
            </div>
            <div className="p-4">
              <p className="font-display text-3xl leading-none text-white">{card.title}</p>
              <p className="mt-2 text-sm text-slate-300">{card.detail}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/analytics", { credentials: "include" })
      .then((r) => r.json())
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-3xl bg-slate-300/40 dark:bg-white/10" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-2xl bg-slate-300/40 dark:bg-white/10" />
          ))}
        </div>
      </div>
    );
  }

  const cards = [
    { label: "Active members", value: Number(data.totalMembers || 0).toLocaleString("en-US") },
    {
      label: "Active subscriptions",
      value: Number(data.activeSubscriptions || 0).toLocaleString("en-US"),
    },
    {
      label: "Total revenue",
      value: Number(data.totalRevenue || 0).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
    },
    {
      label: "Revenue this month",
      value: Number(data.monthRevenue || 0).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
      }),
    },
  ];

  return (
    <div className="animate-lift-in space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-slate-200 dark:border-white/20">
        <Image
          src="/Images/admin_banner_light_hd.png"
          alt="Gym floor light"
          width={643}
          height={360}
          className="block h-44 w-full object-cover sm:h-52 dark:hidden"
          priority
        />
        <Image
          src="/Images/admin_banner_hd.png"
          alt="Gym floor dark"
          width={643}
          height={360}
          className="hidden h-44 w-full object-cover sm:h-52 dark:block"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50/95 via-slate-50/70 to-transparent dark:from-[#02070f]/85 dark:via-[#02070f]/55" />
        <div className="absolute inset-0 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-800 dark:text-cyan-200">Admin control center</p>
          <h1 className="font-display mt-2 text-5xl leading-none text-slate-900 dark:text-white sm:text-6xl">Business Pulse</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-600 dark:text-slate-200 sm:text-base">
            Monitor members, subscriptions, and revenue trends in one place.
          </p>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-slate-900/10 bg-slate-50/80 p-4 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
              {card.label}
            </p>
            <p className="mt-2 font-display text-5xl leading-none text-slate-900 dark:text-white">{card.value}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

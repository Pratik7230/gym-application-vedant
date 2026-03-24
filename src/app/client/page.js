"use client";

import { useEffect, useState } from "react";
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Welcome</h1>
      {loadError ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
          {loadError}
        </div>
      ) : null}
      {banner ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          {banner}
        </div>
      ) : null}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Current subscription</p>
        {sub?.subscription ? (
          <p className="mt-1 font-medium">
            {sub.subscription.plan?.name} — ends{" "}
            {new Date(sub.subscription.endDate).toLocaleDateString()} ({sub.status})
          </p>
        ) : (
          <p className="mt-1 text-zinc-500">No active subscription on file.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/client/workouts"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          View workouts
        </Link>
        <Link
          href="/client/attendance"
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600"
        >
          Attendance & QR
        </Link>
      </div>
    </div>
  );
}

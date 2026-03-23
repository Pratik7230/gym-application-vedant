"use client";

import { useEffect, useState } from "react";

export default function ClientSubscriptionPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch("/api/client/subscription", { credentials: "include" }).then((r) => r.json()).then(setData);
  }, []);

  if (!data) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Subscription</h1>
      {data.status === "expired" ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
          Your subscription has expired.
        </div>
      ) : null}
      {data.status === "expiring_soon" ? (
        <div className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
          Expires in {data.remainingDays} day(s).
        </div>
      ) : null}
      {data.subscription ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium">{data.subscription.plan?.name}</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {new Date(data.subscription.startDate).toLocaleDateString()} —{" "}
            {new Date(data.subscription.endDate).toLocaleDateString()}
          </p>
          <p className="mt-2 text-sm">Status: {data.status}</p>
          <p className="text-sm">Remaining days: {data.remainingDays}</p>
        </div>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">No subscription found.</p>
      )}
    </div>
  );
}

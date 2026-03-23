"use client";

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

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <p className="text-zinc-600 dark:text-zinc-400">Loading…</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Analytics</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Active members", value: data.totalMembers },
          { label: "Active subscriptions (cached)", value: data.activeSubscriptions },
          { label: "Total revenue (paid)", value: `$${Number(data.totalRevenue).toFixed(2)}` },
          { label: "Revenue this month", value: `$${Number(data.monthRevenue).toFixed(2)}` },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
          >
            <p className="text-sm text-zinc-500">{c.label}</p>
            <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

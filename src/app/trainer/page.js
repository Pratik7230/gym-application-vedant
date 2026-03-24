"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { apiJson } from "@/lib/fetcher.js";

export default function TrainerDashboard() {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiJson("/api/trainer/clients")
      .then((d) => setClients(d.items || []))
      .catch(() => setError("Could not load clients."));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Trainer dashboard</h1>
      {error ? (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
          {error}
        </div>
      ) : null}
      <p className="text-zinc-600 dark:text-zinc-400">
        You have <strong>{clients.length}</strong> assigned clients.
      </p>
      <Link
        href="/trainer/workouts"
        className="inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Manage workouts
      </Link>
    </div>
  );
}

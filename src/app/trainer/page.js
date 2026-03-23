"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function TrainerDashboard() {
  const [clients, setClients] = useState([]);

  useEffect(() => {
    fetch("/api/trainer/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClients(d.items || []));
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Trainer dashboard</h1>
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

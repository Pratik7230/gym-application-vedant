"use client";

import { useEffect, useState } from "react";

export default function ClientWorkoutsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/client/workouts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workout plans</h1>
      <div className="space-y-4">
        {items.map((w) => (
          <div
            key={w._id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <h2 className="font-semibold">{w.title}</h2>
            <p className="text-sm text-zinc-500">Trainer: {w.trainer?.name}</p>
            {w.progressNotes ? <p className="mt-2 text-sm">{w.progressNotes}</p> : null}
            <ul className="mt-2 list-inside list-disc text-sm">
              {(w.items || []).map((it, i) => (
                <li key={i}>
                  {it.name} — {it.sets}x {it.reps}
                </li>
              ))}
            </ul>
          </div>
        ))}
        {items.length === 0 ? <p className="text-zinc-500">No plans yet.</p> : null}
      </div>
    </div>
  );
}

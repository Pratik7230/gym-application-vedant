"use client";

import { useCallback, useEffect, useState } from "react";

export default function TrainerWorkoutsPage() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    clientId: "",
    title: "",
    items: [{ name: "Squat", sets: 3, reps: "10", notes: "" }],
    progressNotes: "",
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/trainer/workouts", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setItems(data.items);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
    fetch("/api/trainer/clients", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClients(d.items || []));
  }, [load]);

  async function create(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/trainer/workouts", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed");
    load();
  }

  async function remove(id) {
    if (!confirm("Delete workout plan?")) return;
    await fetch(`/api/trainer/workouts/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workout plans</h1>
      <form
        onSubmit={create}
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold">Create plan</h2>
        <div className="mt-3 space-y-3">
          <select
            required
            value={form.clientId}
            onChange={(e) => setForm((f) => ({ ...f, clientId: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="">Client</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <textarea
            placeholder="Progress notes"
            value={form.progressNotes}
            onChange={(e) => setForm((f) => ({ ...f, progressNotes: e.target.value }))}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <button
          type="submit"
          className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save plan
        </button>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="space-y-4">
        {items.map((w) => (
          <div
            key={w._id}
            className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold">{w.title}</h3>
                <p className="text-sm text-zinc-500">{w.client?.name}</p>
              </div>
              <button type="button" onClick={() => remove(w._id)} className="text-sm text-red-600">
                Delete
              </button>
            </div>
            <ul className="mt-2 list-inside list-disc text-sm">
              {(w.items || []).map((it, i) => (
                <li key={i}>
                  {it.name} — {it.sets}x {it.reps}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

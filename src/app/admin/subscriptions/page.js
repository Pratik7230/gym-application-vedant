"use client";

import { useCallback, useEffect, useState } from "react";

export default function AdminSubscriptionsPage() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    userId: "",
    planId: "",
    startDate: new Date().toISOString().slice(0, 10),
  });

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/subscriptions", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setItems(data.items);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/users?role=client&limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClients(d.items || []));
    fetch("/api/admin/plans", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setPlans(d.items || []));
  }, []);

  async function createSub(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/subscriptions", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.userId,
        planId: form.planId,
        startDate: form.startDate,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(typeof data.error === "string" ? data.error : "Failed");
    load();
  }

  async function remove(id) {
    if (!confirm("Delete subscription?")) return;
    await fetch(`/api/admin/subscriptions/${id}`, { method: "DELETE", credentials: "include" });
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Subscriptions</h1>
      <form
        onSubmit={createSub}
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold">Assign subscription</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <select
            required
            value={form.userId}
            onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="">Client</option>
            {clients.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name} — {c.email}
              </option>
            ))}
          </select>
          <select
            required
            value={form.planId}
            onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="">Plan</option>
            {plans.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name} ({p.durationDays}d)
              </option>
            ))}
          </select>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Create
          </button>
        </div>
      </form>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Start</th>
              <th className="px-3 py-2">End</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2" />
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s._id} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-3 py-2">{s.user?.name}</td>
                <td className="px-3 py-2">{s.plan?.name}</td>
                <td className="px-3 py-2">{new Date(s.startDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{new Date(s.endDate).toLocaleDateString()}</td>
                <td className="px-3 py-2">{s.cachedStatus}</td>
                <td className="px-3 py-2">
                  <button type="button" onClick={() => remove(s._id)} className="text-red-600">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

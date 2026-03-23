"use client";

import { useCallback, useEffect, useState } from "react";

export default function AdminPaymentsPage() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [form, setForm] = useState({
    userId: "",
    subscriptionId: "",
    amount: 0,
    status: "paid",
    note: "",
  });

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/payments?${params}`, { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setItems(data.items);
  }, [q]);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  useEffect(() => {
    fetch("/api/admin/users?role=client&limit=200", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setClients(d.items || []));
    fetch("/api/admin/subscriptions", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setSubs(d.items || []));
  }, []);

  async function createPayment(e) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/admin/payments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: form.userId,
        subscriptionId: form.subscriptionId || null,
        amount: Number(form.amount),
        status: form.status,
        note: form.note,
      }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed");
    setForm({ userId: "", subscriptionId: "", amount: 0, status: "paid", note: "" });
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Payments</h1>
      <form
        onSubmit={createPayment}
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold">Record manual payment</h2>
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
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={form.subscriptionId}
            onChange={(e) => setForm((f) => ({ ...f, subscriptionId: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="">Subscription (optional)</option>
            {subs.map((s) => (
              <option key={s._id} value={s._id}>
                {s.user?.email} — {s.plan?.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min={0}
            step="0.01"
            placeholder="Amount"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <select
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          >
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>
          <input
            placeholder="Note"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save
          </button>
        </div>
      </form>
      <div className="flex gap-2">
        <input
          placeholder="Filter list by name/email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
        />
        <button type="button" onClick={() => load()} className="rounded-lg border px-3 py-2 text-sm">
          Apply
        </button>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Member</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Note</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-3 py-2">{new Date(p.paidAt).toLocaleString()}</td>
                <td className="px-3 py-2">{p.user?.name}</td>
                <td className="px-3 py-2">
                  {p.currency} {p.amount}
                </td>
                <td className="px-3 py-2">{p.status}</td>
                <td className="px-3 py-2">{p.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

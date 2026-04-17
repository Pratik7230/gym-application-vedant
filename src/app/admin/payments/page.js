"use client";

import { useCallback, useEffect, useState } from "react";

function loadRazorpayCheckoutScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Payment checkout is only available in browser"));
      return;
    }
    if (window.Razorpay) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Unable to load Razorpay checkout"));
    document.body.appendChild(script);
  });
}

export default function AdminPaymentsPage() {
  const [items, setItems] = useState([]);
  const [clients, setClients] = useState([]);
  const [subs, setSubs] = useState([]);
  const [error, setError] = useState("");
  const [isRazorpayLoading, setIsRazorpayLoading] = useState(false);
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

  async function startRazorpayPayment() {
    setError("");
    if (!form.userId) {
      setError("Please select a client");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setError("Please enter a valid amount greater than 0");
      return;
    }

    setIsRazorpayLoading(true);
    try {
      await loadRazorpayCheckoutScript();

      const orderRes = await fetch("/api/admin/payments/razorpay/order", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          subscriptionId: form.subscriptionId || null,
          amount,
          note: form.note,
        }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || "Failed to create payment order");
      }

      const checkout = new window.Razorpay({
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: "Iron Fitness",
        description: "Membership payment",
        prefill: {
          name: orderData.customer?.name || "",
          email: orderData.customer?.email || "",
          contact: orderData.customer?.phone || "",
        },
        handler: async (response) => {
          try {
            const verifyRes = await fetch("/api/admin/payments/razorpay/verify", {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: form.userId,
                subscriptionId: form.subscriptionId || null,
                amount,
                currency: orderData.currency,
                note: form.note,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            });
            const verifyData = await verifyRes.json();
            if (!verifyRes.ok) throw new Error(verifyData.error || "Payment verification failed");

            setForm({ userId: "", subscriptionId: "", amount: 0, status: "paid", note: "" });
            await load();
          } catch (e) {
            setError(e.message || "Payment verification failed");
          }
        },
        modal: {
          ondismiss: () => setError("Payment cancelled"),
        },
      });

      checkout.on("payment.failed", (response) => {
        const message = response?.error?.description || "Payment failed";
        setError(message);
      });

      checkout.open();
    } catch (e) {
      setError(e.message || "Unable to start Razorpay payment");
    } finally {
      setIsRazorpayLoading(false);
    }
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
          <button
            type="button"
            onClick={startRazorpayPayment}
            disabled={isRazorpayLoading}
            className="rounded-lg border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
          >
            {isRazorpayLoading ? "Starting..." : "Pay with Razorpay"}
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

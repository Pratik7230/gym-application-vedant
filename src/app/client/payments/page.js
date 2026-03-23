"use client";

import { useEffect, useState } from "react";

export default function ClientPaymentsPage() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("/api/client/payments", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Payment history</h1>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Amount</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p._id} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-3 py-2">{new Date(p.paidAt).toLocaleString()}</td>
                <td className="px-3 py-2">
                  {p.currency} {p.amount}
                </td>
                <td className="px-3 py-2">{p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {items.length === 0 ? <p className="text-zinc-500">No payments recorded.</p> : null}
    </div>
  );
}

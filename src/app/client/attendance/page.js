"use client";

import { useEffect, useState } from "react";

export default function ClientAttendancePage() {
  const [items, setItems] = useState([]);
  const [qr, setQr] = useState("");

  useEffect(() => {
    fetch("/api/client/attendance", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setItems(d.items || []));
  }, []);

  async function loadQr() {
    const res = await fetch("/api/client/attendance-qrcode", { credentials: "include" });
    const data = await res.json();
    if (res.ok) setQr(data.url);
  }

  useEffect(() => {
    loadQr();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Attendance</h1>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold">QR check-in URL</h2>
        <p className="mt-1 break-all text-sm text-zinc-600 dark:text-zinc-400">{qr || "Loading…"}</p>
        <p className="mt-2 text-xs text-zinc-500">
          Encode this URL in a QR code at the front desk. Scanning records one check-in per day.
        </p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">Day</th>
              <th className="px-3 py-2">Checked in</th>
              <th className="px-3 py-2">Source</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a._id} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-3 py-2">{new Date(a.date).toLocaleDateString()}</td>
                <td className="px-3 py-2">{new Date(a.checkedInAt).toLocaleString()}</td>
                <td className="px-3 py-2">{a.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

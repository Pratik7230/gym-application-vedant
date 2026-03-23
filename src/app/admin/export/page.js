"use client";

export default function AdminExportPage() {
  const base = "/api/admin/export";
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Export CSV</h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Downloads use your admin session cookie. Open each link while logged in.
      </p>
      <ul className="space-y-2 text-sm">
        <li>
          <a
            href={`${base}?type=users`}
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
            target="_blank"
            rel="noreferrer"
          >
            Export users
          </a>
        </li>
        <li>
          <a
            href={`${base}?type=payments`}
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
            target="_blank"
            rel="noreferrer"
          >
            Export payments
          </a>
        </li>
        <li>
          <a
            href={`${base}?type=subscriptions`}
            className="font-medium text-zinc-900 underline dark:text-zinc-100"
            target="_blank"
            rel="noreferrer"
          >
            Export subscriptions
          </a>
        </li>
      </ul>
    </div>
  );
}

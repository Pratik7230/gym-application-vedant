"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function ClientProfilePage() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/users/me", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setUser(d.user);
        setName(d.user?.name || "");
        setPhone(d.user?.phone || "");
      });
  }, []);

  async function save(e) {
    e.preventDefault();
    setError("");
    setMsg("");
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed");
    setUser(data.user);
    setMsg("Saved.");
  }

  async function uploadAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setMsg("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload/avatar", { method: "POST", credentials: "include", body: fd });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Upload failed");
    setUser((u) => ({ ...u, avatarUrl: data.url }));
    setMsg("Photo updated.");
  }

  if (!user) return <p className="text-zinc-500">Loading…</p>;

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Profile</h1>
      <div className="flex items-center gap-4">
        <div className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          {user.avatarUrl ? (
            <Image src={user.avatarUrl} alt="" fill className="object-cover" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-sm text-zinc-500">No photo</span>
          )}
        </div>
        <label className="cursor-pointer text-sm font-medium text-zinc-900 underline dark:text-zinc-100">
          Upload photo
          <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
        </label>
      </div>
      <form onSubmit={save} className="space-y-3">
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email</label>
          <p className="text-sm text-zinc-600">{user.email}</p>
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {msg ? <p className="text-sm text-green-600">{msg}</p> : null}
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          Save
        </button>
      </form>
    </div>
  );
}

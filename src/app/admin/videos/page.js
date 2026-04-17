"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const initialForm = {
  title: "",
  youtubeUrl: "",
  description: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminVideosPage() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState("");

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/video-tutorials", { credentials: "include" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setItems(data.items || []);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [load]);

  async function saveVideo(e) {
    e.preventDefault();
    setError("");

    const payload = {
      title: form.title,
      youtubeUrl: form.youtubeUrl,
      description: form.description,
      sortOrder: Number(form.sortOrder),
      isActive: Boolean(form.isActive),
    };

    const endpoint = isEditing ? `/api/admin/video-tutorials/${editingId}` : "/api/admin/video-tutorials";
    const method = isEditing ? "PATCH" : "POST";

    const res = await fetch(endpoint, {
      method,
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed");

    setForm(initialForm);
    setEditingId("");
    load();
  }

  function startEdit(item) {
    setEditingId(item._id);
    setForm({
      title: item.title || "",
      youtubeUrl: item.youtubeUrl || "",
      description: item.description || "",
      sortOrder: Number(item.sortOrder || 0),
      isActive: Boolean(item.isActive),
    });
    setError("");
  }

  function cancelEdit() {
    setEditingId("");
    setForm(initialForm);
    setError("");
  }

  async function deleteVideo(id) {
    if (!confirm("Delete this video tutorial?")) return;
    setError("");

    const res = await fetch(`/api/admin/video-tutorials/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const data = await res.json();
    if (!res.ok) return setError(data.error || "Failed");

    if (editingId === id) cancelEdit();
    load();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Video tutorials</h1>

      <form
        onSubmit={saveVideo}
        className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="text-sm font-semibold">{isEditing ? "Update tutorial" : "Add tutorial"}</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <input
            required
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <input
            required
            placeholder="YouTube URL"
            value={form.youtubeUrl}
            onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <input
            type="number"
            min={0}
            placeholder="Sort order"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
          />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
              className="h-4 w-4"
            />
            Active
          </label>
        </div>

        <div className="mt-3 flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {isEditing ? "Update" : "Add"}
          </button>
          {isEditing ? (
            <button
              type="button"
              onClick={cancelEdit}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-100 dark:bg-zinc-800">
            <tr>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">URL</th>
              <th className="px-3 py-2">Order</th>
              <th className="px-3 py-2">Active</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item._id} className="border-t border-zinc-200 dark:border-zinc-700">
                <td className="px-3 py-2">{item.title}</td>
                <td className="max-w-[20rem] truncate px-3 py-2">{item.youtubeUrl}</td>
                <td className="px-3 py-2">{item.sortOrder}</td>
                <td className="px-3 py-2">{item.isActive ? "yes" : "no"}</td>
                <td className="px-3 py-2">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="mr-3 text-cyan-700 dark:text-cyan-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteVideo(item._id)}
                    className="text-red-600"
                  >
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

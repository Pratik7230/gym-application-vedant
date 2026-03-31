"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { apiJson } from "@/lib/fetcher.js";

export default function TrainerDashboard() {
  const [clients, setClients] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiJson("/api/trainer/clients")
      .then((d) => setClients(d.items || []))
      .catch(() => setError("Could not load clients."));
  }, []);

  const previewClients = clients.slice(0, 4);

  return (
    <div className="animate-lift-in space-y-6">
      <section className="relative overflow-hidden rounded-3xl border border-white/20">
        <Image
          src="/Images/image3.jpg"
          alt="Trainer workout"
          width={300}
          height={168}
          className="h-52 w-full object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#02070f]/88 via-[#02070f]/55 to-transparent" />
        <div className="absolute inset-0 p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-200">Trainer workspace</p>
          <h1 className="font-display mt-2 text-5xl leading-none text-white sm:text-6xl">Client Coaching</h1>
          <p className="mt-3 max-w-xl text-sm text-slate-200 sm:text-base">
            Manage assigned clients and update programs with consistent progress tracking.
          </p>
        </div>
      </section>

      {error ? (
        <div className="rounded-2xl border border-red-300/50 bg-red-500/10 px-4 py-3 text-sm text-red-700 dark:text-red-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-2xl border border-slate-900/10 bg-white/75 p-5 shadow-sm backdrop-blur dark:border-white/15 dark:bg-white/5">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
            Assigned clients
          </p>
          <p className="font-display mt-2 text-6xl leading-none text-slate-900 dark:text-white">{clients.length}</p>
          {previewClients.length ? (
            <ul className="mt-4 space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {previewClients.map((client) => (
                <li key={client._id} className="rounded-xl border border-slate-900/10 bg-white/55 px-3 py-2 dark:border-white/10 dark:bg-white/5">
                  {client.name || client.email}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">No clients assigned yet.</p>
          )}
        </article>

        <article className="overflow-hidden rounded-2xl border border-white/20 bg-[#030a16]">
          <div className="relative h-40">
            <Image
              src="/Images/image6.jpg"
              alt="Cardio workout"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02070f] via-[#02070f]/50 to-transparent" />
          </div>
          <div className="p-5">
            <p className="font-display text-4xl leading-none text-white">Workout Builder</p>
            <p className="mt-2 text-sm text-slate-300">
              Create, assign, and update workout plans for each member in your roster.
            </p>
            <Link
              href="/trainer/workouts"
              className="mt-4 inline-flex rounded-xl border border-cyan-300/65 bg-cyan-300 px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-slate-950 transition hover:bg-cyan-200"
            >
              Manage workouts
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}

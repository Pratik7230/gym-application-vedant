import Image from "next/image";
import Link from "next/link";

export function AuthShell({ title, subtitle, badge, imageSrc, imageAlt, children }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_15%,rgba(56,189,248,0.28),transparent_36%),radial-gradient(circle_at_92%_90%,rgba(245,158,11,0.2),transparent_36%)]" />
      <div className="spot-grid pointer-events-none absolute inset-0 opacity-20" />

      <div className="relative grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-cyan-300/35 bg-[#030a17]/90 shadow-[0_36px_90px_rgba(2,8,20,0.75)] md:grid-cols-[0.96fr_1.04fr]">
        <div className="relative hidden min-h-[640px] md:block">
          <Image src={imageSrc} alt={imageAlt} fill priority className="object-cover" sizes="40vw" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#02070f]/65 via-[#02070f]/35 to-[#02070f]/92" />

          <div className="absolute inset-0 flex flex-col justify-between p-10">
            <div>
              <Link href="/" className="font-display text-5xl leading-none text-white">
                Iron Fitness
              </Link>
              <p className="mt-5 max-w-xs text-sm leading-relaxed text-slate-200">
                Train hard. Track progress. Keep every membership and workout in one place.
              </p>
            </div>
            <div className="glass-panel rounded-2xl p-5 text-sm text-slate-200">
              <p className="font-medium text-white">Discipline creates momentum.</p>
              <p className="mt-2 leading-relaxed text-slate-300">
                Stay consistent with workouts, attendance, and subscriptions that update in real time.
              </p>
            </div>
          </div>
        </div>

        <div className="relative p-6 sm:p-10 md:p-12">
          <div className="relative mb-6 h-40 overflow-hidden rounded-2xl border border-white/20 md:hidden">
            <Image src={imageSrc} alt={imageAlt} fill className="object-cover" sizes="100vw" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#02070f]/80 to-transparent" />
          </div>

          <Link
            href="/"
            className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-100"
          >
            Back to home
          </Link>

          <p className="mt-5 inline-flex rounded-full border border-amber-300/50 bg-amber-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100">
            {badge}
          </p>
          <h1 className="font-display mt-4 text-6xl leading-[0.9] text-white sm:text-7xl">{title}</h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">{subtitle}</p>

          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}
import Image from "next/image";
import Link from "next/link";

const stats = [
  { label: "Active Members", value: "1,200+" },
  { label: "Monthly Check-ins", value: "18k" },
  { label: "Trainer Programs", value: "340" },
  { label: "Renewal Rate", value: "92%" },
];

const trainingPillars = [
  {
    title: "Strength Lab",
    description: "Structured compound lifts with progressive overload and clear weekly targets.",
    image: "/Images/image1.jpg",
    tag: "Power",
  },
  {
    title: "Athletic Conditioning",
    description: "Circuits, ropes, and interval blocks to build speed, endurance, and control.",
    image: "/Images/image3.jpg",
    tag: "Conditioning",
  },
  {
    title: "Cardio Systems",
    description: "Treadmill and recovery protocols designed to improve stamina sustainably.",
    image: "/Images/image6.jpg",
    tag: "Endurance",
  },
];

const roleCards = [
  {
    title: "Admin",
    detail: "Track memberships, plans, payments, attendance, exports, and activity logs.",
  },
  {
    title: "Trainer",
    detail: "Manage assigned clients and create workouts with clear execution history.",
  },
  {
    title: "Member",
    detail: "View subscription status, attendance QR, workouts, profile, and payment history.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030915] text-slate-100">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(56,189,248,0.24),transparent_32%),radial-gradient(circle_at_88%_92%,rgba(245,158,11,0.18),transparent_36%)]" />
      <div className="spot-grid pointer-events-none absolute inset-0 opacity-20" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-4 pt-6 sm:px-6 sm:pt-8">
        <Link href="/" className="font-display text-4xl leading-none text-white sm:text-5xl">
          Iron Fitness
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-cyan-300/60 bg-cyan-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-cyan-300/45 bg-slate-950/40 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:-translate-y-0.5 hover:bg-slate-900/70"
          >
            Join now
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pb-20 sm:pt-10">
        <section className="grid items-stretch gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="glass-panel animate-lift-in rounded-[30px] p-6 sm:p-8 md:p-10">
            <p className="inline-flex rounded-full border border-amber-300/45 bg-amber-300/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
              Gym Management Suite
            </p>
            <h1 className="font-display mt-5 text-6xl leading-[0.9] text-white sm:text-7xl md:text-8xl">
              Train Better.
              <br />
              Run Smarter.
            </h1>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base">
              A complete platform for modern gyms. Manage memberships, automate subscriptions,
              handle trainer workflows, and give members a premium digital experience.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="rounded-xl border border-cyan-300/70 bg-cyan-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-950 transition hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                Start Membership
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10"
              >
                Open Dashboard
              </Link>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/15 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <p className="font-display text-4xl leading-none text-cyan-200">{item.value}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.15em] text-slate-300">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative animate-lift-in overflow-hidden rounded-[30px] border border-white/15">
            <Image
              src="/Images/aboutimg.jpg"
              alt="Modern gym interior"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 40vw"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-[#030915]/65 via-transparent to-[#030915]/90" />
            <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
              <div className="glass-panel rounded-2xl p-4 text-sm text-slate-200">
                <p className="font-display text-3xl leading-none text-cyan-100">Elite Training Atmosphere</p>
                <p className="mt-3 leading-relaxed text-slate-300">
                  Combine sharp operations with an unforgettable in-gym experience for every member.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Programs</p>
              <h2 className="font-display text-5xl leading-none text-white sm:text-6xl">What You Build</h2>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {trainingPillars.map((pillar) => (
              <article
                key={pillar.title}
                className="group overflow-hidden rounded-3xl border border-white/15 bg-white/[0.04]"
              >
                <div className="relative h-40 overflow-hidden">
                  <Image
                    src={pillar.image}
                    alt={pillar.title}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#02070f] via-[#02070f]/25 to-transparent" />
                  <span className="absolute left-4 top-4 rounded-full border border-cyan-300/50 bg-[#021225]/85 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-cyan-200">
                    {pillar.tag}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-display text-4xl leading-none text-white">{pillar.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-300">{pillar.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-14 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <article className="glass-panel rounded-3xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Role based</p>
            <h3 className="font-display mt-3 text-5xl leading-none text-slate-900 dark:text-white">
              Built For Every Team
            </h3>
            <div className="mt-6 space-y-3">
              {roleCards.map((role) => (
                <div
                  key={role.title}
                  className="rounded-2xl border border-slate-900/10 bg-white/50 p-4 dark:border-white/15 dark:bg-white/5"
                >
                  <p className="font-display text-3xl leading-none text-slate-900 dark:text-cyan-100">
                    {role.title}
                  </p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">{role.detail}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="glass-panel rounded-3xl p-6 sm:p-8">
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-200">Coaching team</p>
            <h3 className="font-display mt-3 text-5xl leading-none text-slate-900 dark:text-white">
              Real People. Real Support.
            </h3>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                { src: "/Images/pic1.jpg", alt: "Coach portrait" },
                { src: "/Images/pic2.jpg", alt: "Coach portrait" },
                { src: "/Images/pic3.jpg", alt: "Coach portrait" },
              ].map((person) => (
                <div key={person.src} className="relative h-36 overflow-hidden rounded-2xl border border-white/20">
                  <Image
                    src={person.src}
                    alt={person.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, 25vw"
                  />
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              Trainers and members stay synced with centralized workouts, attendance records, and
              live subscription status.
            </p>
          </article>
        </section>
      </main>
    </div>
  );
}

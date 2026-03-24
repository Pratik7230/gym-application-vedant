import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(69,255,202,0.18),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(69,255,202,0.12),transparent_30%)]" />
      <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-[#45ffca]/40 bg-[#111]/95 p-8 shadow-[0_0_40px_rgba(69,255,202,0.2)] sm:p-12">
        <h1 className="text-center text-4xl font-extrabold tracking-wide sm:text-5xl">
          Iron <span className="text-[#45ffca]">Fitness</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-center text-zinc-300">
          Members, subscriptions, trainers, and workouts in one place. Track progress, stay
          consistent, and build your dream physique.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/login"
            className="rounded-xl border border-[#45ffca] bg-[#45ffca] px-6 py-3 text-sm font-semibold text-black transition hover:shadow-[0_0_18px_rgba(69,255,202,0.6)]"
          >
            Log in
          </Link>
          <Link
            href="/signup"
            className="rounded-xl border border-[#45ffca]/70 px-6 py-3 text-sm font-semibold text-[#45ffca] transition hover:bg-[#45ffca]/10"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

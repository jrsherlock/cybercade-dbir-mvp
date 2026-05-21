import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
      <p className="mb-6 font-mono text-xs uppercase tracking-[0.3em] text-muted">
        Presented by ProCircular
      </p>
      <h1 className="text-5xl font-bold tracking-tight sm:text-7xl">
        <span className="text-brand">CYBER</span>CADE
      </h1>
      <p className="mt-3 font-mono text-sm uppercase tracking-[0.4em] text-brand-2">
        2026-DBIR Edition
      </p>
      <p className="mt-8 max-w-md text-balance text-muted">
        A real-time arcade game built on the Verizon 2026 Data Breach
        Investigations Report. Spot the threat. Stop the breach.
      </p>
      <Link
        href="/play"
        className="mt-10 rounded-full bg-brand px-8 py-3 font-semibold text-[#0a0b0f] transition-transform hover:scale-105"
      >
        Play the demo
      </Link>
      <p className="mt-4 font-mono text-xs text-muted">
        M1 preview — one wave playable
      </p>
    </main>
  );
}

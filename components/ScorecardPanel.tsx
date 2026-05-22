"use client";

import { useMemo, useState } from "react";
import posthog from "posthog-js";
import { createClient } from "@/lib/supabase/client";
import type { GameResult } from "@/game/types";
import type { Scorecard, ScorecardCategory } from "@/lib/scorecard";

type Segment = "individual" | "team-lead" | "security";
type Step = "intro" | "form" | "submitting" | "done" | "error";

interface DoneState {
  scorecard: Scorecard;
  blurb: string;
  emailed: boolean;
  cta: { label: string; url: string };
}

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: "individual", label: "Just me" },
  { id: "team-lead", label: "I lead a team" },
  { id: "security", label: "I run security" },
];

const GRADE_BAR: Record<ScorecardCategory["grade"], string> = {
  Strong: "bg-brand",
  Solid: "bg-brand-2",
  Shaky: "bg-warning",
  "At Risk": "bg-danger",
  Untested: "bg-white/20",
};

/** End-of-game lead capture: intro CTA -> email form -> Human Risk Profile. */
export default function ScorecardPanel({ result }: { result: GameResult }) {
  const supabase = useMemo(() => createClient(), []);
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [segment, setSegment] = useState<Segment>("individual");
  const [done, setDone] = useState<DoneState | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    setStep("submitting");
    try {
      const session = (await supabase.auth.getSession()).data.session;
      const res = await fetch("/api/scorecard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ name, email, company, segment, result }),
      });
      if (!res.ok) throw new Error("request failed");
      setDone((await res.json()) as DoneState);
      posthog.capture("lead_captured", { segment });
      setStep("done");
    } catch {
      setStep("error");
    }
  }

  if (step === "intro") {
    return (
      <div className="flex w-full flex-col items-center gap-2">
        <button
          onClick={() => {
            posthog.capture("scorecard_opened");
            setStep("form");
          }}
          className="w-full rounded-full bg-brand px-6 py-3 text-sm font-bold text-[#0a0b0f] transition-transform hover:scale-[1.03] active:scale-95"
        >
          Get my Human Risk Profile →
        </button>
        <p className="font-mono text-[10px] text-muted">
          See exactly where attackers would target you.
        </p>
      </div>
    );
  }

  if (step === "submitting") {
    return (
      <p className="animate-pulse py-4 font-mono text-sm text-brand-2">
        Analyzing your run…
      </p>
    );
  }

  if (step === "error") {
    return (
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-danger">
          Couldn&apos;t generate your profile. Please try again.
        </p>
        <button
          onClick={() => setStep("form")}
          className="rounded-full border border-white/15 px-5 py-2 text-sm font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  if (step === "form") {
    return (
      <form onSubmit={submit} className="flex w-full flex-col gap-2.5 text-left">
        <p className="text-center text-sm font-semibold text-foreground">
          Where should we send your profile?
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name (optional)"
          className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Work email"
          className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <input
          type="text"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company (optional)"
          className="rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-muted">
          I&apos;m playing as
        </p>
        <div className="grid grid-cols-3 gap-1.5">
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSegment(s.id)}
              className={`rounded-lg border px-1 py-2 text-xs font-medium transition-colors ${
                segment === s.id
                  ? "border-brand bg-brand/10 text-brand"
                  : "border-white/10 bg-surface text-muted"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          type="submit"
          className="mt-1 w-full rounded-full bg-brand px-6 py-3 text-sm font-bold text-[#0a0b0f] transition-transform hover:scale-[1.03] active:scale-95"
        >
          See my profile
        </button>
        <p className="text-center font-mono text-[9px] text-muted">
          Cybercade is a ProCircular company. We&apos;ll email your profile and
          may follow up — no spam.
        </p>
      </form>
    );
  }

  // step === "done"
  const card = done!;
  return (
    <div className="flex w-full flex-col items-center gap-3">
      <div className="w-full rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 text-center">
        <p className="font-mono text-[9px] uppercase tracking-widest text-brand-2">
          Your archetype
        </p>
        <p className="mt-0.5 text-xl font-bold text-brand">
          {card.scorecard.archetype.name}
        </p>
        <p className="mt-1 text-xs text-muted">
          {card.scorecard.archetype.tagline}
        </p>
      </div>

      <p className="text-sm leading-relaxed text-foreground">{card.blurb}</p>

      <div className="flex w-full flex-col gap-2">
        {card.scorecard.categories.map((c) => (
          <div key={c.id} className="text-left">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-foreground">{c.label}</span>
              <span className="font-mono text-[10px] text-muted">{c.grade}</span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
              <div
                className={`h-full rounded-full ${GRADE_BAR[c.grade]}`}
                style={{ width: `${Math.round(c.accuracy * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <a
        href={card.cta.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => posthog.capture("cta_clicked")}
        className="mt-1 w-full rounded-full bg-brand px-6 py-3 text-center text-sm font-bold text-[#0a0b0f] transition-transform hover:scale-[1.03]"
      >
        {card.cta.label} →
      </a>
      <p className="font-mono text-[10px] text-muted">
        {card.emailed
          ? `Full profile emailed to ${email}.`
          : "Your profile is ready above."}
      </p>
    </div>
  );
}

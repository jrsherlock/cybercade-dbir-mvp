import type { GameResult, LaneId } from "@/game/types";

/**
 * Builds the "Human Risk Profile" from a game result — a deterministic
 * archetype, per-category grades, and tiers. Pure (no Phaser, no I/O) so it
 * runs identically on the client and in the scorecard API route.
 */

export interface ScorecardCategory {
  id: LaneId;
  label: string;
  blurb: string;
  faced: number;
  stopped: number;
  /** 0..1 */
  accuracy: number;
  grade: "Strong" | "Solid" | "Shaky" | "At Risk" | "Untested";
}

export interface Archetype {
  id: string;
  name: string;
  tagline: string;
}

export interface Scorecard {
  archetype: Archetype;
  tier: "Elite" | "Strong" | "Developing" | "Needs Work";
  /** 0..1 — threats stopped across all categories. */
  overallAccuracy: number;
  categories: ScorecardCategory[];
  strongest: ScorecardCategory | null;
  weakest: ScorecardCategory | null;
}

const CATEGORY_META: Record<LaneId, { label: string; blurb: string }> = {
  inbox: {
    label: "Phishing & Social Engineering",
    blurb: "Spotting fake emails, texts, and pretexting.",
  },
  logins: {
    label: "Credentials & Access",
    blurb: "Defending logins with MFA and good password hygiene.",
  },
  devices: {
    label: "Devices & Patching",
    blurb: "Securing laptops and keeping software patched.",
  },
  webai: {
    label: "Web & Shadow AI",
    blurb: "Safe browsing and keeping secrets out of AI tools.",
  },
};

function grade(accuracy: number, faced: number): ScorecardCategory["grade"] {
  if (faced === 0) return "Untested";
  if (accuracy >= 0.85) return "Strong";
  if (accuracy >= 0.6) return "Solid";
  if (accuracy >= 0.35) return "Shaky";
  return "At Risk";
}

function tierFor(overall: number): Scorecard["tier"] {
  if (overall >= 0.85) return "Elite";
  if (overall >= 0.65) return "Strong";
  if (overall >= 0.45) return "Developing";
  return "Needs Work";
}

function archetypeFor(
  overall: number,
  strongest: ScorecardCategory | null,
): Archetype {
  if (overall >= 0.85) {
    return {
      id: "human-firewall",
      name: "The Human Firewall",
      tagline: "Calm, sharp, and almost unbreachable.",
    };
  }
  if (overall <= 0.4) {
    return {
      id: "click-happy",
      name: "Click-Happy Rookie",
      tagline: "Fast on the tap — instincts are absolutely trainable.",
    };
  }
  switch (strongest?.id) {
    case "inbox":
      return {
        id: "phishing-black-belt",
        name: "Phishing Black Belt",
        tagline: "Fake emails and slick pretexts don't fool you.",
      };
    case "webai":
      return {
        id: "shadow-ai-wrangler",
        name: "Shadow AI Wrangler",
        tagline: "You keep the company's secrets out of the wrong tools.",
      };
    case "logins":
      return {
        id: "the-gatekeeper",
        name: "The Gatekeeper",
        tagline: "Credentials locked down, attackers locked out.",
      };
    case "devices":
      return {
        id: "the-quartermaster",
        name: "The Quartermaster",
        tagline: "Patched, encrypted, and accounted for.",
      };
    default:
      return {
        id: "steady-defender",
        name: "The Steady Defender",
        tagline: "Solid instincts — and getting sharper.",
      };
  }
}

export function buildScorecard(result: GameResult): Scorecard {
  const categories: ScorecardCategory[] = (result.categories ?? [])
    .filter((c) => c.id in CATEGORY_META)
    .map((c) => {
      const faced = Math.max(0, Math.floor(Number(c.faced) || 0));
      const stopped = Math.max(0, Math.min(Math.floor(Number(c.stopped) || 0), faced));
      const accuracy = faced > 0 ? stopped / faced : 0;
      const meta = CATEGORY_META[c.id];
      return {
        id: c.id,
        label: meta.label,
        blurb: meta.blurb,
        faced,
        stopped,
        accuracy,
        grade: grade(accuracy, faced),
      };
    });

  const tested = categories.filter((c) => c.faced > 0);
  const totalFaced = tested.reduce((sum, c) => sum + c.faced, 0);
  const totalStopped = tested.reduce((sum, c) => sum + c.stopped, 0);
  const overallAccuracy = totalFaced > 0 ? totalStopped / totalFaced : 0;

  const ranked = [...tested].sort((a, b) => b.accuracy - a.accuracy);
  const strongest = ranked[0] ?? null;
  const weakest = ranked.length > 0 ? ranked[ranked.length - 1] : null;

  return {
    archetype: archetypeFor(overallAccuracy, strongest),
    tier: tierFor(overallAccuracy),
    overallAccuracy,
    categories,
    strongest,
    weakest,
  };
}

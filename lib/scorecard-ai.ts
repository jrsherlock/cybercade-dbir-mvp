import { generateText } from "ai";
import type { Scorecard } from "./scorecard";

/**
 * The AI flavor paragraph for the scorecard (the "hybrid" half). Uses the
 * Vercel AI Gateway via a plain provider/model string. Always degrades to a
 * deterministic template — if there's no gateway key, or the call is slow or
 * fails, the scorecard email never blocks on it.
 */

interface BlurbInput {
  scorecard: Scorecard;
  survived: boolean;
  score: number;
}

function fallback({ scorecard, survived }: BlurbInput): string {
  const { archetype, strongest, weakest } = scorecard;
  const parts = [`You played like ${archetype.name} — ${archetype.tagline}`];
  if (strongest) {
    parts.push(`Your sharpest instinct: ${strongest.label.toLowerCase()}.`);
  }
  if (weakest && weakest.id !== strongest?.id) {
    parts.push(
      `Where an attacker would get the best shot at you: ${weakest.label.toLowerCase()}.`,
    );
  }
  parts.push(
    survived
      ? "You held the line — and the 2026 DBIR says that matters: the human element is in 62% of breaches."
      : "The company got breached this time — but the human element is in 62% of breaches, and instincts like these are exactly what's trainable.",
  );
  return parts.join(" ");
}

export async function scorecardBlurb(input: BlurbInput): Promise<string> {
  if (!process.env.AI_GATEWAY_API_KEY) return fallback(input);

  try {
    const { scorecard, survived } = input;
    const cats = scorecard.categories
      .map((c) => `${c.label}: ${Math.round(c.accuracy * 100)}% (${c.grade})`)
      .join("; ");

    const { text } = await generateText({
      model: "anthropic/claude-haiku-4-5",
      abortSignal: AbortSignal.timeout(7000),
      maxOutputTokens: 220,
      prompt:
        `Write a punchy, encouraging 2-3 sentence "Human Risk Profile" summary for ` +
        `someone who just played a cybersecurity-awareness arcade game. Voice: ` +
        `candid, witty, conversational — never fear-mongering or corporate. ` +
        `Second person ("you"). No emojis, no headings, no markdown.\n\n` +
        `Archetype: ${scorecard.archetype.name} — ${scorecard.archetype.tagline}\n` +
        `Tier: ${scorecard.tier} (${Math.round(scorecard.overallAccuracy * 100)}% of threats stopped)\n` +
        `Category breakdown: ${cats}\n` +
        `Outcome: ${survived ? "cleared all four waves" : "breached before the end"}.\n\n` +
        `Name their strongest and weakest area. End on an encouraging note tied to ` +
        `real cybersecurity — it's fine to reference the 2026 Verizon DBIR finding ` +
        `that the human element is in 62% of breaches.`,
    });
    return text.trim() || fallback(input);
  } catch {
    return fallback(input);
  }
}

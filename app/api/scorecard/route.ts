import { NextResponse } from "next/server";
import { Resend } from "resend";
import { getRequestUserId } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildScorecard } from "@/lib/scorecard";
import { scorecardBlurb } from "@/lib/scorecard-ai";
import { renderScorecardEmail } from "@/lib/email/scorecard-email";
import type { GameResult } from "@/game/types";

type Segment = "individual" | "team-lead" | "security";

// Audience-routed call-to-action. URLs are placeholders pending final links.
const CTA: Record<Segment, { target: string; label: string; url: string }> = {
  individual: {
    target: "cybercade",
    label: "Get weekly 2-minute challenges",
    url: "https://cybercade.com",
  },
  "team-lead": {
    target: "procircular",
    label: "See your team's real exposure",
    url: "https://procircular.com",
  },
  security: {
    target: "procircular",
    label: "Book a security risk assessment",
    url: "https://procircular.com",
  },
};

interface ScorecardBody {
  name?: string;
  email?: string;
  company?: string;
  segment?: string;
  result?: GameResult;
}

/** POST /api/scorecard — build the Human Risk Profile, store the lead, email it. */
export async function POST(req: Request) {
  const userId = await getRequestUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: ScorecardBody;
  try {
    body = (await req.json()) as ScorecardBody;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const result = body.result;
  if (!email || !email.includes("@") || !result || !Array.isArray(result.categories)) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const segment: Segment =
    body.segment === "team-lead" || body.segment === "security"
      ? body.segment
      : "individual";
  const cta = CTA[segment];

  const scorecard = buildScorecard(result);
  const blurb = await scorecardBlurb({
    scorecard,
    survived: !!result.survived,
    score: result.score ?? 0,
  });

  // Store the lead (service role — leads are RLS-locked).
  const admin = createAdminClient();
  await admin.from("leads").insert({
    player_id: userId,
    name: body.name?.trim().slice(0, 80) || null,
    email: email.slice(0, 160),
    company: body.company?.trim().slice(0, 120) || null,
    audience_segment: segment,
    cta_target: cta.target,
    archetype: scorecard.archetype.name,
    score: result.score ?? 0,
    accuracy: scorecard.overallAccuracy,
    waves_cleared: result.wavesCleared ?? 0,
    survived: !!result.survived,
    scorecard: { ...scorecard, blurb },
  });

  // Send the scorecard email — best-effort; the lead is captured regardless.
  let emailed = false;
  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: "Cybercade <onboarding@resend.dev>",
        to: email,
        subject: `Your Human Risk Profile — ${scorecard.archetype.name}`,
        html: renderScorecardEmail({
          name: body.name?.trim() ?? "",
          scorecard,
          blurb,
          score: result.score ?? 0,
          ctaLabel: cta.label,
          ctaUrl: cta.url,
        }),
      });
      emailed = true;
    } catch {
      // delivery is best-effort (e.g. unverified domain in Resend test mode).
    }
  }

  return NextResponse.json({
    scorecard,
    blurb,
    emailed,
    cta: { label: cta.label, url: cta.url },
  });
}

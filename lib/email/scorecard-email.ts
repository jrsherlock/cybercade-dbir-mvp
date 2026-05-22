import type { Scorecard } from "../scorecard";

interface EmailInput {
  name: string;
  scorecard: Scorecard;
  blurb: string;
  score: number;
  ctaLabel: string;
  ctaUrl: string;
}

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Renders the Human Risk Profile scorecard as a standalone HTML email. */
export function renderScorecardEmail(input: EmailInput): string {
  const { name, scorecard, blurb, score, ctaLabel, ctaUrl } = input;

  const rows = scorecard.categories
    .map((c) => {
      const pct = Math.round(c.accuracy * 100);
      return `<tr>
        <td style="padding:7px 0;color:#c4c8d2;font-size:13px;">${esc(c.label)}</td>
        <td style="padding:7px 0;text-align:right;color:#3ee6c4;font-weight:bold;font-size:13px;white-space:nowrap;">${pct}% &middot; ${c.grade}</td>
      </tr>`;
    })
    .join("");

  const greeting = name ? `Nice work, ${esc(name)}.` : "Nice work.";

  return `<!DOCTYPE html>
<html lang="en">
<body style="margin:0;padding:0;background:#0a0b0f;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b0f;padding:32px 12px;">
    <tr><td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#14161d;border-radius:16px;">
        <tr><td style="padding:32px;">
          <p style="margin:0 0 6px;color:#5b8cff;font-size:11px;letter-spacing:3px;text-transform:uppercase;">Cybercade &middot; 2026-DBIR Edition</p>
          <h1 style="margin:0 0 14px;color:#f4f5f7;font-size:23px;">Your Human Risk Profile</h1>
          <p style="margin:0 0 16px;color:#9aa0ad;font-size:14px;">${greeting}</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0b0f;border:1px solid rgba(255,255,255,0.10);border-radius:12px;">
            <tr><td style="padding:18px 20px;">
              <p style="margin:0;color:#3ee6c4;font-size:20px;font-weight:bold;">${esc(scorecard.archetype.name)}</p>
              <p style="margin:5px 0 0;color:#9aa0ad;font-size:13px;">${esc(scorecard.archetype.tagline)}</p>
            </td></tr>
          </table>

          <p style="margin:18px 0;color:#c4c8d2;font-size:14px;line-height:1.65;">${esc(blurb)}</p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid rgba(255,255,255,0.08);margin-bottom:14px;">
            ${rows}
          </table>

          <p style="margin:0 0 22px;color:#9aa0ad;font-size:13px;">
            Final score: <strong style="color:#f4f5f7;">${score.toLocaleString()}</strong>
            &nbsp;&middot;&nbsp; Tier: <strong style="color:#f4f5f7;">${esc(scorecard.tier)}</strong>
          </p>

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center">
              <a href="${esc(ctaUrl)}" style="display:inline-block;background:#3ee6c4;color:#0a0b0f;font-weight:bold;font-size:15px;text-decoration:none;padding:14px 30px;border-radius:999px;">${esc(ctaLabel)}</a>
            </td></tr>
          </table>

          <p style="margin:26px 0 0;color:#6b7280;font-size:11px;text-align:center;line-height:1.6;">
            Cybercade is a ProCircular company. The 2026 Verizon DBIR found the
            human element in 62% of breaches.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

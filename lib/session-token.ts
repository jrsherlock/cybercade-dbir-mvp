import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed play-session tokens for the "Medium" anti-cheat tier. The server
 * issues a token when a game starts and verifies it (signature + age + payload
 * shape) when the score is submitted. Server-only — needs SESSION_SIGNING_SECRET.
 */
export interface SessionTokenPayload {
  /** game_sessions.id */
  sid: string;
  /** player id (Supabase Auth uid) */
  pid: string;
  /** issued-at, ms epoch */
  iat: number;
}

function secret(): string {
  const value = process.env.SESSION_SIGNING_SECRET;
  if (!value) throw new Error("SESSION_SIGNING_SECRET is not set");
  return value;
}

function hmac(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

/** Signs a token: base64url(payload) + "." + base64url(hmac). */
export function signSessionToken(payload: SessionTokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${hmac(body)}`;
}

/** Verifies a token's signature and shape; returns the payload or null. */
export function verifySessionToken(token: string): SessionTokenPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;

  const expected = hmac(body);
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as SessionTokenPayload;
    if (
      typeof payload.sid !== "string" ||
      typeof payload.pid !== "string" ||
      typeof payload.iat !== "number"
    ) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

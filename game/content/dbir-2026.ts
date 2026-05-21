import type { GameItemDef, LaneId, ResponseId, WaveDef } from "../types";

/**
 * DBIR 2026 content pack (M1 subset). Every threat, fact, and response maps to
 * the real Verizon 2026 DBIR. Authored as data so future editions swap the
 * pack, not the engine. M2 expands this to the full threat set.
 */

export const LANES: { id: LaneId; label: string }[] = [
  { id: "inbox", label: "INBOX" },
  { id: "logins", label: "LOGINS" },
  { id: "devices", label: "DEVICES" },
  { id: "webai", label: "WEB / AI" },
];

export const RESPONSES: { id: ResponseId; label: string; tint: number }[] = [
  { id: "verify", label: "Verify", tint: 0x5b8cff },
  { id: "report", label: "Report", tint: 0xffb454 },
  { id: "block", label: "Block", tint: 0xff5d5d },
  { id: "secure", label: "Secure", tint: 0x3ee6c4 },
];

export const ITEMS: Record<string, GameItemDef> = {
  "phishing-email": {
    id: "phishing-email",
    label: "Urgent invoice email",
    icon: "✉️",
    lane: "inbox",
    isThreat: true,
    correctResponse: "report",
    fact: "Phishing is still a top way in. When in doubt, report it.",
  },
  bec: {
    id: "bec",
    label: '"CEO" gift-card ask',
    icon: "💸",
    lane: "inbox",
    isThreat: true,
    correctResponse: "verify",
    fact: "Pretexting fakes a trusted person. Verify out-of-band.",
  },
  creds: {
    id: "creds",
    label: "Login attempt flood",
    icon: "🔑",
    lane: "logins",
    isThreat: true,
    correctResponse: "secure",
    fact: "Stolen credentials open the door. MFA shuts it.",
  },
  "malware-link": {
    id: "malware-link",
    label: "Sketchy attachment",
    icon: "🔗",
    lane: "webai",
    isThreat: true,
    correctResponse: "block",
    fact: "Malicious links and files deliver malware. Don't click — block it.",
  },
  "lost-laptop": {
    id: "lost-laptop",
    label: "Laptop left behind",
    icon: "💻",
    lane: "devices",
    isThreat: true,
    correctResponse: "secure",
    fact: "A lost device is a breach. Encryption and remote lock contain it.",
  },
  "shadow-ai": {
    id: "shadow-ai",
    label: "Secrets pasted to AI",
    icon: "🤖",
    lane: "webai",
    isThreat: true,
    correctResponse: "block",
    fact: "Shadow AI use tripled in 2026. Keep secrets out of unapproved tools.",
  },
  "legit-email": {
    id: "legit-email",
    label: "Note from a teammate",
    icon: "📩",
    lane: "inbox",
    isThreat: false,
    correctResponse: null,
    fact: "Looked fine — and it was. Don't overreact to normal mail.",
  },
  "legit-login": {
    id: "legit-login",
    label: "Normal sign-in",
    icon: "🔓",
    lane: "logins",
    isThreat: false,
    correctResponse: null,
    fact: "A routine login. Let it through.",
  },
  "legit-ai": {
    id: "legit-ai",
    label: "Approved AI assistant",
    icon: "✅",
    lane: "webai",
    isThreat: false,
    correctResponse: null,
    fact: "Sanctioned tools are fine — that's the point of approving them.",
  },
  "legit-device": {
    id: "legit-device",
    label: "Docked workstation",
    icon: "🖥️",
    lane: "devices",
    isThreat: false,
    correctResponse: null,
    fact: "Right where it should be. No action needed.",
  },
};

export const WAVE_1: WaveDef = {
  index: 1,
  spawns: [
    "phishing-email",
    "legit-login",
    "creds",
    "legit-email",
    "malware-link",
    "bec",
    "legit-ai",
    "lost-laptop",
    "shadow-ai",
    "legit-device",
    "creds",
    "phishing-email",
  ],
};

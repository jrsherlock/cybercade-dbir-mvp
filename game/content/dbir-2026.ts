import type { GameItemDef, LaneId, ResponseId, WaveDef } from "../types";

/**
 * DBIR 2026 content pack. Every threat, fact, and stat maps to Verizon's 2026
 * Data Breach Investigations Report. Authored as data so a future edition
 * swaps the pack, not the engine.
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

function def(d: GameItemDef): GameItemDef {
  return d;
}

export const ITEMS: Record<string, GameItemDef> = {
  // --- Threats ---
  "phishing-email": def({
    id: "phishing-email",
    label: "Urgent invoice email",
    icon: "✉️",
    lane: "inbox",
    isThreat: true,
    correctResponse: "report",
    fact: "Phishing is in 16% of breaches. Pressure plus a link? Report it.",
  }),
  bec: def({
    id: "bec",
    label: '"CEO" gift-card ask',
    icon: "🎭",
    lane: "inbox",
    isThreat: true,
    correctResponse: "verify",
    fact: "Pretexting fakes someone you trust. Verify on another channel.",
  }),
  smishing: def({
    id: "smishing",
    label: "Suspicious text msg",
    icon: "📱",
    lane: "inbox",
    isThreat: true,
    correctResponse: "report",
    fact: "Mobile phishing lands 40% more often than email. Report the text.",
  }),
  misdelivered: def({
    id: "misdelivered",
    label: "Email to wrong person",
    icon: "📤",
    lane: "inbox",
    isThreat: true,
    correctResponse: "verify",
    fact: "Misdelivery is a real breach pattern. Check the recipient first.",
  }),
  "vendor-invoice": def({
    id: "vendor-invoice",
    label: "Vendor: new bank info",
    icon: "🧾",
    lane: "inbox",
    isThreat: true,
    correctResponse: "verify",
    fact: "Third-party breaches hit 48%. New bank details? Verify by phone.",
  }),
  creds: def({
    id: "creds",
    label: "Login attempt flood",
    icon: "🔑",
    lane: "logins",
    isThreat: true,
    correctResponse: "secure",
    fact: "Credentials are abused in 39% of breach paths. MFA shuts the door.",
  }),
  "mfa-fatigue": def({
    id: "mfa-fatigue",
    label: "Repeated MFA prompts",
    icon: "🔔",
    lane: "logins",
    isThreat: true,
    correctResponse: "report",
    fact: "Endless MFA prompts mean someone has your password. Deny, report.",
  }),
  "lost-laptop": def({
    id: "lost-laptop",
    label: "Laptop left behind",
    icon: "💻",
    lane: "devices",
    isThreat: true,
    correctResponse: "secure",
    fact: "A lost device is a breach. Remote-lock and encryption contain it.",
  }),
  unpatched: def({
    id: "unpatched",
    label: "Unpatched server",
    icon: "🩹",
    lane: "devices",
    isThreat: true,
    correctResponse: "secure",
    fact: "Exploiting unpatched software is the #1 way in — 31%. Patch fast.",
  }),
  "shadow-ai": def({
    id: "shadow-ai",
    label: "Secrets pasted to AI",
    icon: "🤖",
    lane: "webai",
    isThreat: true,
    correctResponse: "block",
    fact: "Shadow AI use quadrupled. Keep company secrets out of random tools.",
  }),
  "malware-link": def({
    id: "malware-link",
    label: "Sketchy attachment",
    icon: "🔗",
    lane: "webai",
    isThreat: true,
    correctResponse: "block",
    fact: "Sketchy links and files deliver malware. Don't open it — block it.",
  }),
  "ransomware-lure": def({
    id: "ransomware-lure",
    label: "Ransomware lure",
    icon: "🔒",
    lane: "webai",
    isThreat: true,
    correctResponse: "block",
    fact: "Ransomware hit 48% of breaches. Most start with one click.",
  }),

  // --- Legit decoys (leave them alone) ---
  "legit-email": def({
    id: "legit-email",
    label: "Note from a teammate",
    icon: "📩",
    lane: "inbox",
    isThreat: false,
    correctResponse: null,
    fact: "Just a normal note. Don't overreact to good mail.",
  }),
  "legit-vendor": def({
    id: "legit-vendor",
    label: "Expected invoice",
    icon: "📃",
    lane: "inbox",
    isThreat: false,
    correctResponse: null,
    fact: "An expected invoice, same details as always. All good.",
  }),
  "legit-login": def({
    id: "legit-login",
    label: "Normal sign-in",
    icon: "🔓",
    lane: "logins",
    isThreat: false,
    correctResponse: null,
    fact: "A routine sign-in from a known device. Let it through.",
  }),
  "legit-device": def({
    id: "legit-device",
    label: "Docked workstation",
    icon: "🖥️",
    lane: "devices",
    isThreat: false,
    correctResponse: null,
    fact: "Your workstation, right where it belongs. Nothing to do.",
  }),
  "legit-update": def({
    id: "legit-update",
    label: "Approved update",
    icon: "⬆️",
    lane: "devices",
    isThreat: false,
    correctResponse: null,
    fact: "A signed, approved update. This one you actually want.",
  }),
  "legit-ai": def({
    id: "legit-ai",
    label: "Approved AI assistant",
    icon: "✅",
    lane: "webai",
    isThreat: false,
    correctResponse: null,
    fact: "The company-approved AI assistant. Sanctioned tools are fine.",
  }),
  "legit-share": def({
    id: "legit-share",
    label: "Team file share",
    icon: "📁",
    lane: "webai",
    isThreat: false,
    correctResponse: null,
    fact: "A file shared in the official team workspace. Fine.",
  }),
};

export const WAVES: WaveDef[] = [
  {
    index: 1,
    name: "First Contact",
    spawnInterval: 1850,
    fallSpeed: 80,
    spawns: [
      "phishing-email", "legit-login", "creds", "legit-email", "malware-link",
      "lost-laptop", "legit-device", "phishing-email", "creds", "legit-ai",
      "malware-link", "lost-laptop",
    ],
  },
  {
    index: 2,
    name: "Social Pressure",
    spawnInterval: 1600,
    fallSpeed: 96,
    spawns: [
      "bec", "legit-email", "smishing", "creds", "legit-vendor",
      "vendor-invoice", "mfa-fatigue", "phishing-email", "legit-login",
      "smishing", "bec", "legit-update", "vendor-invoice", "malware-link",
      "mfa-fatigue",
    ],
  },
  {
    index: 3,
    name: "Full Spectrum",
    spawnInterval: 1400,
    fallSpeed: 112,
    spawns: [
      "phishing-email", "unpatched", "legit-share", "creds", "smishing",
      "lost-laptop", "legit-email", "ransomware-lure", "mfa-fatigue",
      "vendor-invoice", "legit-login", "malware-link", "bec", "unpatched",
      "legit-device", "shadow-ai", "creds",
    ],
  },
  {
    index: 4,
    name: "Shadow AI Surge",
    isBoss: true,
    spawnInterval: 1150,
    fallSpeed: 132,
    spawns: [
      "shadow-ai", "ransomware-lure", "smishing", "shadow-ai", "malware-link",
      "creds", "shadow-ai", "legit-ai", "ransomware-lure", "mfa-fatigue",
      "shadow-ai", "unpatched", "legit-share", "ransomware-lure", "bec",
      "shadow-ai", "malware-link", "legit-login", "ransomware-lure",
      "shadow-ai",
    ],
  },
];

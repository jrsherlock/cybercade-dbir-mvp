/** Friendly random handles for anonymous players (M3). M4 lets players claim
 *  a real name; until then the leaderboard shows a generated handle. */

const ADJECTIVES = [
  "Swift", "Quiet", "Sharp", "Brave", "Cool", "Keen", "Bold", "Wary",
  "Lucky", "Sly", "Nimble", "Calm", "Fierce", "Steady", "Quick", "Clever",
];

const NOUNS = [
  "Falcon", "Cipher", "Sentinel", "Vector", "Phantom", "Warden", "Beacon",
  "Raptor", "Circuit", "Specter", "Comet", "Ranger", "Vault", "Signal",
  "Probe", "Relay",
];

function pick<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)];
}

export function randomHandle(): string {
  return `${pick(ADJECTIVES)} ${pick(NOUNS)}`;
}

// 13-char Crockford Base32 seed utility.
// Charset: 0-9, A-H, J, K, M, N, P-T, V-Z (no I, L, O, U).
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const SEED_LEN = 13;
const SEED_RE = /^[0-9A-HJKMNP-TV-Z]{13}$/;

export function isValidSeed(seed: string): boolean {
  return SEED_RE.test(seed);
}

export function randomSeed(): string {
  let out = '';
  for (let i = 0; i < SEED_LEN; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

export function sanitizeSeedChar(ch: string): string {
  const upper = ch.toUpperCase();
  return ALPHABET.includes(upper) ? upper : '';
}

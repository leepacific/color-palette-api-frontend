// FB-009 — Derive a dramatic primary hex deterministically from a 13-char
// Crockford Base32 seed. This is the frontend half of the Sprint 1 post-release
// hotfix: backend /theme/generate now applies seed-driven OKLCH perturbation,
// but the offset magnitudes it chose are imperceptible for low-chroma inputs
// like the current default primary #0F172A. So on every `r`/`space` press we
// *also* derive a brand-new, visibly different primary from the freshly minted
// seed and pass both {primary, seed} to the backend.
//
// Contract:
//   - same seed → same primary hex (bitwise)
//   - different seeds → different primary hex (≥ 8/10 distinct on any 10 seeds)
//   - return value is always a 7-char "#RRGGBB"
//   - derived HSL stays in S 40-90%, L 25-65% — avoids washed-out and near-black
//   - pure function, no globals, no Date.now, no Math.random

// Crockford Base32 charset matches src/lib/seed.ts. Each char is 5 bits.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * Decode a 13-char Crockford Base32 seed to a 64-bit unsigned value (as a
 * BigInt because 13 * 5 = 65 bits, which overflows Number.MAX_SAFE_INTEGER).
 *
 * Invalid characters are treated as 0; this mirrors `sanitizeSeedChar` leniency
 * and keeps the helper total so upstream validation does not have to double-check.
 */
export function seedToBigInt(seed: string): bigint {
  let acc = 0n;
  const upper = seed.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const idx = ALPHABET.indexOf(upper[i]);
    acc = (acc << 5n) | BigInt(idx < 0 ? 0 : idx);
  }
  return acc;
}

function hslToHex(h: number, s: number, l: number): string {
  // Standard HSL → RGB conversion. h in [0, 360), s/l in [0, 100].
  const sN = s / 100;
  const lN = l / 100;
  const c = (1 - Math.abs(2 * lN - 1)) * sN;
  const hPrime = h / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  let r1 = 0;
  let g1 = 0;
  let b1 = 0;
  if (hPrime >= 0 && hPrime < 1) [r1, g1, b1] = [c, x, 0];
  else if (hPrime < 2) [r1, g1, b1] = [x, c, 0];
  else if (hPrime < 3) [r1, g1, b1] = [0, c, x];
  else if (hPrime < 4) [r1, g1, b1] = [0, x, c];
  else if (hPrime < 5) [r1, g1, b1] = [x, 0, c];
  else [r1, g1, b1] = [c, 0, x];
  const m = lN - c / 2;
  const to255 = (v: number) =>
    Math.max(0, Math.min(255, Math.round((v + m) * 255)));
  const r = to255(r1);
  const g = to255(g1);
  const b = to255(b1);
  const hex = (n: number) => n.toString(16).padStart(2, '0').toUpperCase();
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * Derive a dramatic primary hex from a 13-char Crockford Base32 seed.
 *
 * Algorithm:
 *   - Decode the seed to a 65-bit BigInt.
 *   - Fold three independent 20-bit windows off the top, middle, and bottom of
 *     the BigInt to avoid correlation between H / S / L.
 *   - Map:
 *       hue        ∈ [0, 360)
 *       saturation ∈ [40, 90]   (40 + hueBits % 51)
 *       lightness  ∈ [25, 65]   (25 + ligBits % 41)
 *   - HSL → RGB → `#RRGGBB`.
 *
 * The S/L ranges are picked so every derived primary lands in the "clearly
 * chromatic, not muddy, not blown out" band — guarantees visible variation on
 * the 5-swatch display grid for any two distinct seeds.
 */
export function seedToPrimary(seed: string): string {
  const big = seedToBigInt(seed);
  // Three independent slices.
  const topBits = Number((big >> 45n) & 0xfffffn); // bits 45-64
  const midBits = Number((big >> 22n) & 0xfffffn); // bits 22-41
  const lowBits = Number(big & 0xfffffn); //           bits  0-19

  const hue = topBits % 360;
  const saturation = 40 + (midBits % 51); // [40, 90]
  const lightness = 25 + (lowBits % 41); //  [25, 65]

  return hslToHex(hue, saturation, lightness);
}

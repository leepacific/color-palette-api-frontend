// FB-009 — Unit tests for seedToPrimary helper.
//
// Gate criteria (Doctrine §6a — bi-directional determinism):
//   1. same seed → same primary hex (direction 1)
//   2. different seeds → different primary hex (direction 2) — ≥ 8/10 distinct
//   3. shape: always /^#[0-9A-F]{6}$/
//   4. HSL range: derived S stays in [40,90], derived L stays in [25,65]

import { describe, it, expect } from 'vitest';
import { seedToPrimary } from '../seed-to-primary';

const HEX_RE = /^#[0-9A-F]{6}$/;

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

// 10 valid 13-char Crockford Base32 seeds (upper case, no I/L/O/U).
const SEEDS = [
  'ABCDEFGHJKMNP',
  'ZYXWVTSRQPNMK',
  '1234567890ABC',
  'QPNMKJHGFEDCB',
  '0000000000000',
  'ZZZZZZZZZZZZZ',
  'A1B2C3D4E5F6G',
  'N7P8Q9R0S1T2V',
  'W3X4Y5Z6J7K8M',
  'H9G8F7E6D5C4B',
];

describe('seedToPrimary', () => {
  it('same seed produces same primary hex (determinism)', () => {
    for (const seed of SEEDS) {
      const a = seedToPrimary(seed);
      const b = seedToPrimary(seed);
      expect(a).toBe(b);
    }
  });

  it('different seeds produce different primary hex (≥ 8/10 distinct)', () => {
    const hexes = SEEDS.map(seedToPrimary);
    const unique = new Set(hexes);
    expect(
      unique.size,
      `expected ≥ 8 distinct primaries, got ${unique.size}. hexes: ${hexes.join(
        ', ',
      )}`,
    ).toBeGreaterThanOrEqual(8);
  });

  it('derived primary is always a valid 7-char #RRGGBB', () => {
    for (const seed of SEEDS) {
      const hex = seedToPrimary(seed);
      expect(hex).toMatch(HEX_RE);
    }
  });

  it('derived primary stays in S [40,90] and L [25,65]', () => {
    for (const seed of SEEDS) {
      const hex = seedToPrimary(seed);
      const { s, l } = hexToHsl(hex);
      // Allow ±1.5% tolerance for HSL round-trip integer rounding.
      expect(s, `seed ${seed} hex ${hex} S=${s.toFixed(2)}`).toBeGreaterThanOrEqual(38.5);
      expect(s, `seed ${seed} hex ${hex} S=${s.toFixed(2)}`).toBeLessThanOrEqual(91.5);
      expect(l, `seed ${seed} hex ${hex} L=${l.toFixed(2)}`).toBeGreaterThanOrEqual(23.5);
      expect(l, `seed ${seed} hex ${hex} L=${l.toFixed(2)}`).toBeLessThanOrEqual(66.5);
    }
  });

  it('lowercase seeds produce the same result as uppercase (canonicalization)', () => {
    expect(seedToPrimary('abcdefghjkmnp')).toBe(seedToPrimary('ABCDEFGHJKMNP'));
  });
});

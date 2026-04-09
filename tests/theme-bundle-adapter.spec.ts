// Loop 3 FR-4: adapter unit + Node-level live smoke.
//
// This spec is the authoritative evidence that the themeBundle → PaletteResource
// adapter correctly handles the live Railway response shape. It runs OUTSIDE
// the browser via Playwright's Node test runner so it bypasses the browser
// CORS preflight restriction on the Idempotency-Key header (see
// fix-report.md §Loop 3 Discoveries — separate backend CORS gap).
//
// What this proves:
//   1. Live /api/v1/theme/generate returns an object with object='themeBundle'
//      (backend conformance to docs/frontend-handoff.md).
//   2. The TypeScript ThemeBundleResource type matches the live shape.
//   3. The adapter flattens to a valid PaletteResource with 5 colors, each
//      having a hex/rgb/hsl/oklch — the exact shape the 11 Sprint 1 consumer
//      sites expect.
//   4. No TypeError on `.colors[i].hex` access after the adapter runs.

import { test, expect } from '@playwright/test';
import { themeBundleToPaletteResource } from '../src/lib/theme-bundle';
import type { ThemeBundleResource } from '../src/types/api';

const LIVE_BASE = 'https://color-palette-api-production-a68b.up.railway.app';
const KEY = 'cpa_live_frontenddev20260409aaaa1234';

test.describe('Loop 3 FR-4 — themeBundle adapter', () => {
  test('live /theme/generate returns themeBundle shape (backend conformance)', async () => {
    const res = await fetch(`${LIVE_BASE}/api/v1/theme/generate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': KEY,
      },
      body: JSON.stringify({
        primary: '#0F172A',
        mode: 'both',
        semanticTokens: true,
        seed: '94TMTHJ5QEQMW',
      }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as ThemeBundleResource;

    expect(body.object).toBe('themeBundle');
    expect(body.primaryInput?.hex).toBe('#0F172A');
    expect(body.primitive?.primary?.['500']?.hex).toMatch(/^#[0-9A-F]{6}$/i);
    expect(body.primitive?.secondary?.['500']?.hex).toMatch(/^#[0-9A-F]{6}$/i);
    expect(body.primitive?.accent?.['500']?.hex).toMatch(/^#[0-9A-F]{6}$/i);
    expect(body.primitive?.neutral?.['500']?.hex).toMatch(/^#[0-9A-F]{6}$/i);
    expect(body.seed).toBe('94TMTHJ5QEQMW');
  });

  test('adapter flattens live themeBundle to PaletteResource with 5 valid colors', async () => {
    const res = await fetch(`${LIVE_BASE}/api/v1/theme/generate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': KEY,
      },
      body: JSON.stringify({
        primary: '#7AE4C3',
        mode: 'both',
        semanticTokens: true,
        seed: '94TMTHJ5QEQMW',
      }),
    });
    expect(res.status).toBe(200);
    const bundle = (await res.json()) as ThemeBundleResource;

    const palette = themeBundleToPaletteResource(bundle);

    // Shape assertions — exactly what the 11 consumer sites expect.
    expect(palette.object).toBe('palette');
    expect(palette.colors).toHaveLength(5);
    palette.colors.forEach((c, i) => {
      expect(c.hex, `colors[${i}].hex should be a valid hex`).toMatch(
        /^#[0-9A-F]{6}$/i,
      );
      expect(c.rgb.r, `colors[${i}].rgb.r should be numeric`).toBeGreaterThanOrEqual(0);
      expect(c.hsl.h, `colors[${i}].hsl.h should exist`).toBeDefined();
      expect(c.oklch.l, `colors[${i}].oklch.l should exist`).toBeDefined();
    });

    // Seed must round-trip for Flow D byte-identity.
    expect(palette.seed).toBe('94TMTHJ5QEQMW');

    // First color should be the user's primary input (preserves export contract).
    expect(palette.colors[0].hex.toUpperCase()).toBe('#7AE4C3');

    // Simulate the 11 consumer access patterns — no TypeError allowed.
    expect(() => {
      const _primary = palette.colors[0].hex;
      const _hexes = palette.colors.map((c) => c.hex);
      const _second = palette.colors[1]?.hex;
      const _third = palette.colors[2]?.hex;
      const _fourth = palette.colors[3]?.hex;
      const _fifth = palette.colors[4]?.hex;
      void [_primary, _hexes, _second, _third, _fourth, _fifth];
    }).not.toThrow();
  });

  test('adapter is deterministic for fixed {primary, seed} (Flow D round-trip)', async () => {
    const req = {
      primary: '#0F172A',
      mode: 'both' as const,
      semanticTokens: true,
      seed: '94TMTHJ5QEQMW',
    };
    const headers = {
      'content-type': 'application/json',
      'x-api-key': KEY,
    };
    const body = JSON.stringify(req);

    const [r1, r2] = await Promise.all([
      fetch(`${LIVE_BASE}/api/v1/theme/generate`, { method: 'POST', headers, body }),
      fetch(`${LIVE_BASE}/api/v1/theme/generate`, { method: 'POST', headers, body }),
    ]);

    const b1 = (await r1.json()) as ThemeBundleResource;
    const b2 = (await r2.json()) as ThemeBundleResource;

    const p1 = themeBundleToPaletteResource(b1);
    const p2 = themeBundleToPaletteResource(b2);

    // Colors must be byte-identical across calls — this is the Flow D guarantee.
    expect(p1.colors.map((c) => c.hex)).toEqual(p2.colors.map((c) => c.hex));
    expect(p1.seed).toBe(p2.seed);
  });

  test('adapter handles stub themeBundle without crashing', async () => {
    // Minimal synthetic bundle to catch any future regression in the pick logic.
    const bundle: ThemeBundleResource = {
      object: 'themeBundle',
      id: 'tb_test',
      createdAt: '2026-04-09T00:00:00Z',
      mode: 'both',
      seed: 'ABCDEFGHJKMNP',
      primaryInput: {
        hex: '#0F172A',
        rgb: { r: 15, g: 23, b: 42 },
        hsl: { h: 222, s: 47, l: 11 },
        oklch: { l: 0.21, c: 0.04, h: 266 },
        name: 'Primary',
      },
      primitive: {
        primary: Object.fromEntries(
          (['50','100','200','300','400','500','600','700','800','900','950'] as const).map((k) => [
            k,
            { hex: '#111111', rgb: { r: 17, g: 17, b: 17 }, hsl: { h: 0, s: 0, l: 7 }, oklch: { l: 0.1, c: 0, h: 0 }, name: `p-${k}` },
          ]),
        ) as never,
        secondary: Object.fromEntries(
          (['50','100','200','300','400','500','600','700','800','900','950'] as const).map((k) => [
            k,
            { hex: '#222222', rgb: { r: 34, g: 34, b: 34 }, hsl: { h: 0, s: 0, l: 13 }, oklch: { l: 0.2, c: 0, h: 0 }, name: `s-${k}` },
          ]),
        ) as never,
        accent: Object.fromEntries(
          (['50','100','200','300','400','500','600','700','800','900','950'] as const).map((k) => [
            k,
            { hex: '#333333', rgb: { r: 51, g: 51, b: 51 }, hsl: { h: 0, s: 0, l: 20 }, oklch: { l: 0.3, c: 0, h: 0 }, name: `a-${k}` },
          ]),
        ) as never,
        neutral: Object.fromEntries(
          (['50','100','200','300','400','500','600','700','800','900','950'] as const).map((k) => [
            k,
            { hex: '#444444', rgb: { r: 68, g: 68, b: 68 }, hsl: { h: 0, s: 0, l: 27 }, oklch: { l: 0.4, c: 0, h: 0 }, name: `n-${k}` },
          ]),
        ) as never,
      },
      quality: { minScore: 80, perMetric: {} },
    };

    const palette = themeBundleToPaletteResource(bundle);
    expect(palette.colors).toHaveLength(5);
    expect(palette.colors[0].hex).toBe('#0F172A'); // primaryInput
    expect(palette.colors[1].hex).toBe('#222222'); // secondary.500
    expect(palette.colors[2].hex).toBe('#333333'); // accent.500
    expect(palette.colors[3].hex).toBe('#444444'); // neutral.500
    expect(palette.colors[4].hex).toBe('#111111'); // primary.700
    expect(palette.seed).toBe('ABCDEFGHJKMNP');
  });
});

# Performance Engineering Report — Sprint 1

**Lead**: performance-engineer (Mode A)
**Status**: complete — within Tier 2 target (<200KB initial gzipped)

## Build output

From `npm run build`:

| Asset | Raw | Gzipped |
|-------|-----|---------|
| `index.html` | 0.78 kB | 0.45 kB |
| `assets/index-*.css` | 43.07 kB | 19.45 kB |
| `assets/index-*.js` (main) | 208.09 kB | 65.09 kB |
| `assets/browser-*.js` (MSW, lazy) | 253.82 kB | 89.86 kB |
| Font woff2 (lazy, latin-only critical) | ~45 kB | — |

## Critical path (production)

Without MSW (live mode, `VITE_USE_MSW=false`):
- JS: 65.09 kB gzipped
- CSS: 19.45 kB gzipped
- HTML: 0.45 kB gzipped
- **Total initial gzipped: ~85 kB**

With MSW (Sprint 1 default, `VITE_USE_MSW=true`):
- Above + MSW browser bundle: 89.86 kB gzipped (lazy-loaded — imported only
  inside `enableMocking()` which is awaited before render)
- **Total initial gzipped: ~175 kB**

Both paths are under the Tier 2 target of 200 kB initial gzipped.

**Stack-decision.md** called out a target of ~131 kB. Works-CTO explanation
for the delta: the stack-decision estimate assumed Tailwind 4 CSS (~8 kB) but
we used Tailwind 3 (which ships slightly more utility CSS, reflected in the
43 kB raw CSS). Still within the Tier 2 constraint.

## Font strategy

Fonts are self-hosted via `@fontsource/jetbrains-mono` (400 + 500) +
`@fontsource/ibm-plex-sans` (400 + 500). The latin-only subset is the only
critical woff2 the browser needs; cyrillic, greek, vietnamese, latin-ext are
all separate woff2 files loaded on demand via `unicode-range`.

First-paint critical font: `jetbrains-mono-latin-400-normal` (21 kB woff2).

## Runtime characteristics (self-measured)

- `npm run dev` cold start: 421 ms (Vite 5.4.21)
- `npm run build`: 2.91 s
- MSW handler round-trip: ~150 ms (includes artificial `delay()` for UX realism)

## Deferred optimizations

- Route-level code splitting (`/help`, `/*` can be lazy) — not enabled Sprint 1
  because total bundle is already under budget.
- Preload hint on critical font — Sprint 2 polish.
- Service worker for offline replay of last N palettes — out of scope
  (Tier 3 stretch).

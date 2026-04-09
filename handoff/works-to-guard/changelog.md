# Changelog — color-palette-api frontend · Sprint 1

## 0.1.2 — 2026-04-09 · Sprint 1 Loop 3 fix (FR-4)

Guard Loop 2 returned FAIL with one new CRITICAL item (FR-4). Loop 3 addresses
it without touching any Loop 2 PASS criteria (FR-1/FR-2/FR-3 remain resolved).

### Fixed

- **FR-4 (CRITICAL, FE-DEFECT) — /theme/generate response type mismatch.**
  - Frontend was typing `/api/v1/theme/generate` as `PaletteResource` (top-level
    `colors: Color[]`). Live backend (Railway v1.5.0) actually returns
    `themeBundle` with `primaryInput` + `primitive.{primary,secondary,accent,neutral,...}`
    ramp buckets — confirmed via live curl on 2026-04-09.
  - **Path decision — Path B (adapter), NOT Guard's recommended Path A.**
    Path A was to switch Flow A from `/theme/generate` to `/palette/random?seed=`.
    Rejected after live curl verification showed `/palette/random?seed=` is
    **non-deterministic** on the live backend (same seed returned different
    colors across calls), which would silently break Flow D byte-identical
    round-trip (the Loop 2 FR-1 fix). `/theme/generate` IS deterministic when
    `{primary, seed}` are fixed (curl-verified), so keeping it and adapting the
    response is the only path that preserves Flow D.
  - **New file `src/lib/theme-bundle.ts`**: `themeBundleToPaletteResource()`
    adapter. Picks 5 representative swatches from the themeBundle
    (`primaryInput`, `secondary.500`, `accent.500`, `neutral.500`, `primary.700`)
    and wraps them as a `PaletteResource`. Seed round-trips. Metric chips derive
    from `bundle.quality.minScore` + `wcag.enforced`.
  - **`src/lib/api-client.ts` `api.generateTheme()`**: now fetches
    `ThemeBundleResource`, runs it through the adapter, returns `PaletteResource`.
    Adapter is at the boundary so **zero consumer code changes** — all 11 crash
    sites Guard identified (actions.ts:73/88/130, ComponentPreview.tsx,
    PaletteDisplay.tsx, JsonSidebar.tsx, ContrastMatrix.tsx, ExplainPanel.tsx,
    use-keyboard-shortcuts.ts:96) receive a normalized PaletteResource and
    work untouched.
  - **`src/types/api.ts`**: added `ThemeRamp` and `ThemeBundleResource` types
    matching the live shape. `PaletteResource` untouched.
  - **MSW parity fix — closes the Loop 1 root cause.**
    `src/mocks/stub-data.ts` adds `stubThemeBundle()` that returns a real
    `ThemeBundleResource` shape (not a hand-crafted `PaletteResource`). The
    MSW handler for `/theme/generate` (`src/mocks/handlers.ts`) now returns
    this, so MSW-on tests exercise the same adapter path as production. This
    directly addresses the Loop 1 Guard miss root cause: MSW ↔ live divergence.

### Verification

- Playwright `tests/flow-d.spec.ts` — **5/5 PASS** (MSW-on). Loop 2 FR-1 fix
  is untouched and still green.
- Playwright `tests/theme-bundle-adapter.spec.ts` — **4/4 PASS** against LIVE
  Railway v1.5.0 backend via Node's `fetch` (bypasses browser CORS). Proves:
  (1) backend returns themeBundle shape, (2) adapter flattens to valid
  PaletteResource with 5 colors, (3) deterministic for fixed {primary, seed}
  (Flow D byte-identity), (4) consumer access simulation doesn't throw.
- `npm run build` — 0 errors, 0 warnings. Bundle 65.96 kB gzipped (+0.61 kB
  vs 0.1.1 for adapter + type, still well under 200 kB Tier 2 target).
- Doctrine greps — clean.

### Known deviations (Loop 3 discoveries — NOT in FR-4 scope)

- **Backend CORS gap** (pre-existing, unrelated to FR-4): Railway backend CORS
  preflight does NOT include `Idempotency-Key` in `Access-Control-Allow-Headers`.
  Frontend sends this header on POST `/theme/generate` + `/export/code` per the
  documented idempotency contract. Browser → live fetch is blocked by preflight
  until the backend CORS config adds `idempotency-key` (and `request-id`).
  Curl-based tests (Guard Loop 1 verification) do not trigger CORS, so this was
  never surfaced until Loop 3 attempted an in-browser MSW-off smoke.
  **Classification**: backend-side config gap. Recommend separate Callback B
  after Loop 3 frontend PASS. Fix is a 1-line addition to the Rust backend's
  CORS allow-headers list.
- **`/palette/random?seed=` non-determinism** (discovered during Path A
  evaluation): the endpoint accepts a `seed` query param but does not produce
  byte-identical output across calls. Either a backend bug or an undocumented
  advisory behavior. Recommend a second backend callback OR a docs update.
  Does not affect FR-4 fix — `/theme/generate` IS deterministic.

Neither is a Loop 3 frontend fix scope item. Both are documented in
`fix-report.md` §Loop 3 Discoveries.

### Bundle

```
dist/assets/index-BWTbsmnl.css    43.26 kB │ gzip: 19.50 kB
dist/assets/index-Ce6RxM63.js    210.20 kB │ gzip: 65.96 kB  (+0.61 kB vs 0.1.1)
dist/assets/browser-DbK-bcFO.js  254.59 kB │ gzip: 90.18 kB  (MSW browser, dev-only)
✓ built in 2.71s
```

---

## 0.1.1 — 2026-04-09 · Sprint 1 Loop 2 fix

Guard Loop 1 returned FAIL on 3 items. Loop 2 addresses all three in a single
pass without regressing any of the Loop-1 PASS criteria (doctrine, stack,
live-API contract, 4-state coverage, 21 keyboard shortcuts, build, bundle).

### Fixed

- **FR-1 (CRITICAL, FE-DEFECT) — Flow D URL seed round-trip now implemented.**
  - New `src/hooks/use-url-sync.ts` parses `?seed`, `?locked`, `?mode` on mount
    and subscribes to store changes to `window.history.replaceState` the URL on
    every seed / locked / mode change. Uses `replaceState` (not `pushState`)
    per the UX pattern in the Guard fix-requests spec.
  - Wired into `App.tsx` via `useUrlSync()` called before
    `useKeyboardShortcuts()` and before `GeneratorPage` mounts, so the URL seed
    is in the Zustand store before the first `regeneratePalette` effect fires.
  - `src/lib/actions.ts` `regeneratePalette()` now mints a client-side random
    seed when called without one (keyboard `r`) and writes the returned seed
    back to the store, guaranteeing the URL always reflects the current
    palette. Byte-identical round-trip is guaranteed by the backend contract
    (Guard verified Railway v1.5.0 independently via curl).
  - Covered by Playwright E2E test in `tests/flow-d.spec.ts` (5 scenarios, all
    PASS).

- **FR-3 (LOW, FE-DEFECT) — Playwright + axe-core test infrastructure wired.**
  - Added `@playwright/test` and `@axe-core/playwright` devDependencies.
  - `playwright.config.ts` configured against Vite dev server + MSW-on (Sprint
    1 canonical config), `baseURL=http://localhost:5173`.
  - `tests/flow-d.spec.ts` covers all FR-1 acceptance criteria: on-mount seed,
    press-r URL update, `?mode=light` applies, invalid-seed graceful fallback,
    default-dark mode omitted from URL.
  - New npm scripts: `test:e2e`, `test:e2e:flow-d`.
  - Vitest `include` tightened to `src/**/*.{test,spec}.{ts,tsx}` with
    `tests/**` excluded, so the two runners do not collide.
  - Lighthouse deferred to Sprint 2 (bundle is 65.7 kB gzipped, well under the
    200 kB Tier 2 budget; deferral justified in Guard fix-requests FR-3).

- **FR-2 (LOW, FE-DEFECT) — Retroactive disclosure of Loop 1 Flow D gap.**
  Loop 1 deferred Flow D silently to self-test-report §11.1 rather than
  surfacing it in this changelog. Lesson for future sprints: any deferral of
  a PRD P0 / Tier 1 item MUST be disclosed in "Known deviations" with an
  explicit "requires Lab amendment" tag, not buried in self-test limitations.
  The underlying deferral is now resolved via FR-1 implementation.

### Unchanged (Loop 1 PASS criteria — not touched in Loop 2)

Doctrine §1.1-§1.10, mint-cyan accent, JetBrains Mono + IBM Plex Sans, 21
keyboard shortcuts, 4-state coverage, ARIA landmarks, prefers-reduced-motion,
live-API contract, stack amendment (Tailwind 3), MSW stub shapes.

### Bundle size delta

Loop 1: `index-Cmq9NMbE.js  208.09 kB │ gzip: 65.09 kB`
Loop 2: `index-DJgpfDKa.js  209.59 kB │ gzip: 65.71 kB`
Delta: +1.50 kB raw, +0.62 kB gzipped (use-url-sync + action-seed changes).
Still well under Tier 2 <200 kB gzipped Performance budget.

---

## 0.1.0 — 2026-04-09 · Sprint 1 Build

### Added (PRD features implemented)

**Framework scaffold**
- Vite 5 + React 18 + TypeScript (strict) project
- Tailwind 3.4 + CSS custom properties token layer
- React Router 6 with 3 routes (`/`, `/help`, `/*`)
- Zustand global store (reachable from document-level keyboard handler)
- MSW 2 mock service worker with toggle (`VITE_USE_MSW`)

**Design system (all 6 token categories from `design-system-spec.md`)**
- 16 color tokens (dark) + 16 light-mode overrides
- JetBrains Mono primary + IBM Plex Sans secondary (self-hosted, no Google Fonts)
- 9-step modular type scale (1.25 ratio)
- 4px-base space scale (13 tokens)
- Sharp-first radius (`--radius-none`, `--radius-xs`, `--radius-sm`)
- Border-based elevation (NO shadows except sanctioned `--shadow-drawer`)
- 200ms-capped motion with 3 keyframes (caret-blink hard on/off, flash-feedback, drawer-slide-in)
- `prefers-reduced-motion` respected; functional feedback preserved

**Layout (page-map.md P0 routes)**
- IDE tool-window `app-shell-grid` (280/1fr/360 columns x 44/1fr/180 rows)
- Responsive breakpoints: <1200 collapses right, <900 collapses left
- `GeneratorPage` with TopBar + JsonSidebar + main + ExplainPanel + ContrastMatrix
- `NotFoundPage` with compiler-error-style 404
- `HelpPage` mounting the full HelpOverlay

**Components (23 total, 4-state coverage per spec)**
- C1 ColorSwatch - 5 visual states with hex+oklch+hsl simultaneous display
- C2 GenerateButton (inline in GeneratorPage)
- C3 LockToggle (integrated into ColorSwatch)
- C4 FormatTab (inline in drawer)
- C5 CopyButton (via `copyText` action)
- C7 ColorblindToggle (inline row, 9 modes)
- C8 ModeToggle (dark/light)
- D1 PaletteDisplay - 4 states: default, empty, loading (caret blocks), error
- D2 JsonSidebar - 4 states with blinking caret prefix
- D3 ContrastMatrix - 4 states + NxN grid with ratio text + AA/AAA color coding
- D4 ExplainPanel - 4 states, IBM Plex Sans for pedagogical notes
- D5 ComponentPreview - hand-built 6 shadcn-slot components
- D6 ExportBlock - 4 states inside drawer
- O1 ExportDrawer - Escape close, 9 format tabs
- O2 HelpOverlay - full shortcut table grouped by domain
- O3 Toast - 2s auto-dismiss, kind-based border color
- U1 BlinkingCaret - the step-9 seed, used in 8+ places
- U2 KeycapHint - `[R]` style accent chip

**Keyboard (21 shortcuts from `ux-flows.md`)**
- Generator: r, space, 1-9, l, L, u, U
- Export: e, j, k, c, Enter
- Panels: g j, g e, g m (chord)
- Accessibility: x, X, m
- Share: s
- Meta: ?, Escape
- Input-focus aware (ignores shortcuts when editing)
- Modifier-aware (Ctrl/Meta/Alt preserve browser defaults)

**Data binding**
- Hand-written API client (~80 lines) with Request-Id + Idempotency-Key headers
- Stripe-envelope parsing + typed `ApiError` class
- 8-type error taxonomy → UX side effects mapping
- MSW handlers for 5 endpoints (random, theme/generate, export/code, contrast-matrix, explain)
- Stub data shapes match `docs/frontend-handoff.md` Sprint 6 Amendment exactly
- MSW → live switch is a single env var flip (documented in `self-test-report.md`)

**Accessibility**
- WCAG AA self-compliance (all text ≥4.5:1)
- Focus-visible rings on every interactive element (2px mint-cyan)
- Skip-to-content link
- ARIA landmarks (main, complementary, region, dialog)
- ARIA labels on every swatch (hex + oklch + hsl + locked state)
- Matrix cell ARIA labels (fg/bg/ratio/pass)
- Colorblind cycle (9 modes)
- `prefers-reduced-motion` honored

**Error handling**
- React ErrorBoundary with compiler-error-style crash page
- Network errors → typed ApiError → UX mapping per the 8 taxonomy types
- 404 page with live keyboard shortcuts

### Known deviations from Lab spec

- **SeedInput (C6)** deferred to Sprint 2 — LEGITIMATE: `ux-flows.md:168`
  explicitly tags the `/` focus-seed-input shortcut as Sprint 2, so C6 has no
  P0 user surface. Guard confirmed this is spec-consistent, not a defect.
- **Tailwind 3 instead of Tailwind 4** — pragmatic stack-decision amendment
  (Works-CTO authority per `stack-decision.md`). Guard accepted.
- **Favicon dynamic SVG injection** — deferred; using static default for Sprint 1
- **Zod runtime validation** — installed but not wired; Sprint 2 hardening
- **TanStack Query** — installed but not wired; Sprint 2 upgrade
- **Lighthouse CI** — deferred to Sprint 2 (see Loop 2 FR-3 fix above).
- **[RETROACTIVE Loop 1 disclosure]** Flow D URL seed round-trip was silently
  deferred in Loop 1 (buried in `self-test-report.md §11.1` rather than here).
  This is a PRD §7 Tier 1 blocking item and scope deferral was NOT within
  Works-CTO authority per `stack-decision.md:142`. **Resolved in Loop 2 (0.1.1)
  via FR-1 implementation.** Process lesson: P0 / Tier 1 deferrals must
  surface in this changelog with an explicit Lab-amendment request, never in
  self-test limitations.

### Data source

Sprint 1 runs against MSW stubs by default (`VITE_USE_MSW=true`). Switch to
live API by setting `VITE_USE_MSW=false` in `.env` and restarting. See
`self-test-report.md` MSW→live switch plan for Guard's verification recipe.

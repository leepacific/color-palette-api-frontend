# Changelog — color-palette-api frontend · Sprint 1

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

- **SeedInput (C6)** deferred to Sprint 2 (seed is read-only in TopBar for now)
- **Tailwind 3 instead of Tailwind 4** — pragmatic stack-decision amendment
  (Works-CTO authority per `stack-decision.md`)
- **Favicon dynamic SVG injection** — deferred; using static default for Sprint 1
- **Zod runtime validation** — installed but not wired; Sprint 2 hardening
- **TanStack Query** — installed but not wired; Sprint 2 upgrade

### Data source

Sprint 1 runs against MSW stubs by default (`VITE_USE_MSW=true`). Switch to
live API by setting `VITE_USE_MSW=false` in `.env` and restarting. See
`self-test-report.md` MSW→live switch plan for Guard's verification recipe.

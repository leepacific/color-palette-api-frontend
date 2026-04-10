# Frontend PRD — color-palette-api

**Sprint**: 2 (amendment to Sprint 1)
**Status**: ready for Works Phase
**Authored**: 2026-04-09 (Sprint 1), 2026-04-10 (Sprint 2 amendment)
**Amended by**: Frontend Lab CEO (Mode A, disclosed)
**design_philosophy_mode**: on
**trust_mode**: standard

---

## Sprint 2 Amendment — Harmony + Quality Controls

### S2.0 Origin

Board Chairman request: "프런트엔드에서 내가 직접 composite score 임계값 설정하거나 색상 팔레트 픽업 이론을 선택할 수 없어서 불편해."

Backend v1.6.0 (live on Railway) added two optional params to `POST /api/v1/theme/generate`: `harmonyHint` (string enum, 7 values) and `minQuality` (float 0-100) with `maxRetries` (int 1-10, default 5). Response gains `generationMeta` object when either is specified.

### S2.1 New UI Control 1 — Harmony Type Selector (P0)

**Component**: `<HarmonySelector>` (new, C9 in component-inventory)

**Widget**: segmented inline tag row — `[auto] [comp] [anal] [tri] [split] [tet] [mono]` — rendered in monospace with `--border-accent` on the active tag. NOT a dropdown (dropdowns read as form-builder). NOT tabs (tabs imply panel switching). Terminal-mode-switch aesthetic: each tag is a clickable `<button>` in a `<div role="radiogroup">`.

**Placement**: TopBar, right of seed display, left of mode toggle. Fits the "instrument panel" metaphor from design-language-report Step 1 (brass precision). The harmony selector IS a mode dial on the instrument.

**Abbreviated labels** (screen width constraint + terminal aesthetic):
| Value | Label | Title (tooltip) |
|-------|-------|-----------------|
| `auto` | `auto` | automatic harmony selection |
| `complementary` | `comp` | complementary (opposite hues) |
| `analogous` | `anal` | analogous (adjacent hues) |
| `triadic` | `tri` | triadic (120-degree spacing) |
| `split-complementary` | `split` | split-complementary |
| `tetradic` | `tet` | tetradic (rectangular) |
| `monochromatic` | `mono` | monochromatic (single hue) |

**Behavior**:
- Selecting a harmony type updates store `harmonyHint`
- Next `regeneratePalette()` call includes `harmonyHint` in the API request body
- Backend echoes `generationMeta.harmonyUsed` in response
- ExplainPanel already renders harmony type from the explain response; with `harmonyHint` specified, the backend constrains to that harmony, so the explain panel naturally reflects the user's choice
- Selection persists through regenerate cycles (store state, not ephemeral)
- Works with lock preservation (FB-011): locked colors stay locked regardless of harmony type
- Works with seed-derived primary (FB-009): seed drives primary, harmonyHint drives secondary derivation

**URL sync**: `?harmony=triadic` added to URL via `use-url-sync.ts`. Default `auto` is omitted from URL (clean short URLs).

**Keyboard**: `h` cycles harmony type forward through the 7 options. `H` (shift+h) cycles backward.

**Accessibility**:
- `role="radiogroup"` with `aria-label="harmony type"`
- Each tag: `role="radio"`, `aria-checked`, keyboard arrows navigate within group
- Focus-visible: 2px `--border-accent` outer ring per design-system-spec

### S2.2 New UI Control 2 — Quality Threshold Slider (P0)

**Component**: `<QualityThreshold>` (new, C10 in component-inventory)

**Widget**: numeric input with step buttons — NOT a browser-native range slider (those are un-styleable and break the brutalist identity). Terminal-style: `quality [  0] [+] [-]` where the number is an editable monospace input (3ch wide). The `+` and `-` buttons step by 10. Direct typing allows any integer 0-100.

**Placement**: TopBar, right of harmony selector, left of mode toggle. Groups with HarmonySelector as a "generation params" cluster.

**Behavior**:
- Value 0 (default) = no quality threshold (omit `minQuality` from request, backward-compatible)
- Value 1-100 = send `minQuality` in the API request body
- `maxRetries` is not exposed in UI (defaults to 5, as per backend default). Exposing it would add complexity without user value. If users need control, this is a Sprint 3 consideration.
- When `minQuality > 0`, show `generationMeta.qualityScore` and `generationMeta.attempts` in a subtle status line: `quality: 78.3 · attempts: 3` rendered in `--fg-tertiary` at `--text-xs` below the PaletteDisplay composite score or in the TopBar seed area
- Selection persists through regenerate cycles
- Works with lock preservation and seed-derived primary

**URL sync**: `?minQuality=50` added to URL. Default `0` is omitted.

**Keyboard**: `q` toggles quality panel focus (focuses the numeric input). When focused, `Up/Down` arrows step by 10. `Enter` confirms and defocuses.

**Accessibility**:
- Input: `aria-label="minimum quality threshold"`, `type="number"`, `min="0"`, `max="100"`, `step="10"`
- Step buttons: `aria-label="increase quality threshold"` / `"decrease quality threshold"`
- Status readout: `aria-live="polite"` for `qualityScore` + `attempts` display

### S2.3 Generation Meta Display

**Component**: `<GenerationMeta>` (new, D7 in component-inventory)

**Widget**: inline status line below PaletteDisplay composite score. Only visible when `generationMeta` is present in the last response.

**Content**: `harmony: ${harmonyUsed} · quality: ${qualityScore} · attempts: ${attempts}`

**Style**: `--font-mono`, `--text-xs`, `--fg-tertiary`. Fades to `--fg-secondary` on hover to indicate interactivity (click copies the full generationMeta JSON).

**Data states**:
- **Default**: visible when generationMeta exists
- **Empty**: hidden (no generationMeta = Sprint 1-compatible response)
- **Loading**: inherits PaletteDisplay loading state
- **Error**: inherits PaletteDisplay error state

### S2.4 Sprint 2 Success Criteria additions

#### Tier 1 (blocking — Guard PASS requires all, Sprint 2)
9. Harmony selector renders 7 options, default `auto`, persists through regenerate
10. Quality threshold input accepts 0-100, default 0, persists through regenerate
11. `?harmony=` and `?minQuality=` URL params round-trip correctly
12. Both new controls are keyboard-accessible (h/H for harmony, q for quality)
13. Both new interactive elements have 4 states (default/hover/active/focus-visible)
14. generationMeta display shows qualityScore + attempts + harmonyUsed when present

### S2.5 Updated keyboard shortcut contract

Add to the Sprint 1 map (§6 in this PRD):
| Key | Action |
|-----|--------|
| `h` | cycle harmony type forward |
| `H` | cycle harmony type backward |
| `q` | toggle quality threshold focus |

Total bindings: 21 (was 18).

### S2.6 Out of scope (Sprint 2)

- `maxRetries` UI control (backend default 5 is sufficient)
- Harmony type visualization (showing the color wheel with the harmony pattern)
- Quality history graph
- Quality auto-calibration

---

## 1. What we're building

A **developer/student-targeted color palette generator** that beats Coolors on code ergonomics, educational depth, and accessibility transparency by adopting a deliberate anti-designer-tool identity: brutalist + code-editor aesthetic, keyboard-first interaction, simultaneous hex/oklch/hsl display, and terminal/IDE visual language.

## 2. Target users (strict)

- **Primary**: junior/mid frontend developers using shadcn/ui + Tailwind + CSS variables
- **Secondary**: students learning design systems and color theory
- **Explicitly NOT**: full-time designers (they stay on Coolors)

Personas and JTBD defined in `context/lead-reports/lab/ux-research-report.md`.

## 3. Value proposition — 6 pillars (all backend-backed)

1. **28-slot semantic token system** via `POST /theme/generate` with `semanticTokens:true` → shadcn-compatible
2. **9-format code export** via `POST /export/code`: tailwind-config, css-vars-hex, css-vars-oklch, shadcn-globals, scss, mui-palette, swift-uicolor, android-xml, dtcg-json
3. **Live shadcn component preview** using generated semantic tokens (slot→component map in backend `docs/frontend-handoff.md`)
4. **WCAG contrast matrix + 8 colorblind simulations** via `POST /analyze/contrast-matrix` — visible by default, not behind a menu
5. **Explain mode** via `POST /analyze/explain` — harmony classifier + OKLCH narrative + 4 pedagogical notes, as a prominent learning surface (not a footer)
6. **Deterministic 13-char Crockford Base32 seed** for URL-shareable, git-diff-able palettes with byte-identical round-trip

## 4. Pages (P0 / P1 / P2)

| Priority | Page | Route | Components |
|----------|------|-------|------------|
| **P0** | Generator | `/` and `/?seed=XXX&locked=0,2&mode=dark` | PaletteDisplay, JsonSidebar, ContrastMatrix, ExplainPanel, ComponentPreview, TopBar |
| **P0** | Export drawer (overlay on Generator) | — (query param `?export=shadcn`) | ExportDrawer, ExportBlock, FormatTab |
| **P0** | Help overlay | — (`?` key) | HelpOverlay (static shortcut map) |
| **P0** | 404 | `/*` | NotFoundPage |
| P1 | Error boundary / crash page | — (runtime) | ErrorBoundary with compiler-error-style layout |
| P2 | `/help` static page (alt entry) | `/help` | shortcut reference |

**Why no marketing landing page**: doctrine §1.1 forbids centered hero; developer persona has zero patience for marketing; the tool IS the landing.

## 5. User flows (P0 — must work end-to-end)

- **Flow A** — generate → paste in ≤30 seconds (see `ux-flows.md` for state machine + timing budget)
- **Flow B** — accessibility visible by default (contrast matrix always docked bottom; colorblind cycle via `x` key)
- **Flow C** — learn from palette (explain panel prominent, Jun-student-first)
- **Flow D** — share exact palette (URL `?seed=` round-trip byte-identical)

All 4 flows are P0 Sprint 1.

## 6. Keyboard shortcut contract (P0)

18 bindings, all single-key or two-key `g+X` chords. No `Cmd/Ctrl` requirements. Inline-hinted via `<KeycapHint>` components. See `ux-flows.md` §Keyboard shortcut map.

Minimum set for success metric T1.2 (keyboard-complete):
- `r` / `space` — regenerate
- `l` — lock focused color
- `1-9` — focus color
- `e` — export drawer
- `c` / `Enter` — copy
- `j` / `k` — cycle format
- `x` — colorblind cycle
- `m` — mode toggle
- `s` — copy URL
- `g j`, `g e`, `g m` — panel toggles
- `?` — help overlay
- `Escape` — dismiss

## 7. Success criteria (Guard gates)

### Tier 1 (blocking — Guard PASS requires all)
1. All P0 pages implemented with 4 states for data components
2. Keyboard-complete (every feature reachable by keyboard)
3. WCAG AA self-compliance (all text ≥4.5:1, focus-visible on every interactive)
4. Anti-AI Doctrine clean: 0 hard-block violations, grep-clean on vocabulary blacklist
5. Flow A measurable ≤30s
6. URL seed round-trip byte-identical (blocked by U2 deployment; spec-ready)
7. Hex+oklch+hsl simultaneous (no toggling)
8. Contrast matrix + colorblind sim visible by default (blocked by U2)

### Tier 2 (target)
- Lighthouse Performance ≥ 90
- Lighthouse Accessibility = 100
- Q1-Q7 senior designer test pass
- Bundle < 200KB gzipped initial, < 500KB total
- TTI < 1.5s on Slow 4G

### Tier 3 (stretch)
- Command palette `Cmd+K`
- Offline replay of last 10 palettes from localStorage
- In-app requestId toast on errors

## 8. Non-functional requirements

- **Framework**: React 18 + Vite 5 + Tailwind 4 + selective shadcn/ui (see `stack-decision.md`)
- **Browsers**: latest 2 versions of Chromium, Firefox, Safari. No IE. No Safari <17 (OKLCH display-p3 requirement).
- **Responsive**: desktop-first. Mobile gracefully refuses with "open on desktop" message + read-only view.
- **Screen reader**: full ARIA on swatches and matrix cells; JSON sidebar `aria-hidden` (duplicative).
- **Reduced motion**: respects `prefers-reduced-motion` — caret blink disabled, 150ms transitions → 0ms, copy-flash preserved (functional feedback).
- **Privacy**: no cookies, no analytics, no tracking. localStorage only for history + dev API key.

## 9. Hard constraints (Doctrine + board)

- No centered "Title + Subtitle + CTA" hero
- No equal 3-col card grids (IDE dock layout auto-satisfies)
- No vocabulary blacklist terms in ANY copy
- No Lorem Ipsum / placeholder text
- No gray placeholder images
- No purple-blue gradient without documented hue shift → we use mint-cyan accent (explicit in `design-system-spec.md`)
- No Inter-alone → we use JetBrains Mono primary + IBM Plex Sans secondary
- ≥1 grid-breaking element per page (IDE tool-window layout is itself grid-breaking)
- All data components have 4 states (default/empty/loading/error)
- All interactive elements have 4 states (default/hover/active/focus-visible)
- Dark mode default; light mode user-toggle
- Monospace everywhere (JetBrains Mono / IBM Plex Mono)
- Keyboard-first
- Simultaneous hex/oklch/hsl display

## 10. Out of scope (Sprint 1)

- Firebase auth + user accounts UI
- Pro tier payment
- Mobile-native app
- Palette history database (localStorage only)
- Admin panel
- i18n (English only)
- Real-time collaboration
- SSR / SEO (client-rendered SPA; no SEO value)

## 11. Known risks and blocking unknowns

### U1. API key auth failure (CRITICAL BLOCKING)
- Current `.env` admin key rejected by production with `INVALID_API_KEY`
- Mitigation: Works uses local `cargo run` backend or MSW stubs during build; informal query to Agentic Orchestrator (`handoff/queries/U1-api-key-auth-failure.md`)
- Resolution required before Guard verification

### U2. Sprint 6 endpoints not deployed (CRITICAL BLOCKING for Guard)
- Production serves v1.4.0 with 27 paths; Sprint 6 `/export/code`, `/analyze/contrast-matrix`, `/analyze/explain`, `semanticTokens`/`seed` extensions absent
- Mitigation: Lab specs against v1.5.0 contract per documented backend handoff; Works can build; Guard verification blocked until deployment
- Callback A package drafted in `endpoint-gap-report.md`

## 12. Copy examples (sample — no blacklist words)

- Generator button: `regenerate [R]`
- Export button: `export code [E]`
- Empty state for palette: `no palette · press [R] to generate`
- Empty state for export: `no format selected · press [E] to choose`
- Error: `error: api_error (INTERNAL) · requestId req_01K... · [r] retry · [c] copy id`
- 404: `404 · path not resolved · expected: valid route · received: ${path} · > [r] return to generator · > [h] open help`
- Help overlay header: `keyboard shortcuts`

All blacklist terms from Doctrine §1.5 are avoided (see `design-anti-cliche-doctrine.md` for the full list). Every button names a concrete action (`regenerate`, `copy`, `lock`, `export`).

## 13. Epistemic humility / escalation

If Works encounters:
- API shape mismatch vs. contract → escalate via `handoff/queries/` informal query
- Contract insufficient for a spec requirement → Callback A to Agentic
- Token system can't be reconciled with design-system-spec → escalate to Lab CEO for re-spec

## 14. Authority

- Board Chairman: design direction (brutalist/IDE, already committed)
- Frontend Lab CEO: spec authority
- Frontend Works CTO: implementation authority (spec is constraint, not instruction)
- Frontend Guard QA Director: verification authority (PASS/FAIL)
- Agentic Orchestrator: backend coordination + callback routing

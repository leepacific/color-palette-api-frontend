# Frontend Guard QA Director — FINAL PASS Report (Sprint 1, Loop 5)

**Author**: Frontend Guard QA Director (Frontend-Builder)
**Date**: 2026-04-09
**Loop**: 5 — final re-verification (post-Works `184d840`)
**fixLoopCount**: 5/7
**Verdict**: **FULL PASS**
**Outstanding callbacks**: NONE
**Deferred blockers**: NONE
**Release approval gate**: OPEN

---

## Executive summary

Sprint 1 of `color-palette-api` frontend ships. After five Guard loops, all
fix-request items (FR-1 through FR-11) are resolved and independently verified.
The most consequential Loop 5 result: **axe-core scan went from 60 serious
violations (Loop 4 baseline) to 0 serious / 0 critical (Loop 5)** across both
Tier 1 routes (`/` and `/help`), and a permanent `tests/a11y.spec.ts` gate is
committed to prevent silent regression.

The five-loop journey is now also captured as a Tier 1 Guard knowledge pattern
(`04-guard/knowledge/patterns/verification-layer-cascade.md`) so future
Frontend-Builder sprints run all five verification layers in Loop 1.

---

## 5-loop summary

| Loop | Defect surfaced | Fix | Outcome |
|------|-----------------|-----|---------|
| 1 | (initial code review) — passed doctrine + curl backend; Flow D unimplemented; MSW handlers diverged from live shape; static a11y self-audit lied | — | FAIL (FR-1, FR-2, FR-3) |
| 2 | Flow D URL round-trip missing | `use-url-sync.ts` + `tests/flow-d.spec.ts` 5/5 | FAIL on FR-4 (next layer surfaced) |
| 3 | `/theme/generate` returns `themeBundle`, frontend typed it as `PaletteResource` (MSW divergence) | `theme-bundle.ts` adapter at API boundary; MSW stub fixed; `tests/theme-bundle-adapter.spec.ts` 4/4 | CONDITIONAL PASS pending CB-002 CORS fix |
| 4 | Backend CORS missing `idempotency-key` (CB-002, fixed Agentic-side); FR-6 phantom test selector (test never executed pre-CORS); FR-7..11 axe-core surfaced 60 serious WCAG violations | Test selector retargeted; first axe-core scan run | FAIL on FR-7..11 a11y cluster |
| 5 | a11y cluster (nested-interactive, color-contrast, aria-prohibited-attr, scrollable-region-focusable, heading-order) | ColorSwatch Approach B; `--fg-tertiary` slate-400; `role="img"` chips; `tabIndex={0}` scroll wrapper; h3→h2; `inert+aria-hidden` on shadcn slot preview; `tests/a11y.spec.ts` permanent gate | **FULL PASS** |

5/7 loops used. 2 loops of headroom unused.

---

## Loop 5 independent verification evidence

### Phase 0 — Build
```
$ npm run build
dist/assets/index-DDe7yx7D.css   43.35 kB │ gzip: 19.52 kB
dist/assets/index-DgGhzhDg.js   207.90 kB │ gzip: 64.74 kB
✓ built in 2.33s
```
0 TypeScript errors, 0 warnings. Bundle delta vs Loop 4 (`209.59 kB / 65.71 kB`):
**-1.69 kB raw / -0.97 kB gzipped** (Loop 5 is actually slightly *smaller* than
Loop 4 because the FR-7 ColorSwatch refactor removed `e.stopPropagation()` and
the duplicate-keycap absolute positioning code; the `--fg-tertiary` change was
a 6-character token edit). Well under Tier 2 200 kB Performance budget.

### Phase 1 — MSW-on Playwright suites (independently re-run)
```
$ npx playwright test tests/flow-d.spec.ts tests/theme-bundle-adapter.spec.ts tests/a11y.spec.ts

  ok  1 [chromium] › a11y.spec.ts:8 home route has no serious/critical a11y violations (1.9s)
  ok  2 [chromium] › flow-d.spec.ts:16 ?seed=XXX on mount populates store before first regenerate
  ok  3 [chromium] › flow-d.spec.ts:29 pressing r updates URL with a new valid 13-char Base32 seed
  ok  4 [chromium] › flow-d.spec.ts:55 ?mode=light on mount applies light mode
  ok  5 [chromium] › flow-d.spec.ts:69 invalid seed in URL falls back gracefully
  ok  6 [chromium] › flow-d.spec.ts:86 mode default (dark) is omitted from URL
  ok  7 [chromium] › theme-bundle-adapter.spec.ts:26 live /theme/generate returns themeBundle (backend conformance)
  ok  8 [chromium] › theme-bundle-adapter.spec.ts:52 adapter flattens live themeBundle to PaletteResource
  ok  9 [chromium] › theme-bundle-adapter.spec.ts:101 adapter is deterministic for fixed {primary, seed}
  ok 10 [chromium] › theme-bundle-adapter.spec.ts:130 adapter handles stub themeBundle without crashing

  10 passed (8.9s)
```
**10/10 PASS**, all four Loop 1-4 user flow gates green simultaneously.

### Phase 1 — Live browser smoke (MSW OFF, real Railway, real CORS)
```
$ npx playwright test tests/flow-a-live.spec.ts --config playwright.live.config.ts

API requests seen:
  POST /api/v1/theme/generate         (mount)
  POST /api/v1/theme/generate         (FR-1 URL-sync regenerate)
  POST /api/v1/analyze/contrast-matrix
  POST /api/v1/analyze/explain
  POST /api/v1/analyze/contrast-matrix
  POST /api/v1/analyze/explain
theme response body keys: [object, id, createdAt, mode, primaryInput, primitive,
  semantic, quality, wcag, warnings, framework, generatedAt, extendedSemantic,
  seed, slotSource]
themeBundle object field: themeBundle
has primitive: true

  ok 1 [chromium-live] page loads + regenerates + no fatal console errors
  ok 2 [chromium-live] network smoke — real /theme/generate returns themeBundle and adapter works (8.4s)

  2 passed (12.8s)
```
**2/2 PASS** against deployed Railway backend. The full chain
api-client → theme-bundle adapter → store → PaletteDisplay → ColorSwatch
works end-to-end with the live response shape, the post-CB-002 CORS allow-list,
and the Loop 5 ColorSwatch Approach B refactor. No `TypeError`, no
`Cannot read properties of undefined`, the swatch selector
`button[aria-label*="of 5: hex" i]` returns exactly 5 elements.

### Phase 2 — Independent axe-core scan (the gate of this loop)

Loop 5 ships its own `tests/a11y.spec.ts` against `/`. Guard ran an additional
independent axe-core scan against `/help` (tests/a11y-help.spec.ts, scratch,
not committed) at the same `wcag2a + wcag2aa` tag set.

**Results**:
| Route | Serious | Critical | Moderate | Total |
|-------|---------|----------|----------|-------|
| `/` (home, after first regenerate) | 0 | 0 | 0 | 0 |
| `/help` | 0 | 0 | 0 | 0 |

Loop 4 baseline was 60 serious WCAG violations. Loop 5 is **0 across both Tier
1 routes**. The gate is locked.

Two follow-up violations Works fixed beyond the original FR-7..11 scope are
**legitimately within FR-8/FR-10 root-cause**, not scope creep:
1. `aria-hidden-focus` on `<aside aria-hidden="true">` JsonSidebar — direct
   consequence of FR-10 (the aside contains focusable buttons).
2. Additional `color-contrast` violations in JsonSidebar (hex text painted with
   palette color on dark bg) and ComponentPreview (palette colors on hardcoded
   white) — both share the FR-8 root cause (dynamic palette colors used as
   foreground without contrast guarantee). Works correctly bundled them rather
   than leaving them for Loop 6.

### Phase 3 — Doctrine regression
- **Vocabulary blacklist** (`Seamless|Empower|Revolutionize|혁신적인|새로운 차원의|Unlock the power|Transform your|Effortlessly`): **0 matches**
- **Purple/indigo gradient** (`from-purple|to-blue|from-indigo|gradient-to.*purple`): **0 matches**
- **Bounce easing** (`bounce`): only 1 false-positive — `/* Motion — ≤200ms hard cap, no bounce */` comment in `tokens.css:102`
- **Brutalist tone preservation**: `--fg-tertiary` change (`#6b7280 → #94a3b8` slate-400) verified against `tokens.css` whole-file read. Color palette is still cool-neutral throughout (background ramps `#0b0c10`/`#14161b`/`#1b1e25`, fg `#e8eaed`/`#a8adb8`/`#94a3b8`, accent untouched at mint-cyan `#7AE4C3`). Slate-400 sits in the same neutral-cool tonal family — no warm or saturated drift. The IDE / code-editor aesthetic holds.
- **21 keyboard shortcuts** (`use-keyboard-shortcuts.ts`): last touched in Loop 2 commit `b41dfcd`, **untouched in Loop 5**. Confirmed via git log.
- **`use-url-sync.ts`** (FR-1): last touched in Loop 2, **untouched in Loop 5**. Flow D guarantee preserved.
- **`api-client.ts` + `actions.ts` + `theme-bundle.ts`** (FR-4): last touched in Loop 3, **untouched in Loop 5**. Adapter still feeds 11 consumer sites.

### Phase 4 — Source review of all 6 changed files

| File | FR | Inspection notes |
|------|----|------------------|
| `ColorSwatch.tsx` | FR-7 | Outer `<div>` is plain (no role). Inner select `<button>` carries the full `aria-label="color N of 5: hex ..., oklch ..., hsl ..."` (preserves the live smoke selector). Lock `<button>` is a sibling in metadata area. Three copy `<span>`s no longer need stopPropagation (no parent button to bubble). Approach B is correct — does not violate axe `no-focusable-content` and does not violate `nested-interactive`. |
| `tokens.css` | FR-8 | `--fg-tertiary: #94a3b8` (~6.5:1 on `#14161b`). Cool-neutral, doctrine-safe. |
| `ContrastMatrix.tsx` | FR-9 | Both color-chip `<div>`s now have `role="img"` so `aria-label={hex}` is permitted. Two locations: `<thead><tr>` column header and `<tbody><tr>` row header. |
| `GeneratorPage.tsx` | FR-10 | `.area-left` wrapper has `tabIndex={0}`. No aria-label added (would re-trigger FR-9). Skip-to-content link, `<main id="main" role="main">` landmarks intact. |
| `ComponentPreview.tsx` | FR-11, FR-8 follow-up | Two `<h3>`→`<h2>` (matches sibling `<h2>contrast · colorblind</h2>`). Demo block has `inert=""` + `aria-hidden="true"` — pure visual preview, excluded from AT and keyboard focus. The accessible `<h2>preview (shadcn slots)</h2>` heading sits *outside* the inert block, so screen readers still announce the section. |
| `JsonSidebar.tsx` | FR-8 follow-up, FR-10 | `<aside aria-hidden="true">` → `<aside aria-label="palette JSON preview">` (4 places). Hex text is now `<span class="text-fg-primary">` with a preceding 8×8 chip `<span role="img" aria-label="color N swatch">`. JSON preview is now a meaningful, accessible region. |
| `tests/a11y.spec.ts` | NEW gate | `@axe-core/playwright`, `wcag2a + wcag2aa` tags, asserts zero serious/critical. Pinned for all future loops. |

### Phase 5 — Q1-Q7 senior designer test (final)

| | Question | Loop 1 (Conditional) | Loop 4 (Failed) | Loop 5 (Final) |
|---|---|---|---|---|
| Q1 | Does it look AI-generated? | No (brutalist, terminal aesthetic) | No | **No** |
| Q2 | Differentiated from 50 generic SaaS? | Yes (IDE/code-editor metaphor) | Yes | **Yes** |
| Q3 | Every choice intentional? | Yes (sharp corners, mint-cyan, hard caret blink) | Yes | **Yes** |
| Q4 | ≥3 micro-interactions? | Yes (caret blink, copy-flash, focus ring, drawer slide) | Yes | **Yes** |
| Q5 | Identity holds across pages? | Yes (gen, help, 404 all consistent) | Yes | **Yes** |
| Q6 | Looks like someone with taste made it? | Yes | Yes | **Yes** |
| Q7 | Would a respected designer be proud? | Conditional on Flow D (broken URL share) | Conditional on a11y (60 serious WCAG violations) | **Unconditional YES** |

The two prior conditionals — Flow D shareability (Loop 1) and a11y compliance
(Loop 4) — are both resolved. Q7 is now an unconditional yes.

### Self-test §8 retraction verification

Read `self-test-report.md:357-374`. The Loop 5 correction is **explicit and
unambiguous**:

> **[CORRECTION — Loop 5, 2026-04-09]**: This Loop 1 framing was misleading.
> The static/spec-based self-audit implied WCAG AA compliance, but Guard Loop 4
> ran axe-core for the first time and surfaced four serious WCAG violations
> (nested-interactive, color-contrast 44 nodes on `--fg-tertiary`,
> aria-prohibited-attr 10 nodes on ContrastMatrix color chips,
> scrollable-region-focusable on `.area-left`) plus one moderate (heading-order).
> These were pre-existing from Loop 1, not Loop 4 regressions. The Loop 2
> decision to "defer axe-core wiring to Sprint 2" (§12.2 FR-3) was the Loop 1
> miss — it let the false implication stand. Loop 5 resolves all five findings,
> adds `tests/a11y.spec.ts` as a permanent axe-core gate asserting zero
> serious/critical violations, and this correction is logged explicitly so the
> lie is not preserved.

Acceptable. The false claim is named, the loop where it should have been caught
is named, the corrective action is named, and the permanent gate is named.

---

## Sprint-level risk assessment

| Risk | Severity | Status |
|------|----------|--------|
| Backend contract drift between MSW and live | High | **Mitigated** — Loop 3 adapter pattern + `theme-bundle-adapter.spec.ts` runs against live Railway. Future contract drift will fail this test in Loop 1. |
| WCAG regression | High | **Mitigated** — `tests/a11y.spec.ts` permanent gate. Any future change that introduces serious/critical violations will fail CI. |
| URL-share Flow D breaking | Medium | **Mitigated** — `tests/flow-d.spec.ts` 5 scenarios, all green. |
| CORS / new headers added by frontend without backend coordination | Medium | **Open but documented** — Sprint 1 CORS gap (CB-002) is fixed; future header additions require backend coordination. Tracked in callback registry. |
| Bundle size growing past 200 kB Tier 2 budget | Low | **Mitigated** — currently 64.74 kB gzipped, 32% of budget. |
| `inert` attribute browser support | Low | **Acceptable** — modern browsers (Chrome 102+, Safari 15.5+, Firefox 112+) all support it. The inert ComponentPreview block is a decorative slot showing dynamic palette colors; degraded behavior on old browsers = the block becomes focusable but is still aria-hidden, no functional regression. |

No critical risks open. No deferred blockers. No outstanding callbacks. CB-003
(`/palette/random?seed=` non-determinism) was Loop 3-discovered, deferred to
Sprint 2 by mutual agreement, and is **not** in scope for this release because
no Sprint 1 user flow consumes it (Path B adapter sidesteps it entirely).

---

## Lab-promised features (PRD §7 Tier 1) — final status

| Feature | Status |
|---------|--------|
| Flow A: generate palette | PASS (live + MSW) |
| Flow B: explain palette | PASS (verified via live API request log) |
| Flow C: contrast matrix | PASS (verified via live API request log) |
| Flow D: URL seed round-trip | PASS (5 scenarios) |
| 21 keyboard shortcuts | PASS (unchanged from Loop 1) |
| 4-state component coverage | PASS (unchanged) |
| Dark/light theme | PASS (Loop 2 verified) |
| 9-mode colorblind sim | PASS (Loop 1 verified) |
| WCAG AA compliance | **PASS** (Loop 5 axe-verified, 0 serious/critical) |

---

## Verdict

**FULL PASS — Sprint 1 ready for release approval gate.**

- No outstanding callbacks
- No deferred blockers
- All FRs (1-11) resolved
- Both Tier 1 routes axe-clean
- Live browser smoke green against deployed Railway
- All 12 tests across 4 suites green (10 MSW-on + 2 live)
- Doctrine preserved
- Q7 unconditional yes
- Permanent a11y gate committed
- Self-test §8 false claim retracted

`fixLoopCount` final = **5/7**. 2 loops of headroom unused.

Frontend-Builder Step 8 release approval gate is **OPEN**. Recommend human approval and proceed to Step 9 (sprint retrospective) — knowledge file already pre-written for retrospective harvest.

---

## Files of record (Loop 5)

- Source changes (6): `src/components/ColorSwatch.tsx`, `src/styles/tokens.css`, `src/components/ContrastMatrix.tsx`, `src/pages/GeneratorPage.tsx`, `src/components/ComponentPreview.tsx`, `src/components/JsonSidebar.tsx`
- Test added (1): `tests/a11y.spec.ts`
- Handoff updates (4): `handoff/works-to-guard/{fix-report,changelog,self-test-report}.md`, `handoff/works-to-guard/status.json`
- Knowledge written (1): `04-guard/knowledge/patterns/verification-layer-cascade.md` (Frontend-Builder)
- This pass report: `handoff/pass-report.md`

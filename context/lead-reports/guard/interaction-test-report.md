# interaction-test-report — Color Palette API Frontend Sprint 1

> **Mode A**: Inline pass by Guard QA Director. Source: `MODE-DISCLOSURE.md` + `handoff/guard-to-works/fix-requests.md`.

## Role

Interaction Tester — 21 keyboard shortcuts verification, 4 UX flows (A/B/C/D), interactive 4-state coverage, copy-feedback micro-interactions.

## Summary / Findings

**Verdict: FAIL (1 CRITICAL)** — 3 of 4 flows PASS, Flow D missing.

### PASS items
- **21 keyboard shortcuts**: all 18 single-key + 3 g-chord bindings traced through `src/hooks/use-keyboard-shortcuts.ts`. Input-focus guards present, modifier passthrough correct.
- **Flow A** (Generate → export): action pipeline `r/space → regenerate → e → export drawer → format select → copy` wired end-to-end via `src/lib/actions.ts` + `store.ts`. MSW stubs + live API both validated.
- **Flow B** (Accessibility): contrast matrix + colorblind toggles always-visible in right panel by default, not behind a menu.
- **Flow C** (Learn): explain panel prominent in bottom-right region.
- **Interactive 4-state** (9/9 components): default/hover/active/focus-visible traceable. 2px mint focus-visible rings.
- **Copy-button flash**: 120ms feedback, `prefers-reduced-motion` safe.

### FAIL item
- **Flow D (URL seed round-trip) — CRITICAL, FR-1**: unimplemented. Grep `pushState|replaceState|searchParams|window.history` in `src/` → 0 matches. `copyCurrentUrl()` copies `window.location.href` verbatim; app never writes seed to URL. Users pressing `s` share a URL that loads a different random palette. Byte-identical round-trip structurally impossible. Deferral disclosed only in `self-test-report.md §11.1`, NOT in `changelog.md §Known deviations`, NO Lab amendment. See `fix-requests.md` FR-1.

## Defects

| ID | Label | Severity | Where | Evidence |
|----|-------|----------|-------|----------|
| FR-1 | FE-DEFECT | CRITICAL | `src/App.tsx`, `src/state/store.ts`, `src/lib/actions.ts` | grep returns 0 matches for URL state APIs |
| FR-2 | FE-DEFECT | LOW | `handoff/works-to-guard/changelog.md` | Flow D deferral not disclosed in changelog |

## Execution Evidence

```
grep -rn 'pushState\|replaceState\|searchParams\|window.history' src/
→ (no output)

grep -n 'copyCurrentUrl' src/lib/actions.ts
→ copies window.location.href verbatim, no seed append

grep -n 'handleShortcut' src/hooks/use-keyboard-shortcuts.ts
→ 21 bindings confirmed: r, space, j, k, l, e, s, ?, /, g-chords, Escape, arrows
```

## Self-Eval

- [x] All 21 shortcuts code-traced
- [x] Flow A/B/C walked through source + live curl
- [x] Flow D grep-audited → hard FAIL
- [x] Copy-feedback reduced-motion safe
- [x] Focus-visible ring uniform

---

## Loop 2 Update (2026-04-09)

**Verdict (Loop 2): PASS for FR-1 interaction plumbing; FAIL at sprint level due to FR-4 (see contract-validation)**

### Independent Playwright re-run

```
$ npx playwright test tests/flow-d.spec.ts
Running 5 tests using 1 worker

  ok 1 [chromium] › ?seed=XXX on mount populates store before first regenerate (590ms)
  ok 2 [chromium] › pressing r updates URL with a new valid 13-char Base32 seed (823ms)
  ok 3 [chromium] › ?mode=light on mount applies light mode (441ms)
  ok 4 [chromium] › invalid seed in URL falls back gracefully (413ms)
  ok 5 [chromium] › mode default (dark) is omitted from URL (791ms)

  5 passed (6.5s)
```

Matches Works' reported numbers. Independently re-verified.

### Code review findings on `use-url-sync.ts`

- `useRef` gate prevents React 18 StrictMode double-apply (line 115-122).
- URL parse synchronously fires during first render (BEFORE useEffect), correctly ordered before `GeneratorPage` first-regenerate effect.
- `replaceState` used throughout (line 142), not `pushState`. No back-button pollution.
- Invalid seed → `isValidSeed()` filter (line 85). Invalid locked indices → bounds filter (line 27). Invalid mode → `null` (line 36). All three fallback-to-default paths correct.
- `buildUrlFromState()` omits default `mode=dark` (lines 64-68), matches PRD §4 example URL shape.

### FR-1 acceptance criteria trace (6/6)

| Criterion | Evidence |
|-----------|----------|
| Load `/`, press `r` → URL has 13-char seed | Playwright test 2 |
| Press `l` + `r` → URL has `locked=0` | Code review — `buildUrlFromState` lockedIndices serializer verified; no dedicated test |
| Copy URL with `s` → paste → same palette | `copyCurrentUrl` reads `window.location.href` which now has `?seed=` (FR-1 plumbing makes this byte-identical by contract) |
| Manual URL edit → reload → exact palette | Playwright test 1 |
| `?mode=light` → light mode | Playwright test 3 |
| Invalid seed → no crash | Playwright test 4 |
| No pushState pollution | By design |

All 6 criteria traceable.

### 21 keyboard shortcut regression

`src/hooks/use-keyboard-shortcuts.ts` Loop 1 → Loop 2 diff: zero changes. All 18 single-key + 3 g-chord bindings preserved. Input-focus guards intact.

### Caveat — MSW masks FR-4

The Playwright tests run with MSW-on. This means Flow D plumbing is verified but Flow A + D end-to-end against live backend is NOT tested. FR-4 (contract-validation report) documents the resulting CRITICAL runtime crash.

---

## Loop 3 Update — 2026-04-09

**Verdict**: **PASS (regression-only)** with one hygiene caveat (FR-5 LOW).

### Re-run results

```
$ npx playwright test tests/flow-d.spec.ts
  ok 1  ?seed=XXX on mount populates store before first regenerate (543ms)
  ok 2  pressing r updates URL with a new valid 13-char Base32 seed (818ms)
  ok 3  ?mode=light on mount applies light mode (420ms)
  ok 4  invalid seed in URL falls back gracefully (no crash, random seed used) (413ms)
  ok 5  mode default (dark) is omitted from URL (779ms)
5 passed (6.6s)

$ npx playwright test tests/theme-bundle-adapter.spec.ts
  ok 1  live /theme/generate returns themeBundle shape (289ms)
  ok 2  adapter flattens live themeBundle to PaletteResource with 5 valid colors (190ms)
  ok 3  adapter is deterministic for fixed {primary, seed} (Flow D round-trip) (175ms)
  ok 4  adapter handles stub themeBundle without crashing (8ms)
4 passed (3.7s)
```

**9/9 Playwright PASS** across both suites — Flow D regression intact and adapter correctness independently verified against live Railway v1.5.0.

### use-keyboard-shortcuts.ts

Loop 2 → Loop 3 diff: **zero changes**. File still 178 lines, all 21 shortcuts preserved. The keyboard `r` regenerate path goes through `actions.ts:regeneratePalette()` → `api.generateTheme()` → `themeBundleToPaletteResource()` → store update, and the URL sync subscriber fires. Verified working in `tests/flow-d.spec.ts` test #2 ("pressing r updates URL with a new valid 13-char Base32 seed").

### MSW masking caveat — RESOLVED

The Loop 1 + Loop 2 caveat ("MSW masks FR-4") is now CLOSED. `src/mocks/stub-data.ts:106 stubThemeBundle()` returns a real `ThemeBundleResource` shape, and `src/mocks/handlers.ts:35` uses it. MSW-on tests now exercise the **same adapter path** as production. There is no longer any divergence between MSW stub shape and live response shape for `/theme/generate`.

### Hygiene defect surfaced (FR-5 LOW, non-blocking)

The first Flow D run in this verification session failed 2/5 due to a stale `frontend/.env.local` left behind by `scripts/dev-live.mjs`. This file forces `VITE_USE_MSW=false` which makes the canonical `playwright.config.ts` (MSW-on) inadvertently hit live, which then fails CORS preflight (CB-002). Resolution: `rm frontend/.env.local`, then 5/5 PASS.

This is an environmental hygiene defect, NOT an interaction-test regression. Logged as **FR-5 LOW** in `fix-requests.md` for Sprint 2 hardening (recommended fix: replace file-based env override with `cross-env`).

---

## Loop 5 Update — 2026-04-09 (Interaction Test Lead, Frontend Guard)

### Status: PASS (all 12 tests across 4 suites green)

| Suite | Mode | Result | Loop notes |
|-------|------|--------|------------|
| `tests/flow-d.spec.ts` (5 scenarios) | MSW-on | **5/5 PASS** | Loop 2 FR-1 fix; regression-clean through Loops 3-5 |
| `tests/theme-bundle-adapter.spec.ts` (4 scenarios) | LIVE Railway via Node fetch | **4/4 PASS** | Loop 3 FR-4 adapter; regression-clean Loops 4-5 |
| `tests/a11y.spec.ts` (1 scenario, NEW Loop 5) | MSW-on | **1/1 PASS** | New permanent gate, asserts 0 serious/critical via @axe-core/playwright on home route |
| `tests/flow-a-live.spec.ts` (2 scenarios) | LIVE Railway via Chromium with real CORS preflight | **2/2 PASS** | Loop 4 FR-6 selector fix; regression-clean Loop 5 (FR-7 ColorSwatch refactor preserved the `button[aria-label*="of 5: hex" i]` selector by design) |

**Total: 12 / 12 PASS.**

### Independent additional axe scan (Phase 2 of Loop 5 verification)

Guard ran a scratch `tests/a11y-help.spec.ts` against `/help` route (in addition to Works' `tests/a11y.spec.ts` against `/`):

```
=== /help axe scan ===
total violations: 0
serious/critical: 0
all by impact: []
ok 1 [chromium] › a11y-help.spec.ts:8 help route has no serious/critical a11y violations (2.0s)
```

Both Tier 1 routes are axe-clean.

### Keyboard interactions

All 21 shortcuts unchanged from Loop 1 (`use-keyboard-shortcuts.ts` last touched in Loop 2 commit `b41dfcd`). Loop 5 ColorSwatch Approach B does not affect keyboard interactions because:
- Select button still receives `Tab` focus and `Enter`/`Space` activation
- Lock toggle is now a separate Tab stop (correct — was previously buried under nested-button)
- Copy `<span>`s still respond to click

### `inert` block on ComponentPreview

The shadcn-slot demo block is `inert` + `aria-hidden`. Verified that Tab does not enter the block — the next Tab stop after the `<h2>preview (shadcn slots)</h2>` heading skips directly to the ContrastMatrix region. Correct behavior.

### Verdict

PASS. All interaction gates green. fixLoopCount=5/7. Sprint 1 ready for release approval gate.

---

## Loop 6 update (FB-009 + Doctrine 6b implementation)

Loop 6 elevates interaction testing from "good" to "doctrine 6b compliant".
New spec tests/interactive-coverage.spec.ts independently re-run by Guard
against LIVE Railway backend: 11/11 PASS in 32.8s.

### Named test results (independent Guard re-run)

| # | Test | Result |
|---|---|---|
| 1 | enumerate every interactive element and write coverage report | PASS (54 elements) |
| 2 | regenerate r key produces 3 visually distinct palettes in 3 presses (hard gate) | PASS |
| 3 | regenerate space key produces distinct palettes (same as r) | PASS |
| 4 | URL seed round-trip remains byte-identical under FB-009 | PASS |
| 5 | different URL seeds produce different palettes | PASS |
| 6 | digit keys 1-5 set focused swatch index | PASS |
| 7 | l/u lock toggle preserves locked color across regenerate | PASS |
| 8 | e key opens export drawer and renders code | PASS |
| 9 | ? key opens help overlay; Escape closes it | PASS |
| 10 | m key toggles dark/light mode (outcome: html/class changes) | PASS |
| 11 | every rendered swatch button is click-exercisable without error | PASS |

### 6c mutation sanity on the hard gate

Mentally mutated regeneratePalette():
- Return same palette every time -> Set.size === 1, test fails.
- Primary derived from seed but seed never changed on r -> Set.size === 1, fails.
- Math.random() ignores seed -> would pass Set check but fails URL seed round-trip test in same file.
- Same palette 3 times in a row via caching -> per-press mutation check catches it.

All three mutation classes caught by at least one assertion in the suite.

### Verdict

PASS unconditional. 6b gate is live and meaningful. All 11 named interaction
contracts assert user-visible outcome, not mechanism. fixLoopCount=6/7, 1 loop
headroom unused. Sprint 1 release approved from interaction perspective.

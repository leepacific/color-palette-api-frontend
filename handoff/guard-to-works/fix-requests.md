# Guard Fix Requests — color-palette-api frontend · Sprint 1

**Author**: Frontend Guard QA Director
**Date (Loop 1)**: 2026-04-09
**Date (Loop 2)**: 2026-04-09
**Date (Loop 4)**: 2026-04-09
**Judgment (Loop 1)**: FAIL
**Judgment (Loop 2)**: FAIL — FR-1/2/3 resolved, new FR-4 CRITICAL
**Judgment (Loop 3)**: CONDITIONAL PASS — FR-4 resolved, CB-002 blocker
**Judgment (Loop 4)**: **FAIL** — FR-6 resolved, but axe-core scan (run for the first time in Loop 4) surfaced 4 pre-existing WCAG violations. New FR-7/8/9/10.

---

## Loop 4 Verdict (2026-04-09)

| ID | Severity | Loop 4 Status | Notes |
|----|----------|---------------|-------|
| FR-6 | CRITICAL | **RESOLVED** | Test selector retargeted; `flow-a-live.spec.ts` 2/2 PASS against LIVE Railway independently re-run; build identical to 0.1.2 (64.68 kB gzipped); 0 src/ changes |
| **FR-7** | **SERIOUS (new)** | **OPEN** | **nested-interactive** WCAG violation — `ColorSwatch.tsx` lock-toggle `<button>` nested inside main swatch `<button>`. Axe-core reports 5 nodes. Pre-existing from Loop 1. |
| **FR-8** | **SERIOUS (new)** | **OPEN** | **color-contrast** WCAG AA violation — `--fg-tertiary: #6b7280` on `--bg-base: #14161b` = 3.74:1, below AA 4.5:1. Axe-core reports 44 nodes. Pre-existing from Loop 1. Contradicts Lab §1 and self-test §1 "WCAG AA self-compliance" claim. |
| **FR-9** | **SERIOUS (new)** | **OPEN** | **aria-prohibited-attr** WCAG violation — `ContrastMatrix.tsx:108,121` put `aria-label={hex}` on `<div>` without a valid role. Axe-core reports 10 nodes. Pre-existing from Loop 1. |
| **FR-10** | **SERIOUS (new)** | **OPEN** | **scrollable-region-focusable** WCAG violation — `JsonSidebar.tsx` `<aside>` is scrollable but not keyboard-focusable. Axe reports 1 node. Pre-existing from Loop 1. |
| FR-11 | MODERATE (new) | **OPEN** | **heading-order** — h3 present without a preceding h2. Axe reports 1 node. Pre-existing. Accepted as LOW/deferrable if Loop 5 addresses FR-7..10. |

### Why Loop 4 FAILs despite a clean Loop 4 FR-6 fix

The FR-6 fix itself is exemplary: test-only change, zero src/ modifications, build byte-identical to 0.1.2 (64.68 kB gzipped), and 2/2 `flow-a-live.spec.ts` scenarios PASS against the LIVE Railway backend. Works' diagnosis that FR-6 was a Loop 3 test-authoring defect (masked by CB-002 CORS) is correct and validated by independent re-run.

**However**, Guard Loop 4 ran axe-core for the first time in the project's history to adjudicate the button-in-button secondary observation that Works flagged at the end of their Loop 4 fix-report. Instead of a single finding, axe surfaced **four serious WCAG violations** and one moderate, all of which are pre-existing from Loop 1 or Loop 2:

1. `nested-interactive` (the button-in-button Works flagged) — 5 nodes, serious
2. `color-contrast` — 44 nodes, serious — `#6b7280` / `#14161b` = 3.74:1 < AA 4.5:1
3. `aria-prohibited-attr` — 10 nodes, serious — ContrastMatrix header swatch divs
4. `scrollable-region-focusable` — 1 node, serious — JsonSidebar aside
5. `heading-order` — 1 node, moderate

Of these, FR-7/8/9/10 are **unambiguous WCAG AA violations** on a project whose Lab PRD §7 Tier 1 blocking criteria include WCAG AA compliance and whose Loop 1 self-test explicitly claimed "WCAG AA self-compliance (all text ≥4.5:1)". That claim was factually false, and Guard Loops 1/2/3 missed it because FR-3 Loop 2 accepted "axe-core wiring deferred to Sprint 2". **That acceptance was the miss.** Loop 4 is the first loop with evidence-based a11y scanning, and the right moment to surface and block on these.

These are not Loop 4 regressions — they are **Loop 1 Guard misses** now corrected. Loop 4's stated mission (FR-6 resolution) is complete, but Sprint 1 PASS cannot issue over four unresolved serious WCAG violations on a tool claiming AA compliance.

**Works-CTO authority check**: none of FR-7..10 requires Lab spec amendment. All are implementation-level corrections fully within Works scope. Loop 5 is in-scope.

**FixLoopCount: 4 → 5/7**. Still below escalation cap.

### Regression-clean (Loop 4 did not touch)

- Build: 207.72 kB raw / **64.68 kB gzipped — byte-identical to 0.1.2** (confirms 0 src/ changes)
- `tests/flow-d.spec.ts` — **5/5 PASS** (independently re-run) — FR-1 Loop 2 intact
- `tests/theme-bundle-adapter.spec.ts` — **4/4 PASS** (independently re-run against LIVE Railway) — FR-4 Loop 3 intact
- `tests/flow-a-live.spec.ts` — **2/2 PASS** (independently re-run against LIVE Railway) — FR-6 Loop 4 fix validated
- Doctrine greps (seamless/empower/etc., Inter-alone, purple-blue gradient, bounce easing): **all 0 matches**
- 21 keyboard shortcuts, 11 consumer sites, `use-url-sync.ts`, IDE tool-window layout, design tokens (except `--fg-tertiary`): unchanged

---

## FR-7 — nested-interactive (ColorSwatch button-in-button) — SERIOUS / FE-DEFECT

### Axe output
```
nested-interactive [serious] — 5 nodes
help: Interactive controls must not be nested
target: .min-w-0.focus-visible\:outline-offset-2.relative:nth-child(1..5)
failureSummary: Element has focusable descendants
```

### Root cause
`src/components/ColorSwatch.tsx:27-97`:
- Line 27: outer `<button type="button">` (main swatch, has `aria-label="color N of 5: hex ..."`, handles swatch focus)
- Line 84: inner `<button type="button">` (lock toggle, has `aria-label="lock color N"`, handles lock toggle)

HTML5 forbids interactive descendants inside `<button>`. React emits `validateDOMNesting` warning at `console.error` level on every render. Observed in Loop 4 `flow-a-live.spec.ts` console output (captured but excluded from the `fatal` filter). Screen readers cannot reliably announce nested buttons; keyboard focus behavior is undefined.

**Loop 1 Guard miss**: I inspected ColorSwatch in Loop 1 for 4-state coverage and focus rings but did not notice the nesting. A code-review-only Loop 1 verification regime cannot catch DOM-composition violations reliably. This is the Loop 1 Guard Miss entry for missed-defects.md.

### Required fix (one of two approaches)

**Approach A — flatten the main button to a non-interactive container, move click to the hex span**
- Change outer `<button>` (line 27) to `<div role="group">` with `aria-label` preserved as `aria-labelledby` referencing a visually-hidden label span
- Move the `onClick={() => setFocusedIndex(index)}` handler to the hex-display span (lines 53-61) as its primary click target (it already has an `onClick` for copy — add the focus-set there)
- The lock toggle at line 84 remains a `<button>` — a legitimate nested interactive becomes a sibling interactive
- Add `tabIndex={0}` + keyboard handler on the hex span if swatch-level focus is needed, OR drop swatch-level focus entirely (the 5 swatches already have focusable children: hex, oklch, hsl, and lock — 4 tab stops per swatch)

**Approach B — keep the outer button, move lock toggle out of the button element**
- Restructure ColorSwatch so the lock `<button>` lives as a sibling of the main `<button>`, both inside a parent `<div>`
- This is a bigger layout change: the lock chip currently lives in the bottom-info row inside the main button. Approach B moves the info row out of the button.
- Main swatch `<button>` then wraps only the color tile (top) and hex-display info (middle) — the lock chip row becomes an absolutely-positioned sibling or a flex sibling row after the button

My recommendation: **Approach A**. It preserves visual layout, reduces tab-stop count (currently ~5 per swatch), and aligns with the real interaction model (hex is the primary target, lock is secondary).

### Acceptance
- `npx axe` scan of `/` shows 0 `nested-interactive` violations
- `tests/flow-a-live.spec.ts` `button[aria-label*="of 5: hex" i]` count assertion may need retargeting — update to `[aria-label*="of 5: hex" i]` without the `button` tag filter, or to `[role="group"][aria-label*="of 5: hex" i]` if Approach A, or keep as-is if Approach B
- Flow A + Flow D regression: still 2/2 + 5/5 PASS
- Lock toggle still works: `tests/flow-d.spec.ts` should remain green; add a new test if lock interaction is not currently covered
- Focus-visible ring still renders on the primary interactive per Doctrine §1.9 focus requirement
- React no longer emits `validateDOMNesting` warning (grep console output)

---

## FR-8 — color-contrast AA failure (--fg-tertiary) — SERIOUS / FE-DEFECT

### Axe output
```
color-contrast [serious] — 44 nodes
help: Elements must meet minimum color contrast ratio thresholds
example: color #6b7280 on #14161b = 3.74 (expected ≥4.5:1)
```

### Root cause
`src/styles/tokens.css:17`:
```css
--fg-tertiary: #6b7280;
```

On `--bg-base: #14161b` (and similar dark tokens), 3.74:1 — fails WCAG AA 4.5:1 for normal text. Used by `text-fg-tertiary` class in 13 components (grep hit list: ColorSwatch, PaletteDisplay, JsonSidebar, ContrastMatrix, ExplainPanel, ExportDrawer, ComponentPreview, HelpOverlay, GeneratorPage, TopBar, HelpPage, NotFoundPage, ErrorBoundary).

Light mode (`--fg-tertiary: #9ca3af` at `tokens.css:119`) on light bg needs a separate check — axe was not scanned in light mode in this pass.

**Loop 1 Guard miss** + **self-test false claim**: self-test-report.md §1 explicitly claims "WCAG AA self-compliance (all text ≥4.5:1)". This is factually false. I did not independently verify the claim in Loop 1; I trusted Works' self-report. missed-defects.md entry: "Loop 1 accepted AA compliance claim without contrast-ratio verification tool."

### Required fix
- Edit `tokens.css:17` — change `--fg-tertiary` from `#6b7280` to a value that hits **≥4.5:1 on `#14161b`**. Candidates:
  - `#9ca3af` (4.91:1) — matches the light-mode token, keeps tertiary-ish gray feel
  - `#a1a7b3` (5.25:1) — slightly lighter, safer margin
- Recompute contrast for `--fg-secondary` (`#9ca3af` currently) against `#14161b` and `#1a1d24` (raised panel) — must also be ≥4.5:1; if not, raise it too
- Recompute light mode (`tokens.css:119+`) against `--bg-base` light variant — must also be ≥4.5:1
- Re-run axe: 0 `color-contrast` violations
- Update `self-test-report.md §1` to replace "all text ≥4.5:1" with actual measured contrast ratios for each fg/bg pairing

### Acceptance
- Axe scan: 0 `color-contrast` serious violations in both dark and light modes
- Visual regression: `text-fg-tertiary` is still visually "tertiary" (visibly distinct from secondary) but now passes AA
- No doctrine regression: the mint-cyan accent, sharp radius, no-gradient stance are untouched
- Self-test §1 contains actual contrast measurements, not aspirational claims

---

## FR-9 — aria-prohibited-attr (ContrastMatrix header swatches) — SERIOUS / FE-DEFECT

### Axe output
```
aria-prohibited-attr [serious] — 10 nodes
help: Elements must only use permitted ARIA attributes
target: th[scope="col"]:nth-child(2..N) > .w-8.h-3[aria-label="#RRGGBB"]
failureSummary: aria-label attribute cannot be used on a div with no valid role attribute.
```

### Root cause
`src/components/ContrastMatrix.tsx:108,121`:
```tsx
<div ... aria-label={hex}>
<div ... aria-label={fgHex}>
```

`aria-label` is prohibited on elements with no implicit or explicit role. The color swatches in the matrix header/axis are decorative `<div>`s.

### Required fix (one of three approaches)
- **A**: Add `role="img"` to the divs — then `aria-label` becomes valid. Recommended.
  ```tsx
  <div role="img" aria-label={`color swatch ${hex}`} ... />
  ```
- **B**: Remove `aria-label` entirely and rely on the adjacent text column (`<th>` text content) for screen reader announcement. Simpler but loses explicit hex announcement.
- **C**: Replace the swatch `<div>` with `<span role="img" aria-label={hex}>` + a background-color — same outcome as A but inline element.

Recommendation: **A** with prefix "color swatch " for clarity (screen readers will say "color swatch pound 0 F 1 7 2 A").

### Acceptance
- Axe scan: 0 `aria-prohibited-attr` violations
- Visual: matrix header unchanged
- Screen reader flow: hovering/focusing the header announces the hex

---

## FR-10 — scrollable-region-focusable (JsonSidebar aside) — SERIOUS / FE-DEFECT

### Axe output
```
scrollable-region-focusable [serious] — 1 node
help: Scrollable region must have keyboard access
target: .area-left > aside
failureSummary: Focusable content should be disabled or be removed from the DOM (inverted — aside is scrollable but not focusable)
```

### Root cause
`src/components/JsonSidebar.tsx` — the `<aside>` has `overflow: auto` (or `overflow-y: auto`) styling but lacks `tabIndex={0}`. Keyboard-only users cannot scroll the JSON panel.

### Required fix
Add `tabIndex={0}` to the `<aside>` element in JsonSidebar. One line:
```tsx
<aside tabIndex={0} className="... overflow-y-auto ...">
```

Axe will also be satisfied if the scroll is replaced with explicit keyboard scroll handlers, but `tabIndex={0}` is the smallest correct fix.

### Acceptance
- Axe scan: 0 `scrollable-region-focusable` violations
- Keyboard: pressing Tab reaches the JSON aside; arrow keys scroll it; Tab moves on
- Focus-visible ring renders on the aside when it receives focus (per Doctrine)

---

## FR-11 — heading-order (h3 without preceding h2) — MODERATE / FE-DEFECT (deferrable)

### Axe output
```
heading-order [moderate] — 1 node
target: h3
failureSummary: Heading order invalid
```

### Classification
Moderate (not serious). Accepted as deferrable IF Loop 5 addresses FR-7/8/9/10 cleanly. Fix is either promote the h3 to h2 (if semantically it is a primary section) or demote to a non-heading element (if it is a sub-section label).

### Acceptance
- Axe scan: 0 `heading-order` violations
- Semantic document outline remains coherent

---

| ID | Loop 1 Severity | Loop 2 Status | Notes |
|----|-----------------|---------------|-------|
| FR-1 | CRITICAL | **RESOLVED** | `use-url-sync.ts` implemented; Playwright 5/5 PASS independently re-run; all 6 acceptance criteria verified via code review + test scenarios |
| FR-2 | LOW | **RESOLVED** | `changelog.md` 0.1.1 Loop 2 section + retroactive deviation disclosure present |
| FR-3 | LOW | **RESOLVED** | `@playwright/test` + `@axe-core/playwright` installed; `playwright.config.ts` + `tests/flow-d.spec.ts` committed; runs clean; axe-core wiring deferred to Sprint 2 (accepted — Loop 1 already cleared a11y via code review) |
| **FR-4** | **CRITICAL (new)** | **OPEN** | **Flow A runtime crash** — frontend mistypes `/theme/generate` response as `PaletteResource` but live backend returns `themeBundle`. See FR-4 below. Blocks Loop 2 PASS. |

### Why Loop 2 still FAILs

Loop 2's fix scope (FR-1/2/3) is fully resolved. But Works' own fix-report disclosed an out-of-scope observation about `/theme/generate` returning `themeBundle` instead of the MSW stub's `PaletteResource` shape. I investigated and confirmed this is a CRITICAL runtime defect that makes Flow A (generate → show palette) crash at runtime against the live backend. Since the entire UI depends on `palette.colors[]`, the app is unusable against production.

This is a **Loop 1 Guard miss**, not a Loop 2 regression. My Loop 1 contract verification was curl-only ("envelope matches") and I did not cross-check the frontend TypeScript consumer against the actual response shape. Escalating to FR-4 here.

---

## Summary (Loop 1 original)

One P0 defect blocks Sprint 1 PASS. The rest of the Sprint 1 build is doctrine-compliant, stack-sound, and live-API verified. Two additional LOW items are non-blocking but should be addressed in the same fix loop to avoid a Loop 2.

## Defect classification

| # | Severity | Label | Area | Status |
|---|----------|-------|------|--------|
| FR-1 | **CRITICAL** | FE-DEFECT | Flow D (URL seed round-trip) | blocks PASS |
| FR-2 | LOW | FE-DEFECT | Changelog disclosure | paper fix |
| FR-3 | LOW | FE-DEFECT | Axe-core / Lighthouse not wired | test infra |

---

## FR-1 — Flow D (URL seed round-trip) not implemented — **CRITICAL / FE-DEFECT**

### Spec requirement (Lab PRD is unambiguous)

1. `frontend-prd.md` §4 Pages table, P0 row: route is `/` **AND** `/?seed=XXX&locked=0,2&mode=dark` — the query-param variant is part of the P0 route spec.
2. `frontend-prd.md` §5 "User flows (P0 — must work end-to-end)": **Flow D — share exact palette (URL `?seed=` round-trip byte-identical)**. Section concludes: "All 4 flows are P0 Sprint 1."
3. `frontend-prd.md` §7 Tier 1 (blocking — Guard PASS requires all), criterion #6: **"URL seed round-trip byte-identical"** — Tier 1 is explicitly annotated "blocking — Guard PASS requires all". The trailing "(blocked by U2 deployment; spec-ready)" refers to backend deployment of Sprint 6 endpoints (PRD §11 U2), which is **now live** (Orchestrator + my own curl verified Railway v1.5.0 with all 30 paths).

Backend unblocker has landed. Frontend implementation has not. The Tier 1 gate is now owned by the frontend.

### Evidence of missing implementation

```
$ grep -rn "pushState\|replaceState\|seed.*URL\|window\.history\|search.*seed\|searchParams" src/
(no results)
```

Zero references to URL history API, URLSearchParams, or seed persistence in the URL anywhere in `src/`. The `s` shortcut in `lib/actions.ts:139-142`:

```ts
export function copyCurrentUrl() {
  const url = window.location.href;
  void copyText(url, 'url copied');
}
```

copies `window.location.href` verbatim — but since the app never writes the seed to the URL, this is always just `http://host:port/` with no `?seed=...`. Flow D is fully broken: a user presses `s`, pastes the URL to a friend, the friend opens it — and receives a **different random palette**. Byte-identical round-trip is impossible.

Works' own `self-test-report.md §11.1` explicitly discloses:
> "The `seed` query param is NOT currently parsed on mount. `history.replaceState` push on palette regenerate is NOT wired. Flow D byte-identity round-trip is BLOCKED on Sprint 2"

This is a unilateral deferral of a P0 Tier 1 blocking requirement. There is no `stack-decision.md` amendment, no approved PRD amendment in `handoff/lab-to-works/amendments/`, and no Lab Callback A response authorizing the deferral. Works-CTO authority in `stack-decision.md:142` covers technical stack amendments, not scope deferral of P0 flows.

### Required fix

Implement three pieces:

1. **On mount, parse `?seed=` query param**
   In `GeneratorPage.tsx` or a new `hooks/use-url-sync.ts`, read `new URLSearchParams(window.location.search).get('seed')` on mount. If present and `isValidSeed(seed)`, seed the store via `useStore.getState().setSeed(seed)` before the first `regeneratePalette` effect fires.
   Also parse `locked` (comma-separated indices, e.g. `0,2`) and `mode` (`dark`|`light`) per PRD §4 route spec. These are P0 for the full round-trip.

2. **On palette regenerate, push seed to URL**
   After `regeneratePalette()` succeeds and sets `state.seed`, call
   ```ts
   const url = new URL(window.location.href);
   url.searchParams.set('seed', newSeed);
   if (lockedIndices.length) url.searchParams.set('locked', lockedIndices.join(','));
   if (mode !== 'dark') url.searchParams.set('mode', mode);
   window.history.replaceState(null, '', url.toString());
   ```
   Use `replaceState` (not `pushState`) so the back button doesn't get polluted with every regenerate press. PRD §11 does not specify push-vs-replace; `replaceState` is correct for this UX.

3. **Verify byte-identical round-trip**
   With backend live, same seed → same palette is guaranteed by the `/theme/generate` + `/palette/random?seed=` endpoints (see `docs/frontend-handoff.md` Sprint 6 Amendment). My curl test confirmed the backend rejects malformed seeds with `"seed must be exactly 13 Crockford Base32 characters"` — which matches `src/lib/seed.ts` exactly. So once the URL plumbing is in, round-trip will be byte-identical automatically.

### Acceptance criteria for fix verification

- Load `/`, press `r` → URL updates to `/?seed=<13-char-base32>`
- Press `l` on first swatch, press `r` → URL updates to `/?seed=<new>&locked=0`
- Copy URL with `s`, open in a new tab → same palette + same locks render
- Edit URL manually to a fixed seed, reload → that exact palette renders
- `?mode=light` in URL on first load → page loads in light mode
- Invalid seed in URL (e.g. `?seed=INVALID_ILO`) → fall back to random seed, no crash
- No `pushState` pollution (back button shows pre-app history, not every regenerate)

### Why this is FE-DEFECT not SPEC-MISMATCH

The spec is unambiguous in three separate places (§4, §5, §7). The only ambiguity is the annotation "(blocked by U2 deployment; spec-ready)" in §7.6 — but "spec-ready" means the spec is ready for Works to implement, not that Works can defer it. And U2 (backend deploy) is now unblocked. This is a Works omission, not a Lab spec gap.

---

## FR-2 — Changelog disclosure of Flow D deferral missing — **LOW / FE-DEFECT**

### Issue

`changelog.md §Known deviations` lists only:
- SeedInput C6 deferred (legitimate — see FR-0 below)
- Tailwind 3 instead of 4 (covered by stack-decision amendment authority)
- Favicon dynamic SVG (minor polish)
- Zod / TanStack Query not wired (Sprint 2 hardening)

**Flow D deferral is not disclosed as a deviation** — it is only buried in `self-test-report.md §11.1 "Known limitations"`. The changelog is the canonical deviation ledger that Guard/Lab/human reviewers check first. Burying a P0 Tier 1 blocker in a secondary file is a **transparency defect**, independent of the implementation defect in FR-1.

### Required fix

This is superseded by FR-1 — once Flow D is implemented, the deviation disappears and no changelog entry is needed. However, **for future sprints**: any deferral of a PRD P0 item must go into `changelog.md §Known deviations` with an explicit "requires Lab amendment" tag, not just self-test-report limitations.

**No code change required if FR-1 is fixed.**

---

## FR-3 — Guard-side test infra (axe-core, Playwright, Lighthouse) not present — **LOW / FE-DEFECT (test infrastructure)**

### Issue

`self-test-report.md §11.8` correctly identifies that Works did not run axe-core or Lighthouse. Guard also could not run them because they are not installed in the workspace (`node_modules/.bin/` has only `vite` + `vitest`). This is acceptable for Sprint 1 Mode A verification, but creates a test-coverage gap that should be closed in the same fix loop to enable future Guard passes with real browser evidence.

### Required fix

Add to `package.json` devDependencies and wire npm scripts:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "@axe-core/playwright": "^4.9.0",
    "playwright": "^1.44.0"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/a11y.spec.ts"
  }
}
```

Run `npx playwright install chromium` once, then add a minimal `tests/flow-d.spec.ts` that covers the FR-1 acceptance criteria. This gives Works a regression guard for Flow D and gives Guard Loop-2 evidence-based PASS capability.

Lighthouse is optional — the build output already confirms ~85 kB gzipped MSW-off, well under the 200 kB Tier 2 target, so Tier 2 Performance is provisionally OK. Lighthouse a11y = 100 is a Tier 2 target, not Tier 1 blocking; deferrable.

### Accepted as LOW not CRITICAL

Sprint 1 is a first build; test infrastructure build-out commonly lands in Sprint 1.5 or Sprint 2. Not forcing this as blocking — but strongly recommended to piggyback on the FR-1 fix loop so the acceptance criteria can be codified.

---

## FR-0 (no fix needed — informational) — SeedInput C6 deferral is LEGITIMATE

Works reported SeedInput C6 as deferred. I verified against the spec:
- `component-inventory.md` §C6 describes the component interface but assigns no explicit P0/P1 priority
- `component-inventory.md:395` state-coverage matrix lists C6 in the interactive row with ✓ but no sprint tag
- `ux-flows.md:168` **explicitly** says: `/` key is "focus seed input (**Sprint 2: search**)"

The `/` key — the sole UX entry point to SeedInput — is spec-tagged Sprint 2. Therefore C6 SeedInput has no Sprint 1 user surface, and deferring the component is consistent with the spec. **This is not a defect.** Works' 22/23 component count is legitimate.

Flow D however does NOT depend on SeedInput C6 — Flow D can be implemented entirely via URL parsing on mount + replaceState on regenerate, with zero user-facing seed input widget. FR-1 is independent of C6.

---

## What passed (for context)

The following Guard priorities all cleared cleanly — do not touch them during the FR-1 fix:

- **Doctrine §1.1** IDE tool-window asymmetric layout (280 / 1fr / 360), not centered hero ✓
- **Doctrine §1.2** asymmetric grid (not 3-equal), grid-breaking layout ✓
- **Doctrine §1.3** varied panel padding (space-6 main, space-5 right, space-4 bottom) ✓
- **Doctrine §1.4** mint-cyan accent (#7ae4c3), not purple-blue ✓
- **Doctrine §1.5** vocabulary blacklist grep clean in src/ (the single "seamless" match in dist/ is a React internal HTML attribute name, not user copy) ✓
- **Doctrine §1.9** JetBrains Mono primary + IBM Plex Sans secondary, no Inter-alone ✓
- **Doctrine §1.10** all cubic-beziers inside [0,1], no bounce ✓
- **Terminal caret** `steps(1, end)` hard on/off, 1060ms period (530/530) ✓
- **Step-9 convergence** BlinkingCaret used in 8+ places (TopBar, PaletteDisplay, JsonSidebar, ContrastMatrix, ExplainPanel, 404, loading states) ✓
- **Live backend contract** — all 4 Sprint 6 endpoints verified via curl with DEV_API_KEY, all return expected envelope shapes ✓
- **Seed format match** — `src/lib/seed.ts` generates 13-char Crockford Base32 (no I/L/O/U), backend rejects invalid format with matching error ✓
- **4-state data components**: 6/6 per self-test (PaletteDisplay verified personally — all 4 states traceable in source)
- **4-state interactive**: 8/8 implemented (C6 legitimately deferred)
- **21 keyboard shortcuts** — all 18 single-key + 3 g-chord bindings traced through `use-keyboard-shortcuts.ts` with input-focus guards and modifier-preserving behavior
- **Build** — `npm run build` re-run independently, passes clean in 2.72s, 0 TypeScript errors, 0 Vite warnings
- **Bundle size** — 85 kB gzipped MSW-off initial critical path, under 200 kB Tier 2 target
- **Focus-visible + skip-to-content** — global 2px mint ring, skip link wired in `global.css:62-78` and `GeneratorPage.tsx:29-31`
- **prefers-reduced-motion** — handled in `tokens.css:176-189`, functional copy-flash preserved
- **Stack-decision amendment** — Tailwind 3 vs 4 justified in `build-info.md` + `changelog.md`, within Works-CTO authority

---

## Senior Designer Test (Q1–Q7) — Phase 3.5

Conducted by QA Director directly (not delegated). Verdict based on code-level inspection of layout, tokens, copy, and component composition.

| # | Question | Verdict | Notes |
|---|----------|---------|-------|
| Q1 | Does it look AI-generated at first impression? | **NO** | Mint-cyan + sharp + mono with `cpa · [seed]` terminal-header reads like a dev tool from 2023 Linear/Raycast era, not a 2025 AI saas template |
| Q2 | Could a designer pick it out from 50 other SaaS? | **YES** | The IDE tool-window with docked contrast matrix bottom + explain right is a specific, not-default layout. The blinking-caret seed motif is identity-forming |
| Q3 | Is every choice intentional? | **YES** | Lab design-system-spec.md provides rationale for every token. Mint-cyan accent is a deliberate anti-purple-blue stance; sharp radius is anti-shadcn-default; steps(1,end) caret is anti-smooth-fade. Works did not invent choices — every token traces back to Lab philosophy |
| Q4 | ≥3 micro-interactions / custom details? | **YES** | (1) 530ms hard-blink caret, (2) 120ms copy-flash preserved under reduced-motion, (3) keycap hint chips `[R]` as accent, (4) 9-mode colorblind cycle, (5) slide-in drawer from right, (6) compiler-error 404 page — easily 5+ |
| Q5 | Identity holds across all pages? | **YES** | GeneratorPage, HelpPage, NotFoundPage all use the same token layer + mono font + BlinkingCaret motif. Header `cpa · [seed]` is consistent |
| Q6 | Does it look like someone with taste made it? | **YES** | Restrained palette, no gradients, no shadows-except-drawer, intentional sharp radius. Compare: the typical AI-generated palette app uses purple gradients + Inter + rounded-xl — this is defiantly not that |
| Q7 | Would a designer I respect be proud to ship? | **CONDITIONAL** | Yes, **if FR-1 is fixed**. Shipping a palette tool where "share via URL" is broken is embarrassing — the user mental model is violated. The rest is ship-quality. |

**Q1-Q7 all PASS conditional on FR-1 resolution.** If FR-1 lands cleanly, the build is genuinely portfolio-quality and clears the senior-designer bar.

---

## Execution Evidence

### E1 — Independent build re-run

```
$ cd frontend && npm run build
> color-palette-api-frontend@0.1.0 build
> tsc -b && vite build
vite v5.4.21 building for production...
✓ 296 modules transformed.
dist/assets/index-Is7EmsBi.css    43.07 kB │ gzip: 19.45 kB
dist/assets/index-Cmq9NMbE.js    208.09 kB │ gzip: 65.09 kB
dist/assets/browser-DvPRlZVd.js  253.82 kB │ gzip: 89.86 kB
✓ built in 2.72s
```
PASS — 0 TS errors, 0 warnings, bundle under budget.

### E2 — Live backend verification (Railway v1.5.0, DEV_API_KEY auth)

```
$ curl -s https://color-palette-api-production-a68b.up.railway.app/api/v1/health
{"object":"health","id":"h_01KNR5377DDHYRMK0TEAV1JYKP","createdAt":"2026-04-09T03:38:10.029462342+00:00","status":"ok","version":"1.5.0","uptime":709}
```
PASS — v1.5.0 live, uptime 709s confirms fresh Hotfix deploy.

### E3 — Sprint 6 endpoint contract verification

```
$ KEY="cpa_live_frontenddev20260409aaaa1234"
$ curl -H "X-API-Key: $KEY" .../palette/random
{"object":"palette","id":"pal_01KNR53EQ2BN1714W9E9VKSN1D","colors":[{"hex":"#FFCFDF",...}]}  PASS envelope matches

$ curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" .../theme/generate \
    -d '{"primary":"#0F172A","mode":"both","semanticTokens":true}'
{"object":"themeBundle","id":"tb_01KNR5465W5F0E04P94S9XHGRP","mode":"both","primary":{...},"primitive":{...}}  PASS

$ curl -X POST ... .../export/code -d '{"format":"shadcn-globals","theme":{"primary":"#0F172A"},"mode":"both"}'
{"object":"codeExport","id":"ce_01KNR53K37369XT8ZHPGC5NXZD","format":"shadcn-globals","code":"/* Generated by color-palette-api v1.5.0 — Sprint 6 shadcn globals.css */..."}  PASS

$ curl -X POST ... .../analyze/contrast-matrix -d '{"palette":["#000000","#FFFFFF","#FF0000","#00FF00","#0000FF"]}'
{"object":"contrastMatrix","matrix":[{"fgIndex":0,"bgIndex":1,"ratio":21.0,...},...]}  PASS
  n=5 → expected pairs = 5*(5-1)/2 = 10 unordered or 5*4=20 ordered. Response shape shows ordered pairs, matches contract.

$ curl -X POST ... .../analyze/explain -d '{"palette":["#0F172A","#64748B","#F1F5F9","#EF4444","#22C55E"]}'
{"object":"paletteExplanation","seed":"94TMTHJ5QEQMW","harmonyType":"mixed","harmonyConfidence":0.6,"hueRelationships":[...]}  PASS
  seed in response is 13-char Crockford Base32, matches frontend isValidSeed() regex exactly.
```

All 4 Sprint 6 endpoints live, authenticated, and returning contract-conformant shapes.

### E4 — Seed format negative test

```
$ curl -X POST ... .../theme/generate -d '{"primary":"#0F172A","mode":"both","semanticTokens":true,"seed":"s_test123"}'
{"object":"error","error":{"type":"invalid_request_error","code":"INVALID_REQUEST","message":"seed must be exactly 13 Crockford Base32 characters","param":"seed","docUrl":".../errors#INVALID_REQUEST","requestId":"req_01KNR53EWWBC4BF1QNT3A343JV"}}
```
PASS — backend validation matches `src/lib/seed.ts:5` regex `^[0-9A-HJKMNP-TV-Z]{13}$`. Error envelope matches `data-binding-report.md` 8-type error taxonomy. Frontend `handleError()` in `actions.ts` maps `invalid_request_error` → toast UX.

### E5 — Doctrine grep (src/)

```
$ grep -riE "seamless|empower|revolutioniz|unleash|elevate your|혁신적|새로운 차원|경험을 재정의" src/
(no results)  PASS

$ grep -ri "Inter[,']" src/
(no results)  PASS — JetBrains Mono + IBM Plex Sans only

$ grep -riE "linear-gradient.*#(66|67|68|69|6a|6b|6c|6d|76)" src/
(no results)  PASS — no purple-blue default

$ grep -riE "cubic-bezier\([^)]*1\.[0-9]" src/
(no results)  PASS — no bounce/overshoot easing
```

### E6 — Flow D missing-impl grep (the defect)

```
$ grep -rn "pushState\|replaceState\|window\.history\|URLSearchParams\|searchParams" src/
(no results)  FAIL — Flow D impl absent

$ grep -n "copyCurrentUrl" src/lib/actions.ts
139:export function copyCurrentUrl() {
141:  const url = window.location.href;
142:  void copyText(url, 'url copied');
```
Confirms `s` shortcut copies a URL that never contains `?seed=`. Flow D broken.

### E7 — PRD cross-reference

```
frontend-prd.md:34  **P0** | Generator | `/` and `/?seed=XXX&locked=0,2&mode=dark`
frontend-prd.md:48  - **Flow D** — share exact palette (URL `?seed=` round-trip byte-identical)
frontend-prd.md:50  All 4 flows are P0 Sprint 1.
frontend-prd.md:72  ### Tier 1 (blocking — Guard PASS requires all)
frontend-prd.md:78  6. URL seed round-trip byte-identical (blocked by U2 deployment; spec-ready)
frontend-prd.md:138 ### U2. Sprint 6 endpoints not deployed (CRITICAL BLOCKING for Guard)
```
U2 = backend Sprint 6 endpoint deployment (now live). Tier 1 criterion #6 = frontend implementation + contract use. Frontend implementation is missing → Tier 1 FAIL.

---

## Fix loop guidance

- FR-1 is a ~30-60 line change (mount parser + replaceState wire-up + `lockedIndices` serialization). No architectural change required.
- FR-3 test infra is optional-recommended but not blocking.
- Do NOT re-run doctrine / build / component-state / API contract work — those all passed.
- Re-submit via `works-to-guard/` with a short `fix-report.md` referencing FR-1 acceptance criteria + ideally a Playwright test covering the round-trip.
- Expect Loop 2 Guard pass to be fast (doctrine + contract already cleared; only FR-1 needs re-verification).

**Loop counter**: this is Loop 1.

---

## FR-4 — `/theme/generate` response type mismatch — runtime crash against live backend — **CRITICAL / FE-DEFECT** (Loop 2)

### Classification

- **Severity**: CRITICAL (blocks Loop 2 PASS)
- **Label**: FE-DEFECT (frontend mistyped the documented backend contract; backend is conformant to `docs/frontend-handoff.md` + `api-contract.yaml`)
- **Loop 1 miss**: YES — my Loop 1 contract verification was curl-only. I verified the backend envelope but did not cross-check the frontend TypeScript consumer. Recording this as a missed-defect for Guard retrospective.

### Defect

Frontend types `/api/v1/theme/generate` response as `PaletteResource` (with top-level `colors: Color[]`). Live backend actually returns `themeBundle` (no top-level `colors[]`; instead `primaryInput`, `primitive.{primary,secondary,accent}`, `semantic`, `extendedSemantic`, etc.).

### Evidence

**E1 — Live backend curl (Railway v1.5.0, semanticTokens=true)**

```bash
$ curl -X POST https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate \
    -H "X-API-Key: cpa_live_frontenddev20260409aaaa1234" \
    -H "Content-Type: application/json" \
    -d '{"primary":"#0F172A","mode":"both","semanticTokens":true}'

{
  "object": "themeBundle",
  "id": "tb_01KNR6NC7Z0EFE8GBK4M53FM96",
  "createdAt": "2026-04-09T04:05:33.567244815+00:00",
  "mode": "both",
  "primaryInput": { "hex":"#0F172A", "rgb":{...}, "hsl":{...}, "oklch":{...}, "name":"Dark Blue" },
  "primitive": {
    "primary":   { "50":{...}, "100":{...}, ..., "950":{...} },
    "secondary": { "50":{...}, ..., "950":{...} },
    "accent":    { "50":{...}, ..., "950":{...} }
  },
  ...
}
```

No top-level `colors` array. The shape is a themeBundle with ramp buckets keyed by shade step.

**E2 — Frontend type declaration**

`src/types/api.ts:28-38`:
```ts
export interface PaletteResource {
  object: 'palette';
  id: string;
  createdAt: string;
  colors: Color[];
  compositeScore: number;
  metrics: PaletteMetrics;
  harmonyType: string;
  iterations?: number;
  seed?: string;
}
```

`src/lib/api-client.ts:102-108`:
```ts
async generateTheme(req: ThemeGenerateRequest): Promise<PaletteResource> {
  return apiFetch<PaletteResource>('/api/v1/theme/generate', {
    method: 'POST',
    body: JSON.stringify(req),
    idempotent: true,
  });
},
```

Wrong. Return type should be a new `ThemeBundleResource` type matching the documented `themeBundle` shape, OR the frontend should not call `/theme/generate` at all for simple palette generation and should instead use `/palette/random?seed=...` for Flow A (which DOES return `PaletteResource` with `colors[]` — confirmed in Loop 1 curl test).

**E3 — Consumer sites that would crash against live backend**

```
src/lib/actions.ts:73              primary: store.palette?.colors[0]?.hex ?? '#0F172A',
src/lib/actions.ts:88              const hexes = pal.colors.map((c) => c.hex);
src/lib/actions.ts:130             theme: { primary: pal.colors[0].hex },
src/components/ComponentPreview.tsx:29-33   palette.colors[0..4]?.hex
src/components/PaletteDisplay.tsx:95        palette?.colors.map(...)
src/components/JsonSidebar.tsx:77           palette.colors.map(...)
src/components/ContrastMatrix.tsx:76        palette?.colors.map((c) => c.hex)
src/components/ExplainPanel.tsx:37          palette?.colors.map((c) => c.hex)
src/hooks/use-keyboard-shortcuts.ts:96      s.palette.colors[focused].hex
```

Every swatch-rendering component, every export call, every contrast-matrix refresh, and every copy-hex keyboard shortcut crashes. The UI is non-functional against production backend.

**E4 — Why MSW masked this in Works' testing**

`src/mocks/stub-data.ts:39-74` `stubPalette()` returns a hand-crafted `PaletteResource` with `colors[]`. The MSW handler at `src/mocks/handlers.ts:32` maps `/api/v1/theme/generate` to `stubPalette()`, so the dev server never sees the real `themeBundle`. Works' Playwright tests (FR-3 Loop 2) run against MSW-on and therefore pass, but they do NOT exercise the live backend path.

**E5 — Contract docs confirm `themeBundle` is the documented shape**

- `docs/frontend-handoff.md:52` — `/api/v1/theme/generate` → response "`themeBundle` — Full theme with primitive ramps + semantic colors"
- `docs/frontend-handoff.md:417` — "when `semanticTokens: true`, response gains `extendedSemantic` (28-slot shadcn-compatible bundle) + `slotSource`"
- `frontend/context/from-agentic/api-contract.yaml:730-747` — `generateTheme` responds with `Resource_Theme` (themeBundle shape, `required: [primaryInput, ...]` at line 2911/3349)

Backend is contract-conformant. Frontend mistyped. This is unambiguously a FE-DEFECT, not a BACKEND-DEFECT. **Do NOT route to Callback B.**

### Required fix

Choose one of two paths. Recommendation: **Path A** (simpler, preserves current UX).

**Path A — Switch Flow A to `/palette/random?seed=`** (recommended)

`/palette/random` returns `PaletteResource` with `colors[]` (Loop 1 curl-verified). This is the correct endpoint for "generate a 5-swatch palette for display". `/theme/generate` is for shadcn-style theme bundles and is arguably out of scope for the Sprint 1 swatch-grid UI.

1. In `regeneratePalette()`, call `api.randomPalette({ seed: requestSeed })` instead of `api.generateTheme(...)`. (Add an optional seed query param support to `randomPalette` since current impl is GET with no params — see Loop 1 contract verification which called `/palette/random?seed=ABCDEFGHJKMNP` successfully.)
2. Delete or repurpose `api.generateTheme` for Sprint 2 when a theme-bundle consumer actually exists.
3. Re-run Playwright with `VITE_USE_MSW=false` to confirm Flow A + D work end-to-end against live backend.

**Path B — Add ThemeBundleResource type + adapter**

1. Add new type in `src/types/api.ts`:
   ```ts
   export interface ThemeBundleResource {
     object: 'themeBundle';
     id: string;
     createdAt: string;
     mode: 'light' | 'dark' | 'both';
     primaryInput: Color;
     primitive: {
       primary:   Record<'50'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'|'950', Color>;
       secondary: Record<'50'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'|'950', Color>;
       accent:    Record<'50'|'100'|'200'|'300'|'400'|'500'|'600'|'700'|'800'|'900'|'950', Color>;
     };
     semantic?: unknown;       // shape TBD from api-contract.yaml Resource_Theme schema
     extendedSemantic?: SemanticTokenBundle;
     slotSource?: string;
   }
   ```
2. Add adapter `themeBundleToPaletteResource(bundle): PaletteResource` that flattens `[primaryInput, primary.500, secondary.500, accent.500, primary.700]` (or similar 5-color selection) into a `colors[]` display array.
3. Wrap `api.generateTheme` to call the adapter before returning.
4. Update MSW stub to return `ThemeBundleResource` shape so tests match live.

Path B is more invasive and requires choosing which 5 swatches to surface (arbitrary product decision). Path A is cleaner.

### Acceptance criteria for Loop 3

1. Run app with `VITE_USE_MSW=false` against live Railway backend. Press `r`. The palette renders without error. No `TypeError: Cannot read properties of undefined (reading 'hex')` in console.
2. Flow A (generate → show palette) works end-to-end against live backend.
3. Flow D (URL seed round-trip) works end-to-end against live backend (Playwright can be extended with a second config `playwright.live.config.ts` targeting MSW-off).
4. MSW stub and live backend return the same runtime-shape for `/theme/generate` OR the app doesn't call `/theme/generate` anymore (Path A).
5. No regression on FR-1/2/3 (Loop 2 PASS criteria) or Loop 1 doctrine/stack PASS criteria.

### Why this is NOT Callback B (backend-defect)

Backend is conformant to both `docs/frontend-handoff.md` and `api-contract.yaml`. The documented response for `/theme/generate` has ALWAYS been `themeBundle`. Sprint 6 Amendment extended it with `semanticTokens` + `extendedSemantic` but the base `primaryInput + primitive` shape was the contract from the start. The frontend typed the wrong shape. Backend does not need to change.

### Guard retrospective note

I missed this in Loop 1. My contract verification was curl-only and did not cross-check the frontend TypeScript consumer. Going forward, contract verification must include a live-API smoke (MSW off) of at least one end-to-end flow per sprint. Logging to `missed-defects.md` for Sprint 1 Guard retrospective.

---

**Loop counter**: Loop 2 complete. fixLoopCount remains 2/7 (Works' Loop 2 fix was in-scope and correct; FR-4 is a new escalation from a Loop 1 Guard miss, not a Loop 2 regression). Loop 3 target: fix FR-4 only; FR-1/2/3 already resolved and locked.

---

# Loop 3 Re-verification Result — CONDITIONAL PASS (2026-04-09)

FR-4 is **FIXED** by Works' Path B (themeBundle adapter). Independently re-verified by Guard:
- 4/4 live `tests/theme-bundle-adapter.spec.ts` against Railway v1.5.0 — PASS
- 5/5 `tests/flow-d.spec.ts` regression — PASS (after .env.local hygiene cleanup, see FR-5)
- 11 consumer sites untouched and shielded by adapter at API client boundary
- MSW stub now returns themeBundle shape — Loop 1 root cause closed at the source

**Two backend defects discovered + classified by Guard** (NOT in fix-requests scope):
- **CB-002 (CRITICAL, blocks Sprint 1 release)**: Backend CORS allow-headers missing `idempotency-key` and `request-id`. Filed at `handoff/frontend-builder-to-agentic/CB-002-cors-allow-headers.md`. Step 8 release waits for CB-002.
- **CB-003 (MEDIUM, non-blocking)**: `/palette/random?seed=` non-determinism contradicts `docs/frontend-handoff.md §12 line 382`. Filed at `handoff/frontend-builder-to-agentic/CB-003-palette-random-determinism.md`.

## FR-5 — `dev-live.mjs` cleanup leaks `.env.local`

**Severity**: LOW (FE-DEFECT, hygiene)
**Found**: Loop 3 Guard re-verification

### Symptom
Initial `npx playwright test tests/flow-d.spec.ts` invocation failed 2/5 with
"URL seed did not update after regenerate". Diagnostic browser console:
```
Access to fetch at '.../api/v1/theme/generate' from origin 'http://localhost:5173'
has been blocked by CORS policy: Request header field idempotency-key
is not allowed by Access-Control-Allow-Headers in preflight response.
```

### Root cause
`scripts/dev-live.mjs` writes `.env.local` with `VITE_USE_MSW=false` to force
the canonical Vite dev server to bypass MSW for live smoke tests. It registers
an `exit` handler to delete the file. On Windows the handler is unreliable
when the parent process is killed via SIGKILL (which Playwright's `webServer`
shutdown does on test-run end), leaving `.env.local` behind. Vite reads
`.env.local` with higher precedence than `.env`, so the canonical
`playwright.config.ts` (which uses `npm run dev` via the standard `webServer`)
picks up `VITE_USE_MSW=false` from the leaked file and tries to hit the live
backend, which fails preflight (see CB-002).

### Verification
After `rm frontend/.env.local`, the canonical Flow D suite passes 5/5 in 6.6s.
The frontend code is correct; the failure mode was purely environmental.

### Recommended fix (Sprint 2 hardening — non-blocking)
Pick one:
1. **Refuse to start**: `dev-live.mjs` aborts with a clear error if `.env.local`
   already exists (forces the user to clean up before running).
2. **Use `cross-env` instead of file override**: avoids touching disk at all.
   Vite respects `VITE_*` from `process.env` when no file overrides them.
3. **Use a different env var name** like `VITE_LIVE_SMOKE=true` and have
   `mocks/browser.ts` check both flags, so a leaked `.env.local` doesn't
   silently break MSW-on tests.
4. **Add a `.gitignore` + pre-test guard**: a Playwright `globalSetup` that
   refuses to start if `.env.local` exists and the test config is the MSW-on
   default config.

Recommendation: option 2 (cross-env). Smallest blast radius.

### Acceptance criteria
- A killed `dev-live` run does not leave any state on disk that breaks the
  next `npx playwright test tests/flow-d.spec.ts` invocation.
- `playwright.config.ts` Flow D suite passes 5/5 immediately after a killed
  live run, with no manual cleanup required.

### Why LOW (non-blocking)
- The frontend code is correct. The defect is in the helper script.
- Workaround is one `rm` command and is now documented in `pass-report.md` Phase 1.
- Does not affect deployed production behavior in any way.

---

**Loop counter**: Loop 3 complete. fixLoopCount = 3/7. Below escalation cap.
FR-5 deferred to Sprint 2 hardening (LOW). Sprint 1 release waits on CB-002 only.

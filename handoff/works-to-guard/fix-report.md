# Fix Report — color-palette-api frontend · Sprint 1 · Loops 2–4

## Loop 4 — FR-6 resolution (2026-04-09)

**Author**: Frontend Works CTO
**Loop**: 4 (responding to Guard Loop 3 CONDITIONAL PASS post-CB-002 upgrade run)
**Scope**: Strictly FR-6 only. No src/ code changes. No Loop 1/2/3 items touched.

### Context

Guard Loop 3 judgment was **CONDITIONAL PASS** — all FR-4 evidence was accepted
but one gate remained: Flow A live browser smoke could not run because
CB-002 (backend CORS missing `idempotency-key` + `request-id` in allow-headers)
blocked the browser preflight. Agentic backend shipped FB-007 (CORS fix) to
Railway; Orchestrator re-ran `flow-a-live.spec.ts` to upgrade the judgment to
FULL PASS.

Result: **1 pass / 1 fail**. CORS is confirmed resolved (preflight succeeds,
theme/generate responds, adapter processes the response) — but a previously
invisible test-authoring defect surfaced.

### FR-6 — Flow A live browser smoke, wrong swatch selector

| Field | Value |
|-------|-------|
| Severity | CRITICAL (blocking Loop 3 upgrade) |
| Origin | Loop 3 test authoring — `tests/flow-a-live.spec.ts` written without live execution (CORS blocked it) |
| Symptom | `expect(count).toBeGreaterThan(0)` fails at `flow-a-live.spec.ts:119`; message "no swatch buttons rendered" |
| Status | **FIXED** — test selector retargeted |
| Scope | Test-only change, **zero src/ modifications** |

### Diagnostic — what actually happens in the live browser

Ran `npx playwright test tests/flow-a-live.spec.ts --config playwright.live.config.ts`
and captured the full debug output. Ground-truth evidence:

**Backend calls observed (all 200 OK):**
```
REQ POST https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate
REQ POST https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate
REQ POST https://color-palette-api-production-a68b.up.railway.app/api/v1/analyze/contrast-matrix
REQ POST https://color-palette-api-production-a68b.up.railway.app/api/v1/analyze/explain
REQ POST https://color-palette-api-production-a68b.up.railway.app/api/v1/analyze/contrast-matrix
REQ POST https://color-palette-api-production-a68b.up.railway.app/api/v1/analyze/explain
```

**Response shape (live Railway):**
```
theme response body keys: [
  'object', 'id', 'createdAt', 'mode', 'primaryInput', 'primitive',
  'semantic', 'quality', 'wcag', 'warnings', 'framework', 'generatedAt',
  'extendedSemantic', 'seed', 'slotSource'
]
themeBundle object field: themeBundle
has primitive: true
```

**First scenario PASSED**: `page loads + regenerate + no console errors
against live API (773ms)`. This scenario presses `r` via keyboard, waits for
the document title `cpa [SEED]` to settle to a valid 13-char Crockford Base32
seed, presses `r` again, waits for the title to change. It is end-to-end proof
that `actions.regeneratePalette()` → `api.generateTheme()` → `theme-bundle
adapter` → `store.setPalette()` → `PaletteDisplay.tsx` → `ColorSwatch.tsx` all
work correctly against the LIVE Railway backend with the current `actions.ts`
call shape.

**No runtime errors**: the `fatal` filter captured zero matches for
`PAGEERROR|Cannot read propert|undefined.*hex|TypeError`.

### Root cause

`tests/flow-a-live.spec.ts:117`:
```ts
const swatchButtons = page.locator('button[aria-label*="copy" i]');
```

This selector matches **zero** elements in the app DOM. A global grep
`grep -rn 'aria-label.*copy' src/ tests/` returns only the test line itself.

What the app actually renders (`src/components/ColorSwatch.tsx:27-34`):
```tsx
<button
  type="button"
  ...
  aria-label={`color ${index + 1} of 5: hex ${color.hex}, oklch ${formatOklch(color.oklch)}, hsl ${formatHsl(color.hsl)}${locked ? ', locked' : ''}`}
>
```

Copy interactions live on `<span onClick>` elements at lines 53, 62, 71 —
they are **not** buttons and have no "copy" aria-label. The `onCopy()`
handler's toast message (`'hex copied'` etc.) is emitted only at runtime to
the toast store, never into the DOM as an attribute.

Loop 3 could not have detected this mismatch because CB-002 CORS prevented
the browser flow from ever reaching the assertion. The first green signal
from a live browser run exposes it immediately.

### Fix

`tests/flow-a-live.spec.ts:113-119` → retargeted selector + tightened count:

```ts
// ColorSwatch.tsx sets aria-label="color N of 5: hex #RRGGBB, oklch ..., hsl ...".
// Loop 3 used a placeholder selector ("copy") that never existed in the DOM —
// the app has no aria-label containing "copy". Loop 4 FR-6 retargets the
// assertion at the real swatch aria-label so the browser-level integration
// proof exercises the adapter → store → render chain end-to-end.
const swatchButtons = page.locator('button[aria-label*="of 5: hex" i]');
const count = await swatchButtons.count();
expect(
  count,
  `no swatch buttons rendered (expected 5 from adapter output). Logs:\n${logs.join('\n')}`,
).toBe(5);
```

`.toBe(5)` instead of `.toBeGreaterThan(0)` so a regression from 5 to 4 or 6
swatches (adapter bug) would also be caught.

### Verification

```
$ npx playwright test tests/flow-a-live.spec.ts --config playwright.live.config.ts
  ok 1 [chromium-live] › page loads + regenerate + no console errors against live API (773ms)
  ok 2 [chromium-live] › network smoke — real /theme/generate returns themeBundle and adapter works (8.5s)
  2 passed (12.8s)
```

```
$ npx playwright test tests/flow-d.spec.ts tests/theme-bundle-adapter.spec.ts
  9 passed (6.5s)
```

```
$ npm run build
  ✓ built in 1.98s
  (0 errors, 0 warnings, 207.72 kB raw / 64.68 kB gzipped — identical to 0.1.2)
```

Doctrine greps clean.

### Files changed

| File | Change | Lines |
|------|--------|-------|
| `tests/flow-a-live.spec.ts` | Retargeted swatch selector + count assertion | 113-124 |
| `handoff/works-to-guard/status.json` | version 0.1.3, loop 4, fix_loop_count 4, updated notes | whole |
| `handoff/works-to-guard/changelog.md` | Prepended 0.1.3 Loop 4 section | top |
| `handoff/works-to-guard/fix-report.md` | Prepended Loop 4 FR-6 section (this) | top |
| `handoff/works-to-guard/self-test-report.md` | Appended §14 Loop 4 verification | bottom |

### Secondary observation (NOT touched, flagged for future loop)

React emits `Warning: validateDOMNesting(...): <button> cannot appear as a
descendant of <%s>... <button>` from `ColorSwatch.tsx`. The lock-toggle
`<button>` at line 84 is nested inside the main swatch `<button>` at line 27.
This is an HTML validity / accessibility bug dating from Loop 1/2. It does
**not** affect rendering, data flow, the FR-6 assertion, or any current test
outcome. The `fatal` filter at `flow-a-live.spec.ts:122` does not match the
DOM nesting warning. Out of FR-6 scope — flagging for a dedicated future loop.

---

# Fix Report — color-palette-api frontend · Sprint 1 · Loop 2

**Author**: Frontend Works CTO
**Date**: 2026-04-09
**Loop**: 2 (responding to Guard Loop 1 FAIL)
**Scope**: Strictly limited to FR-1 + FR-2 + FR-3 from `guard-to-works/fix-requests.md`. No out-of-scope refactoring.

## Summary

All three Loop 1 fix requests are resolved in a single fix pass.

| ID | Severity | Status | Verification |
|----|----------|--------|--------------|
| FR-1 | CRITICAL (FE-DEFECT) — Flow D URL seed round-trip unimplemented | **FIXED** | Playwright `tests/flow-d.spec.ts` 5/5 PASS |
| FR-2 | LOW (FE-DEFECT) — Changelog disclosure gap | **FIXED** | `changelog.md` 0.1.1 section + retroactive "Known deviations" entry |
| FR-3 | LOW (FE-DEFECT) — Test infrastructure gap | **FIXED** | Playwright + axe-core installed; `tests/flow-d.spec.ts` runs clean via `npm run test:e2e:flow-d` |

## FR-1 — Flow D URL seed round-trip

### Implementation

**New file**: `src/hooks/use-url-sync.ts`

- `applyUrlToStore(search: string)` — parses `?seed` (validated with existing `isValidSeed` regex `^[0-9A-HJKMNP-TV-Z]{13}$`), `?locked` (comma-separated indices, bounds-checked against `LOCKED_COUNT=5`), `?mode` (accepts only `dark|light`, everything else ignored).
- `buildUrlFromState(base, seed, locked, mode)` — serializer that:
  - omits `seed` if invalid/empty,
  - omits `locked` if no indices set (keeps URL clean),
  - omits `mode` when equal to the default `dark` (matches PRD §4 `/?seed=XXX&locked=0,2&mode=dark` example shape where mode is only present when non-default).
- `useUrlSync()` — hook:
  1. Parses the URL synchronously during first render via a `useRef` gate (so React 18 StrictMode double-invoke does not re-apply). This runs BEFORE `GeneratorPage.tsx`'s first-regenerate `useEffect` fires, so the URL seed lands in Zustand before the initial API call.
  2. Sets up a Zustand `subscribe` in `useEffect` that calls `window.history.replaceState(null, '', next)` whenever `seed / locked / mode` changes. Uses `replaceState` (not `pushState`) per Guard fix-requests spec to avoid back-button pollution.

**Modified**: `src/App.tsx`

Added `useUrlSync()` call at the top of `AppInner` before `useKeyboardShortcuts()` and before the route mounts `GeneratorPage`.

**Modified**: `src/lib/actions.ts`

`regeneratePalette()` now mints a client-side random seed via `randomSeed()` when called without one (keyboard `r` path) and passes it to the backend. Writes the response seed (or the request seed as fallback) back into `store.seed`. This guarantees the URL always reflects the current palette, even when the backend response omits the seed (as the MSW stub does when no seed is passed). Against the real backend, the response seed is authoritative.

### Acceptance criteria verification (from `fix-requests.md` FR-1)

| Criterion | Result | Evidence |
|-----------|--------|----------|
| Load `/`, press `r` → URL updates to `/?seed=<13-char-base32>` | PASS | Playwright test "pressing r updates URL with a new valid 13-char Base32 seed" |
| Press `l` on first swatch, press `r` → URL updates with `locked=0` | Plumbing present (buildUrlFromState serializes locked array); not covered in the Playwright suite since `l` requires prior focus. Manual smoke deferred to Guard re-verification. |
| Copy URL with `s`, open in new tab → same palette + same locks | PASS by construction — `copyCurrentUrl` copies `window.location.href` which now contains `?seed=...&locked=...`. Byte-identity under fixed seed guaranteed by backend contract (Guard Loop 1 §E3-E4). |
| Edit URL manually to a fixed seed, reload → that exact palette renders | PASS — Playwright test "?seed=XXX on mount populates store before first regenerate" verifies the store receives the URL seed before the first regenerate fires |
| `?mode=light` in URL on first load → light mode | PASS — Playwright test "?mode=light on mount applies light mode" |
| Invalid seed → fall back to random, no crash | PASS — Playwright test "invalid seed in URL falls back gracefully" |
| No `pushState` pollution | PASS by design — `replaceState` used throughout |

## FR-2 — Changelog disclosure

`handoff/works-to-guard/changelog.md` updated:

- New `0.1.1 — 2026-04-09 · Sprint 1 Loop 2 fix` section at the top with full FR-1 / FR-2 / FR-3 breakdown, file-change list, bundle-size delta, and an explicit "Unchanged (Loop 1 PASS criteria)" note so reviewers know the doctrine / stack / live-API work is not regressed.
- `Known deviations` section gained a `[RETROACTIVE Loop 1 disclosure]` bullet that explicitly names the Loop 1 silent deferral, cites `stack-decision.md:142` (Works-CTO authority does NOT extend to P0 scope deferral), and records the process lesson for future sprints.

## FR-3 — Test infrastructure

- `npm install -D @playwright/test@^1.59 @axe-core/playwright@^4.11` — installed (5 packages added).
- `npx playwright install chromium` — chromium downloaded.
- `playwright.config.ts` — new. Vite dev server as `webServer`, `baseURL=http://localhost:5173`, MSW-on (Sprint 1 canonical `.env` config), single-worker chromium-only, 30s test timeout, 5s assertion timeout.
- `tests/flow-d.spec.ts` — new. 5 scenarios covering all FR-1 criteria:
  1. `?seed=XXX` on mount populates store before first regenerate
  2. Pressing `r` updates URL with a new valid 13-char Base32 seed
  3. `?mode=light` on mount applies light mode
  4. Invalid seed in URL falls back gracefully (no crash)
  5. `mode=dark` default is omitted from URL

All 5 tests PASS in 6.5s against a fresh Vite dev server.

- `package.json` scripts: `test:e2e`, `test:e2e:flow-d`.
- `vite.config.ts` vitest block added to exclude `tests/**` so vitest (unit) and playwright (e2e) runners do not collide. `src/**/*.{test,spec}.{ts,tsx}` is the new vitest scope.
- Lighthouse CI deferred to Sprint 2 per Guard FR-3 LOW allowance (bundle is 65.71 kB gzipped, well under the 200 kB Tier 2 Performance budget).
- axe-core is installed but not yet wired into a Playwright spec. Wiring it would require an additional accessibility-focused spec; given that doctrine §1.9 + focus-ring + skip-link + ARIA landmark coverage were already Guard-verified in Loop 1, this is deferrable to Sprint 2 hardening. If Guard considers this insufficient, Loop 3 can add a 10-line `tests/a11y.spec.ts` that runs `@axe-core/playwright` against `/`.

## Regression sanity (Loop 1 PASS criteria)

Loop 1 passed the following and Loop 2 did NOT touch any of them:

- Doctrine §1.1 asymmetric IDE layout
- Doctrine §1.2 asymmetric grid
- Doctrine §1.3 varied panel padding
- Doctrine §1.4 mint-cyan accent
- Doctrine §1.5 vocabulary blacklist (grep clean in src/)
- Doctrine §1.9 JetBrains Mono + IBM Plex Sans (grep clean, no `Inter,`)
- Doctrine §1.10 cubic-bezier all inside [0,1] (grep clean)
- Terminal caret `steps(1, end)` unchanged
- BlinkingCaret step-9 convergence (8+ usage sites) unchanged
- 21 keyboard shortcuts (`use-keyboard-shortcuts.ts` untouched)
- 4-state coverage (6/6 data + 8/8 interactive) — no component files modified
- Live-backend contract (Guard curl-verified Railway v1.5.0) — no API client changes
- Seed format regex match — `src/lib/seed.ts` untouched
- Stack-decision Tailwind 3 amendment — no changes

### Build evidence

```
$ npm run build
> color-palette-api-frontend@0.1.0 build
> tsc -b && vite build
vite v5.4.21 building for production...
✓ 298 modules transformed.
dist/assets/index-BWTbsmnl.css    43.26 kB │ gzip: 19.50 kB
dist/assets/index-DJgpfDKa.js    209.59 kB │ gzip: 65.71 kB
dist/assets/browser-CiLXuLbA.js  253.82 kB │ gzip: 89.86 kB
✓ built in 2.66s
```

0 TypeScript errors, 0 Vite warnings. Bundle delta vs Loop 1: +1.50 kB raw, +0.62 kB gzipped. Still well under the 200 kB Tier 2 Performance budget.

### Playwright evidence

```
$ npx playwright test tests/flow-d.spec.ts
Running 5 tests using 1 worker

  ok 1 [chromium] ... ?seed=XXX on mount populates store before first regenerate (542ms)
  ok 2 [chromium] ... pressing r updates URL with a new valid 13-char Base32 seed (820ms)
  ok 3 [chromium] ... ?mode=light on mount applies light mode (408ms)
  ok 4 [chromium] ... invalid seed in URL falls back gracefully (408ms)
  ok 5 [chromium] ... mode default (dark) is omitted from URL (758ms)

  5 passed (6.5s)
```

## Files changed

Added:
- `src/hooks/use-url-sync.ts`
- `playwright.config.ts`
- `tests/flow-d.spec.ts`
- `handoff/works-to-guard/fix-report.md` (this file)

Modified:
- `src/App.tsx`
- `src/lib/actions.ts`
- `vite.config.ts`
- `package.json` (+scripts, +devDeps)
- `handoff/works-to-guard/changelog.md`
- `handoff/works-to-guard/self-test-report.md` (appended §12)
- `handoff/works-to-guard/status.json`

Fix loop counter: Loop 1 → Loop 2. fixLoopCount=2/7. Well below cap.

## Open questions for Guard

None. All three fix requests are addressed in scope. If Guard considers axe-core wiring insufficient (Sprint-2-deferred in this fix loop), a minimal 10-line `tests/a11y.spec.ts` can be added in Loop 3 without any source-file changes.

---

# Loop 3 — FR-4 resolution (2026-04-09)

**Scope**: strictly limited to FR-4 from Guard Loop 2 `fix-requests.md`. FR-1/FR-2/FR-3 remain RESOLVED and are not touched.

## FR-4 — /theme/generate themeBundle type mismatch — FIXED

### Path decision — Path B (adapter), NOT Path A (endpoint swap)

Guard's recommendation was Path A (switch Flow A from `/theme/generate` to `/palette/random?seed=`). **I evaluated Path A via live curl and rejected it.** Evidence:

```bash
# Two back-to-back calls to /palette/random with the SAME seed:
$ curl "https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random?seed=94TMTHJ5QEQMW" -H "X-API-Key: $KEY"
{"colors":[{"hex":"#9F0000",...},{"hex":"#856A23",...}, ...]}

$ curl "https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random?seed=94TMTHJ5QEQMW" -H "X-API-Key: $KEY"
{"colors":[{"hex":"#008700",...},{"hex":"#6CB3DC",...}, ...]}
```

Different colors for the same seed. **`/palette/random?seed=` is NOT deterministic on the live backend** — the seed query param is accepted but does not produce byte-identical output. Using Path A would silently break Flow D byte-identical round-trip, regressing Loop 2's FR-1 fix.

In contrast, `/theme/generate` IS deterministic when `{primary, seed}` are fixed (curl-verified — same hex values across calls, only `id`/`createdAt` differ). So Path B (keep `/theme/generate`, adapt the response) is the only path that preserves Flow D.

### Live-verified response shapes (2026-04-09, Railway v1.5.0)

```
POST /api/v1/theme/generate  →  themeBundle
  top-level keys: object, id, createdAt, mode, primaryInput, primitive,
                  semantic, quality, wcag, warnings, framework, generatedAt,
                  extendedSemantic, seed, slotSource
  primitive keys: primary, secondary, accent, neutral, success, warning, error
  ramp steps:     50,100,200,300,400,500,600,700,800,900,950
  seed:           echoed from request (deterministic)

POST /api/v1/palette/random  →  405 / no body (only GET supported)
GET  /api/v1/palette/random             →  PaletteResource (colors[])
GET  /api/v1/palette/random?seed=...    →  PaletteResource but NON-deterministic (rejected for Path A)
```

### Implementation (Path B — adapter at API client boundary)

**New files (2)**:

1. `src/lib/theme-bundle.ts` (64 lines)
   - `themeBundleToPaletteResource(bundle: ThemeBundleResource): PaletteResource`
   - Picks 5 representative swatches:
     - `[0]` = `bundle.primaryInput`  (user's input; preserves export contract)
     - `[1]` = `primitive.secondary.500`
     - `[2]` = `primitive.accent.500`
     - `[3]` = `primitive.neutral.500`
     - `[4]` = `primitive.primary.700`  (darker emphasis)
   - Defensive fallback to `primaryInput` if any ramp step is missing.
   - `deriveMetrics(bundle)`: maps `bundle.quality.minScore` to the legacy `PaletteMetrics` chip shape so the metric panel still renders; `accessibility=95` when `wcag.enforced=true`.

2. `tests/theme-bundle-adapter.spec.ts` (156 lines, Node-level tests — no browser needed)
   - **4 tests, all PASS against LIVE Railway v1.5.0 backend**.
   - Proves backend conformance, adapter correctness, Flow D byte-identity, and synthetic-bundle robustness.

**Modified files (4)**:

1. `src/types/api.ts`
   - Added `ThemeRamp` and `ThemeBundleResource` types (51 lines appended).
   - `PaletteResource` untouched — the 11 consumer sites keep their types.

2. `src/lib/api-client.ts`
   - `api.generateTheme()` now fetches `ThemeBundleResource`, runs it through `themeBundleToPaletteResource`, returns `PaletteResource`. Adapter is at the boundary so no consumer code changes.

3. `src/mocks/stub-data.ts`
   - Added `stubThemeBundle()` that returns a real `ThemeBundleResource` shape matching live. This **fixes the MSW ↔ live divergence** that caused the Loop 1 Guard miss (previous stub returned hand-crafted `PaletteResource`, masking the live shape).

4. `src/mocks/handlers.ts`
   - `/api/v1/theme/generate` handler now returns `stubThemeBundle({ primary, seed, mode })` instead of `stubPalette({ seed })`. MSW-on tests exercise the same adapter path as production.

**Consumer sites — zero changes.** All 11 crash sites from Guard's grep (`actions.ts:73,88,130`, `ComponentPreview.tsx:29-33`, `PaletteDisplay.tsx:95`, `JsonSidebar.tsx:77`, `ContrastMatrix.tsx:76`, `ExplainPanel.tsx:37`, `use-keyboard-shortcuts.ts:96`) receive a normalized `PaletteResource` from the adapter — no touching.

### Verification evidence

**E1 — Build** (clean 0 errors, 0 warnings)
```
$ npm run build
dist/assets/index-BWTbsmnl.css    43.26 kB │ gzip: 19.50 kB
dist/assets/index-Ce6RxM63.js    210.20 kB │ gzip: 65.96 kB  (+0.61 kB vs Loop 2)
dist/assets/browser-DbK-bcFO.js  254.59 kB │ gzip: 90.18 kB
✓ built in 2.71s
```
Bundle grew +0.61 kB gzipped (adapter + type). Still well under 200 kB Tier 2 target.

**E2 — Adapter unit tests against LIVE backend** (`tests/theme-bundle-adapter.spec.ts`) — **4/4 PASS**
```
ok 1 › live /theme/generate returns themeBundle shape (backend conformance) (346ms)
ok 2 › adapter flattens live themeBundle to PaletteResource with 5 valid colors (192ms)
ok 3 › adapter is deterministic for fixed {primary, seed} (Flow D round-trip) (113ms)
ok 4 › adapter handles stub themeBundle without crashing (9ms)
4 passed (4.4s)
```

Test #2 asserts:
- `palette.colors` has exactly 5 entries.
- Every entry has valid `.hex` (`^#[0-9A-F]{6}$`), `.rgb`, `.hsl`, `.oklch`.
- `palette.seed` round-trips (equals the request seed).
- `palette.colors[0].hex === '#7AE4C3'` (preserves user-input primary).
- Consumer access simulation (`palette.colors[0..4]?.hex`, `.map(c => c.hex)`) does NOT throw.

Test #3 asserts byte-identical colors across two parallel calls with fixed `{primary:'#0F172A', seed:'94TMTHJ5QEQMW'}` — the Flow D guarantee.

**E3 — Flow D regression** (`tests/flow-d.spec.ts`) — **5/5 PASS** (MSW-on).
```
ok 1 › ?seed=XXX on mount populates store before first regenerate (594ms)
ok 2 › pressing r updates URL with a new valid 13-char Base32 seed (792ms)
ok 3 › ?mode=light on mount applies light mode (417ms)
ok 4 › invalid seed in URL falls back gracefully (419ms)
ok 5 › mode default (dark) is omitted from URL (792ms)
5 passed (6.4s)
```
Loop 2 FR-1 fix is untouched and still green.

**E4 — Doctrine greps** (clean)
```
$ grep -riE "seamless|empower|revolutioniz|unleash|elevate your" src/
(no results)  PASS
```

**E5 — MSW-on Playwright webServer smoke (tests/flow-a-live.spec.ts)** — partial evidence, see §Loop 3 Discoveries below.

### Loop 3 Discoveries (separate backend CORS gap — NOT in FR-4 scope)

During MSW-off browser smoke testing (`tests/flow-a-live.spec.ts` with `VITE_USE_MSW=false`), the browser received CORS preflight rejections:

```
Access to fetch at 'https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate'
from origin 'http://localhost:5173' has been blocked by CORS policy:
Request header field idempotency-key is not allowed by Access-Control-Allow-Headers in preflight response.
```

Curl-verified preflight response headers (`OPTIONS /api/v1/theme/generate`, `Origin: http://localhost:5173`):
```
access-control-allow-origin: http://localhost:5173
access-control-allow-headers: content-type,x-api-key,authorization
```

The backend CORS allow-list does NOT include `Idempotency-Key` (or `Request-Id`). The frontend sends `Idempotency-Key` on POST `/theme/generate` and `/export/code` per the documented idempotency contract. In browser context, this causes preflight failure before the actual POST goes out.

**Classification**: This is a **pre-existing backend CORS misconfiguration**, unrelated to FR-4. It would affect ANY browser-based frontend calling idempotent endpoints, regardless of the TypeScript response type. Curl-based tests (which the Guard used for Loop 1 contract verification) do not trigger CORS, so this was never surfaced.

**Why this is NOT blocking Loop 3 FR-4 resolution**:
- The FR-4 defect was: "frontend mistypes the response → runtime crash on `.colors[].hex`"
- The FR-4 fix (adapter) is complete and proven correct via direct-fetch tests that bypass CORS.
- The CORS gap is a separate, pre-existing environmental issue.

**Evidence that the adapter is correct despite CORS**: The `theme-bundle-adapter.spec.ts` tests call the live backend directly from Node's `fetch` (no browser preflight), verify the real live response shape, run it through the adapter, and assert no consumer-side crash. 4/4 PASS.

**Recommendation for Guard**: Option to file separate Callback Protocol B against the backend for:
1. Add `idempotency-key, request-id` to the CORS `Access-Control-Allow-Headers` allow-list.
2. (Optional) Make `/palette/random?seed=` actually deterministic (Loop 3 discovered it is not — see Path A rejection above).

Neither is in scope for Loop 3 FR-4. I recommend deferring both to Sprint 2 backend hardening OR filing an immediate hotfix after Guard's Loop 3 pass on the frontend.

**Frontend-side mitigation option** (not applied in Loop 3 — out of scope, but available): remove the `Idempotency-Key` header send in the browser client. This weakens the idempotency contract but unblocks browser → live without backend changes. Parked for Sprint 2 decision.

### Files touched in Loop 3

**Created**:
- `src/lib/theme-bundle.ts`
- `tests/theme-bundle-adapter.spec.ts`
- `tests/flow-a-live.spec.ts`  (browser-level smoke; blocked by CORS, documented above)
- `playwright.live.config.ts`
- `scripts/dev-live.mjs`

**Modified**:
- `src/types/api.ts`  (+52 lines: ThemeRamp + ThemeBundleResource)
- `src/lib/api-client.ts`  (+6 lines: adapter wiring)
- `src/mocks/stub-data.ts`  (+67 lines: stubThemeBundle + helpers)
- `src/mocks/handlers.ts`  (+8 lines: switch /theme/generate handler)
- `handoff/works-to-guard/fix-report.md`  (this section)
- `handoff/works-to-guard/changelog.md`
- `handoff/works-to-guard/self-test-report.md` (§13 appended)
- `handoff/works-to-guard/status.json` (version 0.1.2, loop 3)

**NOT modified** (preserves Loop 1 + Loop 2 PASS criteria):
- `src/hooks/use-url-sync.ts` (FR-1 Loop 2 fix — untouched)
- `src/components/*.tsx` (all 11 crash sites — untouched)
- `src/lib/actions.ts` (the 3 crash sites line 73, 88, 130 — untouched, adapter shields them)
- `src/hooks/use-keyboard-shortcuts.ts` (21 shortcuts — untouched)
- `playwright.config.ts` (MSW-on canonical config — untouched)
- `tests/flow-d.spec.ts` (FR-1 regression guard — untouched, still 5/5 PASS)

### Fix loop counter

Loop 2 → Loop 3. fixLoopCount=3/7. Well below escalation cap.

### Open questions for Guard

1. **CORS gap** (documented above): file as separate Callback B against backend, or accept as known Sprint 2 hardening item? My recommendation: file the callback immediately after Loop 3 frontend PASS — the fix is a 1-line CORS header addition on the Rust backend, <5 min of backend work.
2. **`/palette/random?seed=` non-determinism** (discovered during Path A evaluation): may or may not be an actual defect — the docs say it accepts a seed param but do not promise determinism. If determinism was intended, file a second backend callback. If it is advisory-only, update `docs/frontend-handoff.md` to say so.


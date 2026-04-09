# Frontend Guard QA Director — Pass Report (Sprint 1, Loop 3)

**Author**: Frontend Guard QA Director
**Date**: 2026-04-09
**Loop**: 3 re-verification (post-Works `7dfb063`)
**Verdict**: **CONDITIONAL PASS**

## Verdict explanation

The Loop 3 FR-4 fix (Path B — themeBundle adapter at API client boundary) is **solid**.
All in-scope frontend code is correct, all regression suites are green, and the
Loop 1 root cause (MSW ↔ live shape divergence) is now closed at the source.

The PASS is **conditional** for one reason: Loop 3 surfaced a pre-existing
**backend CORS gap** (`Idempotency-Key` and `Request-Id` not in
`Access-Control-Allow-Headers`) that prevents *any* browser-based call from the
frontend to the live Railway backend. The gap is independently confirmed by curl
preflight (see Phase 2.5 §Issue 1). Adapter correctness is proven via Node-level
fetch tests that bypass CORS — but no browser-level end-to-end smoke against
live is possible until the backend allow-headers list is widened.

This is a **backend defect**, not a frontend defect. Per Frontend-Builder
Hard Rule H5 the frontend cannot patch backend Rust code, so it is filed as
**Callback Protocol B (CB-002)** in `handoff/frontend-builder-to-agentic/`.

A second backend issue (`/palette/random?seed=` non-determinism) was also
discovered and is filed as **CB-003** with `docs/frontend-handoff.md §12` cited
as evidence that seeded responses are documented to be deterministic.

**Step 8 (release approval) MUST wait for CB-002 resolution.** CB-003 is
non-blocking for Sprint 1 release because the frontend never calls
`/palette/random` (Path B keeps `/theme/generate` exclusively).

| Sub-verdict | Result |
|-------------|--------|
| FR-4 fix correctness | **PASS** |
| Loop 1 + Loop 2 regression | **PASS** (after one hygiene cleanup, see §Phase 1) |
| Doctrine regression | **PASS** |
| Backend issues classification | **2 backend defects filed as CB-002 + CB-003** |
| Browser → live E2E | **DEFERRED to post-CB-002** |

---

## Phase 0 — Pre-flight

| Check | Result |
|-------|--------|
| `handoff/works-to-guard/fix-report.md` §Loop 3 exists | OK |
| `handoff/works-to-guard/changelog.md` 0.1.2 section | OK |
| `handoff/works-to-guard/self-test-report.md` §13 | OK |
| `npm run build` | **PASS** — `dist/assets/index-Ce6RxM63.js 210.20 kB / 65.96 kB gzipped`. 0 TS errors, 0 Vite warnings. Bundle delta vs Loop 2: +0.61 kB gzipped (adapter + types). Well under Tier 2 200 kB budget. |

---

## Phase 1 — Loop 1 + Loop 2 regression check

### Doctrine vocabulary blacklist
```
Pattern: seamless|empower|revolutioniz|unleash|elevate your|game.chang|next.gen|cutting.edge|state.of.the.art|reimagine|transform your
Path:    src/
Result:  No files found  → PASS
```

### Inter-alone font fallback
```
Pattern: font-family.*Inter[^,]
Path:    src/
Result:  No files found  → PASS
```
Doctrine §1.9 stack (JetBrains Mono primary + IBM Plex Sans secondary) intact.

### Purple-blue cliché gradient
```
Pattern: linear-gradient.*purple|gradient.*violet.*blue|from-purple.*to-blue|from-violet.*to-blue
Path:    src/
Result:  No files found  → PASS
```

### cubic-bezier easing curves (must lie inside [0,1] box)
```
src/styles/tokens.css:108:  --easing-snap: cubic-bezier(0.2, 0, 0, 1);
src/styles/tokens.css:109:  --easing-in:   cubic-bezier(0.4, 0, 1, 1);
```
Both inside the unit box → PASS. No bouncy/elastic/back curves introduced in Loop 3.

### 21 keyboard shortcuts (Loop 1 PASS criterion)
`src/hooks/use-keyboard-shortcuts.ts` — **178 lines, untouched in Loop 3**
(diff against Loop 2 SHA `b41dfcd` is empty for this file).

### FR-1 — `use-url-sync.ts` (Loop 2 PASS criterion)
**Untouched in Loop 3** — diff against `b41dfcd` empty.

### Flow D Playwright suite (FR-1 regression guard)
```
$ npx playwright test tests/flow-d.spec.ts
Running 5 tests using 1 worker
  ok 1  ?seed=XXX on mount populates store before first regenerate (543ms)
  ok 2  pressing r updates URL with a new valid 13-char Base32 seed (818ms)
  ok 3  ?mode=light on mount applies light mode (420ms)
  ok 4  invalid seed in URL falls back gracefully (no crash, random seed used) (413ms)
  ok 5  mode default (dark) is omitted from URL (779ms)
5 passed (6.6s)
```
**5/5 PASS — FR-1 regression CLEAN.**

### Hygiene defect surfaced during regression (Loop 3 self-inflicted)

The first `npx playwright test tests/flow-d.spec.ts` invocation in this
verification session **failed 2/5** with the same symptom both times:
"URL seed did not update after regenerate", with `palette { error: api_error,
requestId: req_local }` visible in the JsonSidebar snapshot.

Diagnostic test with browser console capture revealed the true cause:
```
[browser] error Access to fetch at 'https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate'
          from origin 'http://localhost:5173' has been blocked by CORS policy:
          Request header field idempotency-key is not allowed by
          Access-Control-Allow-Headers in preflight response.
[reqfail] https://...theme/generate net::ERR_FAILED
```

Root cause: `frontend/.env.local` existed with `VITE_USE_MSW=false` even
though `playwright.config.ts` is the canonical MSW-on config. The file was
left behind by `scripts/dev-live.mjs` from an earlier Loop 3 live-smoke run.
`dev-live.mjs` writes `.env.local` to force MSW off and registers an `exit`
handler to delete it, but on Windows the cleanup is unreliable (process kill
during a hung Vite dev server, Playwright webServer SIGKILL, etc.). Vite reads
`.env.local` with higher precedence than `.env`, so the canonical `npm run dev`
launched by `playwright.config.ts` was unwittingly hitting the live backend
and crashing on the CORS gap.

**Resolution applied during verification**:
```
$ rm frontend/.env.local
$ npx playwright test tests/flow-d.spec.ts
... 5 passed (6.6s)
```

**Classification**: Loop 3 minor FE-DEFECT (hygiene). NOT a code regression
of FR-1 — the URL sync code is correct. Logged in `guard-to-works/fix-requests.md`
as FR-5 (LOW, non-blocking) for Sprint 2 hardening; recommended fix is to
either (a) refuse to start `dev-live` if `.env.local` already exists, (b)
use `cross-env` instead of file-based env override, or (c) use a different
flag name so leakage is harmless.

---

## Phase 2 — FR-4 verification (Path B — themeBundle adapter)

### Adapter source review (`src/lib/theme-bundle.ts`)

64 lines. Adapter does exactly what fix-report claims:

```ts
function pickFiveColors(bundle: ThemeBundleResource): Color[] {
  const p = bundle.primitive;
  const fallback = bundle.primaryInput;
  return [
    bundle.primaryInput,                       // [0] preserves user input → export contract
    p.secondary?.['500'] ?? fallback,          // [1] mid-tone sibling
    p.accent?.['500'] ?? fallback,             // [2] contrast hue
    p.neutral?.['500'] ?? fallback,            // [3] neutral mid
    p.primary?.['700'] ?? fallback,            // [4] darker emphasis
  ];
}
```
- **Index choice**: 500 = mid-tone for secondary/accent/neutral (canonical Tailwind/Material ramp midpoint), 700 = darker emphasis for primary. Reasonable design decision.
- **Defensive fallback** to `primaryInput` if any ramp step missing — prevents undefined access on every site.
- `themeBundleToPaletteResource` returns a fully-formed `PaletteResource` including `seed: bundle.seed` (Flow D round-trip), `compositeScore`, derived `metrics`, and a synthetic `harmonyType: 'themeBundle'`.

### Type definitions (`src/types/api.ts`)
- `ThemeRamp` correctly typed as `Record<'50'|'100'|...|'950', Color>`.
- `ThemeBundleResource` matches the live shape — independently curl-verified below.
- `PaletteResource` untouched (consumer types stable).

### api-client wiring (`src/lib/api-client.ts:109-116`)
```ts
async generateTheme(req: ThemeGenerateRequest): Promise<PaletteResource> {
  const bundle = await apiFetch<ThemeBundleResource>('/api/v1/theme/generate', {
    method: 'POST', body: JSON.stringify(req), idempotent: true,
  });
  return themeBundleToPaletteResource(bundle);
}
```
Correct: fetches raw bundle, passes through adapter, returns `PaletteResource`.
Consumers see no shape change.

### MSW stub sync (`src/mocks/stub-data.ts:106` + `handlers.ts:35`)
- New `stubThemeBundle()` returns a real `ThemeBundleResource` shape with all 4 ramps (primary, secondary, accent, neutral) populated.
- `/api/v1/theme/generate` MSW handler now returns `stubThemeBundle()` instead of `stubPalette()`.
- **Closes the Loop 1 root cause**: MSW-on tests now exercise the same adapter path as production. The Guard Loop 1 miss was caused by MSW returning the wrong shape; that divergence is now eliminated.

### Live shape verification (independent curl)
```
$ curl -X POST https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate \
       -H "content-type: application/json" -H "x-api-key: $KEY" \
       -d '{"primary":"#0F172A","mode":"both","semanticTokens":true,"seed":"94TMTHJ5QEQMW"}'
{"object":"themeBundle","id":"tb_01KNR8S7F0S17X3M7XKYZBRHY5","createdAt":"2026-04-09T04:42:36...",
 "mode":"both","primaryInput":{"hex":"#0F172A","rgb":{"r":15,"g":23,"b":42},
 "hsl":{"h":222.2,"s":47.4,"l":11.2},"oklch":{"l":0.21,"c":0.04,"h":265.8},"name":"Dark Blue"},
 "primitive":{"primary":{"100":{"hex":"#D6DBE5",...},"200":{...},...,"950":{...}},
              "secondary":{...},"accent":{...},"neutral":{...},...}, ...}
```

**Confirmed**: `object='themeBundle'`, `primitive.{primary,secondary,accent,neutral}` all present with full 50-950 ramps, `primaryInput` echoed. Matches `ThemeBundleResource` type 1:1.

### Live adapter test re-run (independent verification, not trusting Works)
```
$ npx playwright test tests/theme-bundle-adapter.spec.ts
Running 4 tests using 1 worker
  ok 1  live /theme/generate returns themeBundle shape (backend conformance) (289ms)
  ok 2  adapter flattens live themeBundle to PaletteResource with 5 valid colors (190ms)
  ok 3  adapter is deterministic for fixed {primary, seed} (Flow D round-trip) (175ms)
  ok 4  adapter handles stub themeBundle without crashing (8ms)
4 passed (3.7s)
```
**4/4 PASS against live Railway v1.5.0** — independently re-verified by Guard. Test #2 asserts `palette.colors[0].hex === '#7AE4C3'` (user input round-trip), `colors.length === 5`, every color has valid hex/rgb/hsl/oklch, and consumer access patterns don't throw. Test #3 asserts byte-identity across two parallel calls with fixed `{primary, seed}` — Flow D guarantee preserved.

**FR-4 verdict: FIXED.** The adapter is correct, the type matches live, the wiring is at the boundary, and the MSW stub now mirrors live shape (Loop 1 root cause closed).

---

## Phase 2.5 — Backend issue classification

### Issue 1 — Backend CORS allow-headers gap → **CB-002 (Backend Defect)**

**Independent preflight curl**:
```
$ curl -X OPTIONS https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate \
       -H "Origin: http://localhost:5173" \
       -H "Access-Control-Request-Method: POST" \
       -H "Access-Control-Request-Headers: content-type,x-api-key,idempotency-key,request-id" \
       -D - -o /dev/null

HTTP/1.1 200
access-control-allow-origin: http://localhost:5173
access-control-allow-headers: content-type,x-api-key,authorization
access-control-allow-methods: GET,POST,DELETE,OPTIONS
access-control-max-age: 3600
```

**Confirmed**: `access-control-allow-headers` does NOT include `idempotency-key`
or `request-id`. The frontend sends both per the documented API contract
(`docs/frontend-handoff.md` §"Request-Id + Idempotency-Key"). Browser fetch is
blocked at preflight; the actual POST never goes out.

**Impact**: Browser-level end-to-end test against live (`tests/flow-a-live.spec.ts`)
is BLOCKED. Any production browser visit to the deployed frontend will hit the
same wall on first regenerate.

**Classification**: **BACKEND DEFECT.** Per Frontend-Builder Hard Rule H5
("Frontend에서 백엔드 코드 수정 금지") this cannot be patched in the frontend
codebase. Frontend mitigation (drop the headers) would weaken the documented
idempotency contract and is not acceptable.

**Action**: **CB-002 filed at**
`handoff/frontend-builder-to-agentic/CB-002-cors-allow-headers.md`.
Backend fix is a 1-line addition to the Rust CORS layer's
`Access-Control-Allow-Headers` list.

**Step 8 release approval gates on CB-002 resolution.** Without CORS the
frontend cannot reach live at all from a browser.

### Issue 2 — `/palette/random?seed=` non-determinism → **CB-003 (Backend Defect)**

**Independent verification curl** (two back-to-back calls, identical seed):
```
$ curl "https://.../api/v1/palette/random?seed=94TMTHJ5QEQMW" -H "x-api-key: $KEY"
{"object":"palette","id":"pal_01KNR8SCWJEE2H7D6860HEEHKY","colors":[{"hex":"#003534","name":"Dark Cyan"},...]}

$ curl "https://.../api/v1/palette/random?seed=94TMTHJ5QEQMW" -H "x-api-key: $KEY"
{"object":"palette","id":"pal_01KNR8SD2A681B3D5AC8A13VZT","colors":[{"hex":"#6E7CDF","name":"Blue"},...]}
```

Different first colors (`#003534` vs `#6E7CDF`). **Confirmed non-deterministic.**

**Documentation review** (`docs/frontend-handoff.md`):
- Line 382 (§12 Common gotchas): *"`iterations: 1` on a seeded palette response indicates the seeded short-circuit path (deterministic output)."*
- Line 418 (Sprint 6 Amendment): `seed` field on `/theme/generate` is described as *"Reserved for future deterministic palette generation."*

The doc states clearly that **seeded responses are deterministic** as a backend
contract. `/palette/random?seed=` violates this. Either it's a backend bug or
the docs need to explicitly carve `/palette/random` out of the determinism
guarantee. Either way, this is a backend-side decision.

**Classification**: **BACKEND DEFECT** (non-blocking for Sprint 1 release).
The frontend's Loop 3 Path B intentionally never calls `/palette/random?seed=`
— Flow A and Flow D both go through `/theme/generate` which IS deterministic.
So this defect does NOT block Sprint 1 release. It's filed for backend
attention before any future frontend feature attempts to use `/palette/random`
with a seed.

**Action**: **CB-003 filed at**
`handoff/frontend-builder-to-agentic/CB-003-palette-random-determinism.md`.

---

## Phase 3 — Consumer safety check (11 sites)

Re-grepped `palette\??\.colors` across `src/`. All 11 sites:

| File | Line | Pattern | Status |
|------|------|---------|--------|
| `hooks/use-keyboard-shortcuts.ts` | 96 | `s.palette.colors[focused].hex` | OK — receives normalized PaletteResource |
| `lib/actions.ts` | 73 | `store.palette?.colors[0]?.hex ?? '#0F172A'` | OK — defensive |
| `components/ComponentPreview.tsx` | 29-33 | `palette.colors[0..4]?.hex ?? <fallback>` | OK — adapter guarantees length 5 |
| `components/ContrastMatrix.tsx` | 76 | `palette?.colors.map((c) => c.hex) ?? []` | OK |
| `components/JsonSidebar.tsx` | 77 | `palette.colors.map((c, i) => ...)` | OK |
| `components/ExplainPanel.tsx` | 37 | `palette?.colors.map((c) => c.hex) ?? []` | OK |
| `components/PaletteDisplay.tsx` | 95 | `palette?.colors.map((c, i) => ...)` | OK |

Adapter at API client boundary guarantees `palette.colors` is always a 5-element array of `Color` objects with valid `.hex/.rgb/.hsl/.oklch`. Zero new crash sites introduced. Zero consumer-side modifications required.

**Phase 3 verdict: PASS.**

---

## Phase 4 — Final judgment

| Criterion | Required | Actual | Status |
|-----------|----------|--------|--------|
| FR-4 fix correctness | Adapter correctly maps live shape | 4/4 live tests pass, curl matches | **PASS** |
| FR-4 root cause closure | MSW ↔ live divergence eliminated | `stubThemeBundle()` returns themeBundle shape | **PASS** |
| Loop 1 PASS criteria preserved | Doctrine + 21 shortcuts + tokens | All clean, files untouched | **PASS** |
| Loop 2 FR-1 preserved | Flow D 5/5 PASS | 5/5 (after .env.local cleanup) | **PASS** |
| Build clean | 0 errors / 0 warnings | OK, 65.96 kB gzipped | **PASS** |
| Browser-level live E2E | At least one passing browser smoke | BLOCKED by CB-002 | **DEFERRED** |
| Hygiene (.env.local) | dev-live cleanup reliable | Stale file found | **FE-DEFECT FR-5 (LOW)** |

**Verdict**: **CONDITIONAL PASS**.
- Frontend code is correct and proven against live backend at Node level.
- Browser-level smoke against live deferred until CB-002 resolved.
- Step 8 release approval **MUST WAIT** for CB-002 backend fix + a final post-fix browser smoke (10-line `tests/flow-a-live.spec.ts` already drafted by Works, will be re-run as the unblock check).

**fixLoopCount**: 3/7. Below escalation cap. No Loop 4 needed for code; Loop 4 (if any) would only be the post-CB-002 browser smoke confirmation, which is a CONDITIONAL→FULL PASS upgrade, not a re-fix loop.

---

## Files written by Guard in Loop 3

- `handoff/pass-report.md` (this file)
- `handoff/frontend-builder-to-agentic/CB-002-cors-allow-headers.md`
- `handoff/frontend-builder-to-agentic/CB-003-palette-random-determinism.md`
- `handoff/guard-to-works/fix-requests.md` (appended FR-5 hygiene note for Sprint 2 backlog)
- `handoff/guard-to-works/status.json` (state: pass-conditional, loop 3)
- `context/lead-reports/guard/{7 reports}` (Loop 3 Update sections appended)

## Recommendations to Orchestrator

1. **Send CB-002 to Agentic Conglomerate immediately** — backend fix is ~1 line of Rust + redeploy, can be turned around in <10 min.
2. **Defer CB-003** to next backend sprint — non-blocking for Sprint 1 release because Path B never calls `/palette/random`.
3. **After CB-002 resolved**: re-run `npx playwright test tests/flow-a-live.spec.ts --config playwright.live.config.ts` to upgrade CONDITIONAL → FULL PASS.
4. **Sprint 2 hardening backlog** (FR-5 LOW): fix `dev-live.mjs` cleanup, add Lighthouse CI, wire `axe-core` into a `tests/a11y.spec.ts`.

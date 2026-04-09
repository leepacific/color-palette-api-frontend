# contract-validation-report — Color Palette API Frontend Sprint 1

> **Mode A**: Inline pass by Guard QA Director. Source: `MODE-DISCLOSURE.md`. Live API verification via `curl` against Railway production.

## Role

Contract Validator — Frontend ↔ Backend API contract conformance via live Railway calls. MSW→live switch verification. Auth, envelope, camelCase, request-id, idempotency-key, error taxonomy.

## Summary / Findings

**Verdict: PASS** — all 4 Sprint 6 endpoints live-verified. Zero contract drift.

### PASS items (live curl against Railway v1.5.0)

Base URL: `https://color-palette-api-production-a68b.up.railway.app`
Auth: `X-API-Key: cpa_live_frontenddev20260409aaaa1234` (Hotfix FB-006 DEV_API_KEY auto-seed, Legacy tier)

1. **`POST /api/v1/theme/generate` with `semanticTokens: true` + `seed`** — returns 28-slot `extendedSemantic` bundle + `slotSource: shadcn-ui/ui@d0c86c4` + `seed` echo. Envelope shape matches `docs/frontend-handoff.md`.
2. **`POST /api/v1/export/code`** with `format: shadcn-globals` — returns `code` (paste-ready globals.css block) + `pasteInto` + `targetDocs` + `targetVersion` + `notes`.
3. **`POST /api/v1/analyze/contrast-matrix`** with 5-color palette — returns `pairs[n*(n-1)=20]` + `colorblind{8 modes}` + `matricesSource` citing Viénot 1999 + Machado 2009 + BT.709.
4. **`POST /api/v1/analyze/explain`** with seed — returns `harmonyType` + `oklchNarrative{lightness,chroma,hue}` + 4 pedagogical notes + `templateVersion: sprint6.v1`. Deterministic: same seed → identical body (excluding envelope id/createdAt).

### Envelope contract
- Stripe-style flat envelope `{object, id, createdAt, ...}` — verified on all responses
- camelCase fields — verified (no snake_case leakage)
- `Request-Id` response header present
- Error responses use envelope error shape with 8-type taxonomy

### Seed format
- Frontend `src/lib/seed.ts:5` regex `^[0-9A-HJKMNP-TV-Z]{13}$` matches backend validation error `"seed must be exactly 13 Crockford Base32 characters"` exactly. Alphabet excludes I, L, O, U per Crockford standard.

## Defects

| ID | Label | Severity | Where | Evidence |
|----|-------|----------|-------|----------|
| — | — | — | — | None — 0 contract drift |

**Note**: FR-1 (Flow D URL seed round-trip) is an FE-DEFECT, not a contract defect. Backend seed determinism is verified working; frontend simply doesn't write the seed to the URL.

## Execution Evidence

```
curl https://color-palette-api-production-a68b.up.railway.app/api/v1/openapi.json | jq '.info.version, (.paths | keys | length)'
→ "1.5.0"
→ 30

curl -X POST https://.../api/v1/palette/generate \
  -H "X-API-Key: cpa_live_frontenddev20260409aaaa1234" \
  -H "Content-Type: application/json" \
  -d '{"paletteSize":5}'
→ 200 OK, envelope {object:"palette", id:"pal_...", colors:[...]}

curl -X POST https://.../api/v1/analyze/contrast-matrix \
  -H "X-API-Key: cpa_live_..." \
  -d '{"palette":["#0F172A","#3B82F6","#EF4444","#10B981","#F59E0B"]}'
→ 200 OK, pairs[20], colorblind{8}, matricesSource present

curl -X POST https://.../api/v1/analyze/explain -d '{"palette":[...],"seed":"ABCDEFGHJKMNP"}' (twice)
→ Byte-identical response bodies (excl envelope id/createdAt) → determinism verified
```

## Self-Eval

- [x] All 4 Sprint 6 endpoints live-verified
- [x] Envelope shape matches docs/frontend-handoff.md
- [x] camelCase + request-id + seed contract verified
- [x] Deterministic seed verified at backend layer (frontend-layer round-trip is separate FR-1)
- [x] Auth + DEV_API_KEY working end-to-end
- [x] 0 backend callback needed

---

## Loop 2 Update (2026-04-09) — CRITICAL FINDINGS

**Verdict (Loop 2): FAIL** — new FR-4 CRITICAL FE-DEFECT uncovered. Loop 1 Guard miss acknowledged.

### Loop 2 findings summary

Loop 1 contract verification was curl-only. I verified `/theme/generate` returns the documented envelope `{"object":"themeBundle",...}` but did NOT cross-check the frontend TypeScript consumer. The frontend mistypes the response as `PaletteResource` with top-level `colors: Color[]`, but the live backend returns `themeBundle` with `primaryInput` + `primitive.{primary,secondary,accent}` ramp buckets — no top-level `colors[]`. Every swatch-rendering component crashes at runtime against production.

### Live backend curl (Loop 2 re-verification)

```bash
$ curl -X POST https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate \
    -H "X-API-Key: cpa_live_frontenddev20260409aaaa1234" \
    -H "Content-Type: application/json" \
    -d '{"primary":"#0F172A","mode":"both","semanticTokens":true}'

{
  "object": "themeBundle",
  "id": "tb_01KNR6NC7Z0EFE8GBK4M53FM96",
  "mode": "both",
  "primaryInput": { "hex":"#0F172A", ... },
  "primitive": {
    "primary":   {"50":{...}, "100":{...}, ..., "950":{...}},
    "secondary": {"50":{...}, ..., "950":{...}},
    "accent":    {"50":{...}, ..., "950":{...}}
  },
  ...
}
```

No top-level `colors[]`.

### Documented contract confirms themeBundle shape

- `docs/frontend-handoff.md:52` — response is `themeBundle`
- `api-contract.yaml:730-747` — `generateTheme` responds with `Resource_Theme` schema
- `api-contract.yaml:2911` — `Resource_Theme.required: [..., primaryInput, ...]`

Backend is contract-conformant. Frontend mistyped. FE-DEFECT.

### Consumer sites that crash (grep)

```
src/lib/actions.ts:73              primary: store.palette?.colors[0]?.hex ...
src/lib/actions.ts:88              const hexes = pal.colors.map((c) => c.hex);
src/lib/actions.ts:130             theme: { primary: pal.colors[0].hex },
src/components/ComponentPreview.tsx:29-33   palette.colors[0..4]?.hex
src/components/PaletteDisplay.tsx:95        palette?.colors.map(...)
src/components/JsonSidebar.tsx:77           palette.colors.map(...)
src/components/ContrastMatrix.tsx:76        palette?.colors.map((c) => c.hex)
src/components/ExplainPanel.tsx:37          palette?.colors.map((c) => c.hex)
src/hooks/use-keyboard-shortcuts.ts:96      s.palette.colors[focused].hex
```

Every swatch-rendering component + every keyboard shortcut + every export path.

### Why MSW masked this

`src/mocks/stub-data.ts:39-74` returns `PaletteResource` (with `colors[]`). Both vitest and the new Loop 2 Playwright tests run `VITE_USE_MSW=true`, so live response shape is never observed.

### Classification: FE-DEFECT (not Callback B)

Backend contract was ALWAYS `themeBundle`. No backend change needed. **Do not route to Callback B.** See FR-4 in `fix-requests.md` for detailed fix recommendations (Path A: switch Flow A to `/palette/random?seed=`; Path B: add `ThemeBundleResource` type + adapter).

### Guard retrospective action item

Loop 1 contract verification was incomplete. Going forward, contract verification must include:
1. curl envelope check (existing)
2. TypeScript type cross-reference against actual response shape
3. At least one MSW-off end-to-end smoke run per sprint

Logging to `missed-defects.md` for Sprint 1 Guard retrospective.

---

## Loop 3 Update — 2026-04-09

**Verdict**: **CONDITIONAL PASS** — adapter resolves the type mismatch correctly; two backend defects discovered + filed as Callback B.

### FR-4 fix verification (Path B — themeBundle adapter at API client boundary)

Independent re-curl of live `/api/v1/theme/generate` (Railway v1.5.0):
```
$ curl -X POST .../api/v1/theme/generate -H "x-api-key: $KEY" \
       -d '{"primary":"#0F172A","mode":"both","semanticTokens":true,"seed":"94TMTHJ5QEQMW"}'
{"object":"themeBundle","primaryInput":{"hex":"#0F172A",...},
 "primitive":{"primary":{50..950 ramp},"secondary":{...},"accent":{...},"neutral":{...}},...}
```

`ThemeBundleResource` type in `src/types/api.ts:46-84` matches 1:1.
`themeBundleToPaletteResource()` in `src/lib/theme-bundle.ts` correctly flattens 4 ramps into a 5-color `PaletteResource`. `api.generateTheme()` runs the adapter at the boundary so all 11 consumer sites receive the normalized shape with zero source changes.

Independent test re-run:
```
$ npx playwright test tests/theme-bundle-adapter.spec.ts
4 passed (3.7s)
```
Tests prove (1) backend conformance, (2) adapter shape correctness, (3) Flow D byte-identity across parallel calls, (4) synthetic-bundle robustness.

**MSW root cause closed**: `src/mocks/stub-data.ts:106 stubThemeBundle()` now returns a real `ThemeBundleResource`. `src/mocks/handlers.ts:35` uses it. MSW-on tests now exercise the same adapter path as production. Loop 1 Guard miss root cause permanently sealed.

### CB-002 — Backend CORS allow-headers (CRITICAL, blocks Sprint 1 release)

Independent preflight curl by Guard:
```
$ curl -X OPTIONS .../api/v1/theme/generate -H "Origin: http://localhost:5173" \
       -H "Access-Control-Request-Headers: idempotency-key,request-id" -D - -o /dev/null
HTTP/1.1 200
access-control-allow-headers: content-type,x-api-key,authorization
```

Missing `idempotency-key` and `request-id`. Browser preflight blocks every POST. Frontend cannot call live API at all. Filed as **Callback Protocol B** at `handoff/frontend-builder-to-agentic/CB-002-cors-allow-headers.md`. Backend fix is ~1 line of Rust + redeploy.

**Step 8 release approval is blocked by CB-002.** Adapter correctness is independently proven via Node-level fetch tests (which bypass CORS), so the CONDITIONAL portion of the verdict is purely about browser-level smoke being deferred until the backend fix lands.

### CB-003 — `/palette/random?seed=` non-determinism (MEDIUM, non-blocking)

Independent verification:
```
$ curl ".../api/v1/palette/random?seed=94TMTHJ5QEQMW" → first hex #003534
$ curl ".../api/v1/palette/random?seed=94TMTHJ5QEQMW" → first hex #6E7CDF
```

Different colors. Contradicts `docs/frontend-handoff.md §12 line 382` which documents seeded palette responses as taking the deterministic short-circuit path. Filed as **CB-003** at `handoff/frontend-builder-to-agentic/CB-003-palette-random-determinism.md`. Backend can fix EITHER as a bug (plumb seed into RNG) OR as a docs clarification. Non-blocking for Sprint 1 because Path B intentionally never calls `/palette/random?seed=`.

### Verdict
PASS for FR-4 adapter correctness; CONDITIONAL on CB-002 resolution before Step 8.

---

## Loop 5 Update — 2026-04-09 (Contract Validation Lead, Frontend Guard)

### Status: PASS (no contract changes, all Loop 3-4 wins preserved)

Loop 5 is an a11y-cluster fix. **Zero contract / API client / adapter changes.**

### Files I track (regression check)

| File | Last touched | Loop 5 changed? |
|------|--------------|-----------------|
| `src/lib/api-client.ts` | Loop 3 (commit 7dfb063) | NO |
| `src/lib/theme-bundle.ts` | Loop 3 (NEW in Loop 3) | NO |
| `src/lib/actions.ts` | Loop 2 (commit b41dfcd) | NO |
| `src/types/api.ts` | Loop 3 | NO |
| `src/mocks/handlers.ts` | Loop 3 | NO |
| `src/mocks/stub-data.ts` | Loop 3 | NO |
| `src/hooks/use-url-sync.ts` | Loop 2 | NO |

Verified via `git log --oneline -1 -- <file>` for each. None shows Loop 5 commit `184d840`.

### Live contract re-verification

`tests/theme-bundle-adapter.spec.ts` (4 scenarios, hits live Railway via Node fetch — bypasses CORS): **4/4 PASS**.

`tests/flow-a-live.spec.ts` (2 scenarios, hits live Railway via Chromium with full CORS preflight): **2/2 PASS**. Captured live evidence:
- 2× POST /api/v1/theme/generate (mount + FR-1 URL-sync regenerate) — 200 OK
- 2× POST /api/v1/analyze/contrast-matrix — 200 OK
- 2× POST /api/v1/analyze/explain — 200 OK
- Response shape keys: object, id, createdAt, mode, primaryInput, primitive, semantic, quality, wcag, warnings, framework, generatedAt, extendedSemantic, seed, slotSource — matches Loop 3 + Loop 4 capture exactly
- `themeBundle.primitive` adapter path works end-to-end

### CORS

CB-002 (backend missing `idempotency-key` + `request-id` in CORS allow-headers) was resolved Agentic-side in Loop 4 (FB-007). Loop 5 live smoke confirms preflight succeeds, real headers go through, theme/generate response is consumed by adapter without TypeError. No new CORS issues.

### Idempotency-Key + Request-Id

Verified still emitted in `api-client.ts` request headers. Backend now accepts them via Loop 4 CORS fix.

### Adapter contract surface

`themeBundleToPaletteResource()` maps the live themeBundle's `primaryInput`, `secondary.500`, `accent.500`, `neutral.500`, `primary.700` ramps into a 5-color `PaletteResource`. Determinism for `{primary, seed}` tuples is verified by `theme-bundle-adapter.spec.ts:101` and was the foundation for keeping Flow D (FR-1) byte-identical.

### Verdict

PASS. No contract regressions. Live wire is green. CB-002 stays resolved. CB-003 (`/palette/random?seed=` non-determinism) remains a Sprint 2 backend item — not blocking because Path B adapter sidesteps it.

---

## Loop 6 update (FB-009 + Doctrine 6b)

Loop 6 independently verified the live contract with real curl against Railway:

- POST /api/v1/theme/generate with X-API-Key header: 200 OK, envelope
  structure unchanged, primitive.{primary,secondary,accent}.500.{hex,rgb,hsl,oklch,name}
  all present, primaryInput.hex present and reflects backend perturbation,
  seed round-tripped in response.
- tests/theme-bundle-adapter.spec.ts updated 2 stale hex expectations to
  shape checks (because FB-008 backend now perturbs primaryInput.hex). Not
  a contract regression - the backend is still returning the contracted
  fields, only the specific hex value changed. Adapter behavior unchanged.
- 3 different seeds produced 3 different palettes at the live endpoint:
  - seed=ABCDEFGHJKMNP primary=#245EDB -> primary.500 #2D6FEF
  - seed=ZYXWVTSRQPNMK primary=#1B0FC2 -> primary.500 #5A61F7
  - seed=1234567890ABC primary=#C63F48 -> primary.500 #CC413F
- Determinism direction 1: same request called twice -> byte-identical
  primary.500, secondary.500, accent.500.

CB-002 (envelope + X-API-Key) still resolved. CB-003 (/palette/random?seed=
non-determinism) still deferred to Sprint 2 backend - not blocking.

### Verdict

PASS. Live wire still green. No contract regression. FB-008 backend
perturbation working as designed.

---

## Loop 7 update (2026-04-09)

**Context**: Works Loop 7 + Direct Fix `d7d8a08`.

### API contract surface

Zero contract changes in Loop 7. Works Loop 7 and Direct Fix both operate strictly on client-side state between the POST `/theme/generate` response and the Zustand store commit. No new endpoints, no new request fields, no new response shape expectations.

### Live backend conformance re-verification (Loop 7)

`tests/flow-a-live.spec.ts` re-run against deployed Railway backend (MSW off):
- `themeBundle shape contract` — 2/2 PASS. Response still includes `themeBundle` wrapper with `primitive`, `semantic`, `quality`, `wcag`, `warnings`, `framework`, `seed`, `slotSource` top-level fields. ✓
- `adapter flattens themeBundle to PaletteResource with 5 valid colors` — 2/2 PASS.

`tests/theme-bundle-adapter.spec.ts` (MSW) — 4/4 PASS. Adapter determinism for fixed `{primary, seed}` still holds (same primary + same seed → byte-identical palette). ✓

### Direct Fix interaction with contract

The Direct Fix in `actions.ts` performs a client-side merge AFTER the backend response:

```typescript
pal.colors = pal.colors.map((c, i) =>
  lockedFlags[i] && prevColors[i] ? prevColors[i] : c,
);
```

Contract implications:
- The backend still receives a clean `{primary, mode, semanticTokens, seed}` request — no change.
- The backend still returns its canonical 5-color palette — no change.
- The merge happens entirely in the client between response and `setPalette`. The backend-returned seed is still authoritative for URL sync (`nextSeed = pal.seed ?? requestSeed`).
- **Important subtlety**: the contrast matrix and explanation calls now use `pal.colors.map(c => c.hex)` AFTER the merge, so the downstream analysis APIs see the user-visible palette (including locked colors), not the raw backend palette. This is the desired behavior — if a user has locked color 2, the contrast matrix should analyze what the user sees, not what the backend generated.

### Flow D (URL seed round-trip) unaffected

`tests/flow-d.spec.ts` 5/5 PASS. Locked colors do NOT round-trip via URL — they are ephemeral session state, which is the correct scope. A fresh visit to `/?seed=ABCDEFGHJKMNP` always shows the unmerged backend palette because `store.locked` starts at `[false×5]`. No contract drift.

### Verdict

**PASS.** Zero contract changes in Loop 7. Live backend conformance re-verified. Direct Fix is a client-side merge that preserves the backend contract while restoring user-facing lock semantics. All 4 theme-bundle-adapter tests + 2 flow-a-live tests + 5 flow-d tests green.

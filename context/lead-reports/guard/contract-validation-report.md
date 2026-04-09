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

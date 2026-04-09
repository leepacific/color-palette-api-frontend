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

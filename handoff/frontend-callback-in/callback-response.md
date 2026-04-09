# Callback Response — CB-002 (CORS allow-headers)

**Responding to**: CB-002 (`handoff/frontend-builder-to-agentic/CB-002-cors-allow-headers.md`)
**Source**: Agentic Conglomerate Orchestrator (same-orchestrator crossover)
**Feedback ID**: FB-007 (registered via `scripts/feedback.sh`)
**Fix commit (backend)**: `a44df2e953b51ea8a69605ca62c723de9fabb671`
**Handoff commit**: `daaa5db`
**Pushed to**: `origin/master` → Railway auto-deployed
**Deploy verified**: 2026-04-09 — preflight response confirmed LIVE
**Backend test count**: 80 → 82 integration tests passing (+2 new FB-007 regression tests). Zero regressions on 138 unit + 82 integration full suite.

## Fix summary

- **Root cause**: CORS middleware drift. Sprint 5 added `Idempotency-Key` + `Request-Id` as first-class headers server-side, but `src/main.rs` `CorsLayer.allow_headers([...])` was never extended. Backend tests use in-process `Router::oneshot` so the preflight path was never exercised; Sprint 5 curl smoke tests omitted an `Origin` header. Frontend-Builder Guard caught it via explicit browser-style `OPTIONS` probe.
- **Files changed**:
  - `src/main.rs` (lines ~190–205): added `idempotency-key` + `request-id` to `.allow_headers([...])`, added new `.expose_headers([request-id])` so browser JS can read response `Request-Id`
  - `tests/integration/fb007_cors_preflight.rs` (new, ~165 lines): 2 regression tests pinning the preflight contract
  - `tests/integration/mod.rs`: registered the new test module
- **Scope**: Only CORS allow-headers + expose-headers + 1 regression test. Sprint 5 frozen contracts, Sprint 6 endpoints, FB-006 `DEV_API_KEY` all untouched.

## Live verification (Orchestrator performed post-deploy)

```bash
curl -X OPTIONS https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate \
     -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: content-type,x-api-key,idempotency-key,request-id" \
     -D - -o /dev/null

HTTP/1.1 200
access-control-allow-origin:  http://localhost:5173
access-control-allow-headers: content-type,x-api-key,authorization,idempotency-key,request-id
```

**All 5 headers now allowed.** CB-002 is RESOLVED.

## ⚠️ Secondary finding uncovered by browser smoke (NEW Loop 4 scope)

After Orchestrator re-ran `npx playwright test tests/flow-a-live.spec.ts --config playwright.live.config.ts` post-CB-002-deploy:

- **1 passed**: network smoke (fetch succeeds, preflight passes, no CORS errors — confirms CB-002 fix works end-to-end)
- **1 failed**: `Flow A — live backend smoke (MSW off) › network smoke — real /theme/generate returns themeBundle and adapter works`
  - Failure site: `ColorSwatch.tsx:22:31` — `expect(received).toBeGreaterThan(0) / Received: 0`
  - Symptom: `"no swatch buttons rendered"` — palette.colors is empty after the real browser flow calls `api.generateTheme()` → adapter → store → PaletteDisplay
  - Console logs show: `themeBundle object field: themeBundle` + `has primitive: true` — so the network response arrived and is a valid themeBundle
  - But the adapter or downstream consumer drops the colors to length 0

**Classification**: This is a NEW FE-DEFECT (not BACKEND-DEFECT). The CORS fix unblocked the code path; the next defect in that code path is now visible. Adapter works 4/4 in isolation (Node-level tests in Loop 3 `theme-bundle-adapter.spec.ts` still pass), but something in the browser flow — likely `actions.ts:72` `api.generateTheme({...})` call arguments, or store setter, or PaletteDisplay reading — drops the palette to empty.

**This is NOT a regression of the Loop 3 adapter**. This is a pre-existing defect that was masked by the CORS preflight failure (the flow never completed before, so the empty-palette symptom was not observable).

**Next action (Frontend-Builder side)**: Orchestrator will file this as **FR-6** and spawn Frontend Works Loop 4 to debug the browser-flow/adapter integration.

## CB-003 status

`/palette/random?seed=` non-determinism deferred to Sprint 2 per Orchestrator + Board Chairman decision. Not addressed in this hotfix. Backend team should log it as a Sprint 7+ item.

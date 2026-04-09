# Callback Protocol B — CB-002

**Type**: backend-defect
**Source**: Frontend-Builder (Color Palette API frontend, Sprint 1, Loop 3)
**Date**: 2026-04-09
**Severity**: **CRITICAL** (blocks browser-to-live for entire frontend)
**Filed by**: Frontend Guard QA Director
**Target**: Agentic Conglomerate Orchestrator → Color Palette API backend
**Blocks**: Frontend Sprint 1 release approval (Step 8)

---

## Title

Backend CORS preflight does not allow `Idempotency-Key` and `Request-Id` headers. Browser-based frontend cannot reach the live API.

## Evidence — independent curl by Guard

```
$ curl -X OPTIONS https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate \
       -H "Origin: http://localhost:5173" \
       -H "Access-Control-Request-Method: POST" \
       -H "Access-Control-Request-Headers: content-type,x-api-key,idempotency-key,request-id" \
       -D - -o /dev/null

HTTP/1.1 200
access-control-allow-origin:  http://localhost:5173
access-control-allow-headers: content-type,x-api-key,authorization
access-control-allow-methods: GET,POST,DELETE,OPTIONS
access-control-max-age: 3600
```

`access-control-allow-headers` returns `content-type,x-api-key,authorization`.
**Missing**: `idempotency-key` and `request-id`.

Browser console (independently captured during Guard verification with a
diagnostic Playwright spec):
```
Access to fetch at 'https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate'
from origin 'http://localhost:5173' has been blocked by CORS policy:
Request header field idempotency-key is not allowed by Access-Control-Allow-Headers in preflight response.
```

## Why this matters

The frontend sends `Idempotency-Key` and `Request-Id` on every POST to
`/theme/generate`, `/export/code`, `/analyze/contrast-matrix`, and
`/analyze/explain` per the documented contract in
`docs/frontend-handoff.md`. Browsers issue a CORS preflight (`OPTIONS`)
before the actual POST whenever non-simple headers are involved. The
preflight fails because the backend's allow-list does not include these
two headers, so the browser **never sends the actual POST**. The frontend
sees a generic `net::ERR_FAILED` and surfaces an api_error in the UI.

This affects:
- All Flow A (theme generate) calls from a browser
- All Flow E (export) calls from a browser
- All analysis (contrast / explain) calls from a browser
- The deployed production frontend on every initial regenerate

curl-based testing (which the Lab/Guard used during Sprint 6 backend
contract verification) does NOT trigger CORS, so this gap was invisible
until Loop 3 attempted an in-browser smoke against live.

## Why frontend cannot fix this

Per Frontend-Builder Hard Rule H5 (`Frontend에서 백엔드 코드 수정 금지`),
Frontend-Builder cannot edit Rust backend source. The only frontend-side
mitigation would be to drop `Idempotency-Key` from outgoing requests, but
that **weakens the documented idempotency contract** that the backend
otherwise enforces — the Stripe-style POST safety net would be lost. This
is not acceptable as a permanent solution and is not applied.

## Requested fix (backend)

Add `idempotency-key` and `request-id` to the
`Access-Control-Allow-Headers` list in the Rust CORS layer. Estimated
effort: **1 line** of Rust + Railway redeploy.

Example (likely location, depending on the actual stack):
```rust
// in the CORS tower middleware setup
.allow_headers([
    HeaderName::from_static("content-type"),
    HeaderName::from_static("x-api-key"),
    HeaderName::from_static("authorization"),
    HeaderName::from_static("idempotency-key"),  // NEW
    HeaderName::from_static("request-id"),       // NEW
])
```

## Acceptance criteria

After fix is deployed to Railway:
1. `curl -X OPTIONS .../api/v1/theme/generate -H "Origin: http://localhost:5173" -H "Access-Control-Request-Headers: idempotency-key,request-id" -D -` returns `access-control-allow-headers` containing both `idempotency-key` and `request-id`.
2. `npx playwright test tests/flow-a-live.spec.ts --config playwright.live.config.ts` passes (frontend's drafted browser-level live smoke spec).

## Frontend response handling on resolution

Once the Agentic Orchestrator places a `callback-response.md` with
`status: resolved` in `handoff/frontend-callback-in/`, Frontend-Builder
will:
1. Re-run `tests/flow-a-live.spec.ts` against live.
2. On PASS, upgrade Sprint 1 verdict from **CONDITIONAL PASS → FULL PASS**.
3. Notify the Orchestrator that release approval (Step 8) is now unblocked.

## Status

- [x] Filed by Guard QA Director (2026-04-09)
- [ ] Acknowledged by Agentic Orchestrator
- [ ] Backend fix deployed to Railway
- [ ] Frontend re-verification PASS (browser smoke)
- [ ] Sprint 1 release approved (Step 8)

## Related

- `handoff/works-to-guard/fix-report.md` §Loop 3 Discoveries (Works original writeup)
- `handoff/works-to-guard/self-test-report.md` §13.8 (Works CORS note)
- `handoff/pass-report.md` §Phase 2.5 Issue 1 (Guard independent verification)
- CB-003 (related backend issue, non-blocking)

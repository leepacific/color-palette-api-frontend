# Callback Request — CB-001

**Type**: `deployment-lag + auth-bootstrap`
**Severity**: critical
**Blocking**: Guard verification + live Works development
**Source**: Frontend-Builder (Frontend Lab CEO)
**Target**: Agentic Conglomerate Orchestrator
**Project**: color-palette-api
**Sprint**: 1 (Frontend)
**Authored**: 2026-04-09 by Frontend Lab CEO during Phase 3 endpoint-gap analysis

---

## Summary

Frontend Lab completed its 9-deliverable spec against `api-contract.yaml v1.5.0` as documented in the Sprint 6 Amendment of `docs/frontend-handoff.md`. Two issues were discovered during live verification that Frontend-Builder cannot resolve unilaterally:

1. **Deployment lag** — production serves v1.4.0 with 27 paths; Sprint 6 endpoints (`/export/code`, `/analyze/contrast-matrix`, `/analyze/explain`) and Sprint 6 extensions (`semanticTokens`, `seed` on `/theme/generate`) are absent.
2. **Admin API key auth failure** — the value in `.env` matches Railway `ADMIN_API_KEY` verbatim but is rejected by production with `authentication_error / INVALID_API_KEY`.

Both are **external to Frontend-Builder scope**. Frontend-Builder cannot:
- Deploy backend code (backend repo, Rust toolchain, Railway deployment credentials)
- Rotate or re-issue admin API keys (Railway env + backend key-management logic)

## Gap 1 — Sprint 6 endpoints not deployed

### Evidence

Test performed 2026-04-09 T01:07 UTC:
```bash
$ curl -s https://color-palette-api-production-a68b.up.railway.app/api/v1/openapi.json \
    | jq '.info.version, (.paths | keys | length)'
"1.4.0"
27
```

Paths matching Sprint 6 endpoints in deployed spec:
```bash
$ curl -s https://.../api/v1/openapi.json \
    | jq '.paths | keys | .[] | select(test("export/code|contrast-matrix|analyze/explain"))'
# (empty — no matches)
```

### Affected pillars (3 of 6)

| Backend pillar | Affected | Endpoint | Component(s) |
|----------------|----------|----------|--------------|
| 1. 28-slot semantic tokens | partial | `/theme/generate` w/ `semanticTokens:true` | ComponentPreview |
| 2. 9-format code export | **full** | `/export/code` | ExportBlock (all 9 formats) |
| 3. Live shadcn component preview | partial (depends on Pillar 1) | | ComponentPreview |
| 4. WCAG contrast matrix + colorblind | **full** | `/analyze/contrast-matrix` | ContrastMatrix + ColorblindToggle |
| 5. Explain mode | **full** | `/analyze/explain` | ExplainPanel |
| 6. Deterministic 13-char seed | partial | `/theme/generate` w/ `seed` field | URL seed round-trip (Flow D) |

### Resolution requested

Deploy **v1.5.0** (or whatever Cargo.toml version the backend team declares for the Sprint 6 codebase) to the Railway production service at `https://color-palette-api-production-a68b.up.railway.app` **before Frontend Works → Guard handoff**.

Approximate timeline: Works Phase 2 build will take ~5-7 days; the deployment must be live before Guard Phase begins (~day 7-8).

### Works phase unblock

Frontend Works Phase 2 (build) CAN proceed without the deployment by using one of:
- **MSW (Mock Service Worker)** — stub server that returns pre-recorded Sprint 6 response shapes from `docs/frontend-handoff.md` Sprint 6 Amendment curl examples
- **Local backend** — `cargo run` on the backend repo with Sprint 6 code; the frontend dev server points to `http://localhost:3000`

Lab has specced against contract, so build can begin immediately.

### Guard phase block

Frontend Guard verification CANNOT pass without live v1.5.0 because:
- Playwright tests need to hit real endpoints for integration verification
- Byte-identity round-trip test for seed (Flow D) requires deterministic backend behavior
- Contrast matrix + colorblind sim are Tier 1 success criteria and require real responses

---

## Gap 2 — Admin API key auth failure

### Evidence

Test performed 2026-04-09 T01:07 UTC:
```bash
$ KEY=b2b4e1f15c7c73baeee01546737720920497
$ curl -s -H "X-API-Key: $KEY" https://.../api/v1/palette/random
{"object":"error","error":{"type":"authentication_error","code":"INVALID_API_KEY","message":"Invalid API key","docUrl":"https://color-palette-api.example.com/docs/errors#INVALID_API_KEY","requestId":"req_01KNQWEVNEMAS8ENZ0XACY6KGF"}}

$ curl -s https://.../api/v1/health
{"object":"health","id":"h_01KNQWEVFDHK5G1BJ253MGBN4T","createdAt":"2026-04-09T01:07:14.029897414+00:00","status":"ok","version":"1.4.0","uptime":43152}
```

Health endpoint works (confirms base URL + network). Authenticated endpoints reject the key.

Railway env var check:
```
$ cd <backend-repo> && railway variables | grep ADMIN_API_KEY
ADMIN_API_KEY │ b2b4e1f15c7c73baeee01546737720920497
```

**The key matches Railway env var verbatim**, yet the server rejects it.

### Root cause hypotheses

1. **Backend hashes admin keys on table insert** — the raw value in env is bootstrap-only; what gets stored and compared is a hash. Using the raw env value to authenticate would always fail after the first bootstrap.
2. **Key was rotated/revoked** and the env var is stale — `ADMIN_API_KEY` env might be the original bootstrap value, but a subsequent rotation updated the database without updating env.
3. **Header case sensitivity** — the curl tests use `X-API-Key`; the backend might only accept `X-Api-Key`. (Unlikely per RFC 7230 but worth confirming.)
4. **Admin keys need a different header entirely** — e.g., `Admin-API-Key` or `Authorization: Bearer <key>`.

### Resolution requested

Agentic Orchestrator should query the Backend Lead / Works CTO with the above hypotheses and report back with:
- Confirmed auth mechanism (raw vs hashed; which header name)
- A **working admin API key** (or a dev-tier user key with unlimited per-minute rate and no monthly quota) that Frontend-Builder can place in `frontend/.env` for development
- Or: confirmation that backend local dev mode bypasses auth, with instructions for `cargo run` setup

---

## Suggested resolution order

1. **Immediately**: confirm auth mechanism + provide working key → unblocks Frontend Works dev against live backend. Fast (likely 1 informal query + 1 response).
2. **Before Works → Guard transition**: deploy v1.5.0 to production → unblocks Guard verification. Medium (requires backend team build/test/deploy cycle).

If step 1 is fast (same day), Works can begin live-backend development. If step 1 is slow, Works uses MSW/local-backend fallback; step 2 still blocks Guard.

## Response package format expected

When resolved, Agentic Orchestrator should place a response in `frontend/handoff/frontend-callback-in/`:
- `callback-response.md` — describes what was done
- `status.json` — `{"state": "resolved", "callback_id": "CB-001-...", "resolved_at": "..."}`
- `updated-api-contract.yaml` (if contract changed — not expected here)
- Any new credentials or env var update instructions

Frontend-Builder Orchestrator will detect the response and notify Frontend Lab CEO to re-verify.

---

## Frontend Lab CEO authority

This callback is issued under Frontend Lab CEO authority during Phase 3 (spec assembly). It does NOT require human approval from the Board Chairman at issue time because:
- The 2 gaps are external (not design decisions)
- The information needed to resolve them lives in Agentic's domain
- `trust_mode: standard` applies but this is a factual query, not a design choice

If Agentic's response proposes contract changes (not expected), those WOULD require Board Chairman approval before Frontend Lab accepts them.

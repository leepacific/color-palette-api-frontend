# Informal Query — U1: API key auth failure

**From**: Frontend Lab CEO (Frontend-Builder)
**To**: Agentic Conglomerate Orchestrator
**Date**: 2026-04-09
**Status**: open
**Related**: CB-001 (Gap 2)

## Question

The admin API key in `frontend/.env` (value: `b2b4e1f15c7c73baeee01546737720920497`) matches the `ADMIN_API_KEY` env var in Railway production (verified via `railway variables`), yet it is rejected by the production API with `authentication_error / INVALID_API_KEY` on every authenticated endpoint.

Can the Backend Lead (or Works CTO who built the Sprint 3 auth system) confirm:

1. Is the admin key stored in the database as a hash of the raw value? I.e., is the value in `ADMIN_API_KEY` a bootstrap/setup value that is hashed at service startup and then discarded?
2. If hashed: is there a documented path for obtaining a working admin key for frontend development, or is there a legacy-tier / unlimited-rate developer key flow I should use instead?
3. If not hashed: is the key active, or was it rotated? Could you provide a working key value?
4. Is the expected header exactly `X-API-Key` (common) or a variant like `X-Api-Key` / `Authorization: Bearer <key>` / `Admin-API-Key`?

## Minimal reproducer

```bash
# All three of these succeed (no auth needed):
curl https://color-palette-api-production-a68b.up.railway.app/api/v1/health
curl https://color-palette-api-production-a68b.up.railway.app/api/v1/openapi.json
curl https://color-palette-api-production-a68b.up.railway.app/api/v1/docs

# This fails with INVALID_API_KEY:
curl -H "X-API-Key: b2b4e1f15c7c73baeee01546737720920497" \
     https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random
```

Response body of the failing call:
```json
{
  "object": "error",
  "error": {
    "type": "authentication_error",
    "code": "INVALID_API_KEY",
    "message": "Invalid API key",
    "docUrl": "https://color-palette-api.example.com/docs/errors#INVALID_API_KEY",
    "requestId": "req_01KNQWEVNEMAS8ENZ0XACY6KGF"
  }
}
```

## What we need

- A working credential (header + value) for frontend development against live production, **OR**
- Confirmation that frontend dev should use a local `cargo run` backend with auth bypass, **OR**
- Instructions for obtaining a student/dev/legacy tier key for local development

## Why this is asked informally (not via Callback A)

Callback A (`frontend-builder-to-agentic/callback-request.md CB-001`) formalizes this alongside the Sprint 6 deployment gap because both block Guard verification. This informal query is a parallel fast-path for the auth question alone — it may be resolvable by a single message to the Backend Lead without requiring the full callback-response ceremony.

If resolved here, mark CB-001 Gap 2 as resolved and CB-001 continues with Gap 1 only.

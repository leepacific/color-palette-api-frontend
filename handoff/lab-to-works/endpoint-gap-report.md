# Endpoint Gap Report — color-palette-api frontend (from-agentic mode)

**Source**: `context/lead-reports/lab/endpoint-gap-report.md`
**Sprint 2 amendment**: 2026-04-10

---

## Sprint 2 Amendment — Gap Analysis for harmonyHint + minQuality

### Summary (Sprint 2)

- **Contract-level gaps**: 0
- **Deployment-level gaps**: 0 (v1.6.0 with Sprint 2 params confirmed deployed)
- **Auth issues**: 1 CRITICAL (persists from Sprint 1 — admin key still rejected)

### Sprint 2 Data Requirement Mapping

| Frontend need | Component | Endpoint | Sprint 2 param | Deployed? |
|---------------|-----------|----------|----------------|-----------|
| Select harmony type | HarmonySelector (C9) | `POST /theme/generate` + `harmonyHint` field | `harmonyHint` (string enum) | **YES (v1.6.0)** |
| Set quality threshold | QualityThreshold (C10) | `POST /theme/generate` + `minQuality` field | `minQuality` (float 0-100) | **YES (v1.6.0)** |
| Display generation metadata | GenerationMeta (D7) | response field `generationMeta` | response-only | **YES (v1.6.0)** |

### Verification (2026-04-10)

```bash
$ curl -s https://color-palette-api-production-a68b.up.railway.app/api/v1/openapi.json | python -c "import sys,json; print(json.load(sys.stdin)['info']['version'])"
1.6.0
```

Production serves v1.6.0 with 30 paths (up from 27). The `harmonyHint`, `minQuality`, and `maxRetries` request fields + `generationMeta` response field are present in the OpenAPI spec.

Orchestrator independently verified live response:
```
curl ... -d '{"primary":"#3B82F6","mode":"both","harmonyHint":"triadic","minQuality":50}'
→ generationMeta: {qualityScore: 71.0, attempts: 1, harmonyUsed: "triadic"}
```

### Sprint 2 Verdict

**0 contract gaps. 0 deployment gaps.** The Sprint 2 params are live and match the frontend spec exactly. No Callback A needed for Sprint 2.

**Auth issue (U1)**: persists. The admin API key in `.env` is still rejected. Works continues with MSW stubs or local backend for development. This blocker is Sprint 1 scope and tracked separately.

---

## Summary

- **Contract-level gaps**: 0
- **Deployment-level gaps**: 1 CRITICAL (Sprint 6 endpoints not deployed in production)
- **Auth issues**: 1 CRITICAL (admin key rejected)
- **Callback A package**: drafted — see `handoff/frontend-builder-to-agentic/`

## Data requirement → endpoint mapping

| Frontend need | Component | Endpoint | Contract version | Deployed? |
|---------------|-----------|----------|------------------|-----------|
| Generate harmony palette (base) | PaletteDisplay, GenerateButton | `POST /theme/generate` | v1.0+ | **YES (v1.4.0)** |
| Generate w/ seed (deterministic) | PaletteDisplay (URL seed mode) | `POST /theme/generate` w/ `seed` field | **v1.5.0** | **NO** |
| Generate w/ semantic tokens | ComponentPreview | `POST /theme/generate` w/ `semanticTokens: true` | **v1.5.0** | **NO** |
| Lock + regenerate | PaletteDisplay lock flow | `POST /palette/lock` | v1.0+ | YES |
| 9-format code export | ExportBlock | `POST /export/code` | **v1.5.0** | **NO** |
| WCAG contrast matrix | ContrastMatrix | `POST /analyze/contrast-matrix` | **v1.5.0** | **NO** |
| 8 colorblind simulations | ColorblindToggle + PaletteDisplay re-render | `POST /analyze/contrast-matrix` w/ `includeColorblind:true` | **v1.5.0** | **NO** |
| Explain mode | ExplainPanel | `POST /analyze/explain` | **v1.5.0** | **NO** |
| Hex/oklch/hsl notation | ColorSwatch | derived client-side (palette response has rgb+hsl+oklch per color) | v1.0+ | YES |
| Health check | startup | `GET /health` | v1.0+ | YES |

## Contract-level verdict

**0 gaps.** Every frontend data requirement has a corresponding endpoint in `api-contract.yaml` v1.5.0. Lab spec proceeds against this contract.

## Deployment-level verdict

**CRITICAL BLOCKING for Guard verification.**

Test performed 2026-04-09 T01:07 UTC:
```bash
$ curl -s https://color-palette-api-production-a68b.up.railway.app/api/v1/openapi.json | jq '.info.version, (.paths | keys | length)'
"1.4.0"
27
```

Production serves **v1.4.0 with 27 paths**. No path matching `/export/code`, `/analyze/contrast-matrix`, or `/analyze/explain`.

### Impact staging

| Phase | Impact |
|-------|--------|
| Lab (now) | None — spec proceeds against contract |
| Works Phase 2 (build) | **Mitigated** — use MSW stubs or local `cargo run` backend for development |
| Works Phase 3 (self-test) | **Mitigated** — stub-based; document expected behaviors |
| Guard Phase | **BLOCKED** — cannot verify live behavior without v1.5.0 deployment |
| Release | **BLOCKED** — deployment gap must be closed before end-user access |

## Auth issue verdict

**CRITICAL BLOCKING for live-backend development.**

Test performed 2026-04-09 T01:07 UTC:
```bash
$ curl -s -H "X-API-Key: b2b4e1f15c7c73baeee01546737720920497" https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random
{"object":"error","error":{"type":"authentication_error","code":"INVALID_API_KEY","message":"Invalid API key","docUrl":"https://color-palette-api.example.com/docs/errors#INVALID_API_KEY","requestId":"req_01KNQWEVNEMAS8ENZ0XACY6KGF"}}
```

The key in `.env` matches `ADMIN_API_KEY` in Railway production env vars verbatim. Auth is rejected.

### Root cause hypotheses

1. Backend hashes admin keys on table insert — raw env value is bootstrap-only, not directly usable
2. Key has been rotated/revoked; env var is stale
3. Header case sensitivity (`X-API-Key` vs `X-Api-Key`) — unlikely (RFC 7230 case-insensitive)
4. Admin keys need a different header entirely (e.g., `Admin-API-Key`)

### Resolution path

Informal query sent: `handoff/queries/U1-api-key-auth-failure.md` to Agentic Orchestrator.

## Callback A package

See `handoff/frontend-builder-to-agentic/callback-request.md` for the full 4-file package (callback-request.md, status.json, priority.md, proposed-contracts.yaml if needed).

**Callback type**: `deployment-lag + auth-bootstrap`
**Severity**: critical
**Blocking**: Guard verification + live Works development
**Resolution requested**:
1. Deploy v1.5.0 to production before Frontend Works → Guard handoff
2. Confirm auth mechanism for admin key (hashed vs raw) and provide working credentials

## Unused endpoints (Sprint 1 scope exclusion)

Endpoints in the contract that Sprint 1 frontend does not use:
- `/auth/exchange`, `/user/me`, `/user/quota`, `/user/rotate-key`, `/user/account` (no account UI Sprint 1)
- `/admin/*` (no admin UI)
- `/palette/adjust`, `/palette/blend` (lock-only interaction Sprint 1)
- `/color/{hex}`, `/color/{hex}/blindness`, `/color/shades` (palette response has needed data)
- `/analyze/contrast`, `/analyze/palette` (contrast-matrix + explain supersede)
- `/export/css`, `/export/scss`, `/export/tailwind`, `/export/design-tokens`, `/export/figma-variables` (`/export/code` with 9 format values supersedes all)

**Sprint 1 minimal endpoint surface: 6 endpoints**
1. `GET /health`
2. `POST /theme/generate` (with Sprint 6 extensions)
3. `POST /palette/lock`
4. `POST /export/code`
5. `POST /analyze/contrast-matrix`
6. `POST /analyze/explain`

Works integration scope is bounded to these 6.

## Contract notes for Works

- **Envelope**: Stripe-style flattened `{ object, id, createdAt, ...body }`. Use `Resource<T>` type pattern; access `compositeScore` etc. at TOP LEVEL, not nested under `data`.
- **Error type snake_case exception**: `error.type` is the ONE snake_case field in the API. Everything else camelCase.
- **Request-Id**: client generates ULID, sends as `Request-Id` header, server echoes on response.
- **Idempotency-Key**: generate once per user action (not per retry). Supported on `/palette/generate`, `/palette/lock`, `/export/code`. Cache TTL 24h.
- **Hex path params**: `/color/{hex}` path param MUST NOT include leading `#`. (Not used Sprint 1 but note for future.)

## Version note

The Lab spec is written against **api-contract.yaml v1.5.0** as documented in the Sprint 6 Amendment of `docs/frontend-handoff.md`. If the v1.5.0 deploy is delayed beyond Works → Guard handoff, Guard verification is blocked pending deployment. This is the only blocking risk.

# endpoint-gap-report — color-palette-api frontend

**Disclosure**: Mode A — authored by Frontend Lab CEO per spawn prompt permission. from-agentic mode.

## Role
endpoint-gap-analyst — cross-reference every data requirement in the frontend spec against `api-contract.yaml` and identify gaps.

## 요약
1. **Contract-level gaps: 0**. Every component's data needs are covered by endpoints defined in `api-contract.yaml` v1.5.0.
2. **Deployment-level gaps: CRITICAL**. The production deployment at `https://color-palette-api-production-a68b.up.railway.app` serves v1.4.0 (27 paths); the Sprint 6 endpoints (`/export/code`, `/analyze/contrast-matrix`, `/analyze/explain`, and the `semanticTokens`/`seed` extensions on `/theme/generate`) exist in the contract but are NOT deployed. This is a deployment-lag gap, not a contract gap — specced against contract, blocked for Guard verification.
3. **Auth gap: CRITICAL**. The admin key in `.env` (matches Railway `ADMIN_API_KEY`) is rejected by production with `authentication_error / INVALID_API_KEY`. Root cause unknown — likely hashing or header case. Blocks all Works development against live backend.

## 상세

### Data requirement → endpoint mapping

| Frontend need | Component | Endpoint | Contract version | Deployed? |
|---------------|-----------|----------|------------------|-----------|
| Generate random/harmony palette | PaletteDisplay + GenerateButton | `POST /theme/generate` (base) | v1.0+ | YES (v1.4.0) |
| Generate with seed (deterministic) | PaletteDisplay (on URL seed param) | `POST /theme/generate` with `seed` field | **v1.5.0** | **NO** |
| Generate with semantic tokens | ComponentPreview | `POST /theme/generate` with `semanticTokens: true` | **v1.5.0** | **NO** |
| Lock + regenerate | PaletteDisplay (lock flow) | `POST /palette/lock` | v1.0+ | YES |
| Export 9 formats | ExportBlock × 9 format variants | `POST /export/code` | **v1.5.0** | **NO** |
| WCAG contrast matrix | ContrastMatrix | `POST /analyze/contrast-matrix` | **v1.5.0** | **NO** |
| 8 colorblind simulations | ContrastMatrix (colorblind field) | `POST /analyze/contrast-matrix` (with `includeColorblind: true`) | **v1.5.0** | **NO** |
| Explain mode | ExplainPanel | `POST /analyze/explain` | **v1.5.0** | **NO** |
| Color info (hex, oklch, hsl) | ColorSwatch (notation display) | derived client-side from /theme/generate response (response includes hex+rgb+hsl+oklch per color) | v1.0+ | YES |
| User quota (future) | Sprint 2 | `GET /user/quota` | v1.0+ | YES (unused Sprint 1) |
| Health check | startup | `GET /health` | v1.0+ | YES |

### Contract coverage verdict
**0 contract-level gaps.** Every frontend data need has a corresponding endpoint in `api-contract.yaml` v1.5.0. The Lab spec proceeds against this contract.

### Deployment coverage verdict
**Production serves v1.4.0 with 27 paths. Sprint 6 endpoints + extensions are MISSING in production.**

Test performed 2026-04-09 T01:07 UTC:
```
$ curl -s https://color-palette-api-production-a68b.up.railway.app/api/v1/openapi.json | jq '.info.version, (.paths | keys | length)'
"1.4.0"
27
```

No path matching `export/code`, `contrast-matrix`, or `analyze/explain` in the deployed spec.

**Impact on frontend delivery**:
- Works Phase 2 (build) can proceed against the contract — the frontend code will compile and the TypeScript types will be correct
- Works Phase 3 (self-test) can use MSW (Mock Service Worker) or a local stub server seeded with example responses from `frontend-handoff.md` Sprint 6 Amendment
- Guard verification CANNOT proceed against live production without v1.5.0 deployment
- **Blocking for Guard Phase, not for Works Phase**

### Auth coverage verdict
**BLOCKING for all live-backend development.**

Test:
```
$ curl -s -H "X-API-Key: b2b4e1f15c7c73baeee01546737720920497" https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random
{"object":"error","error":{"type":"authentication_error","code":"INVALID_API_KEY","message":"Invalid API key"}}
```

The key matches `ADMIN_API_KEY` in Railway production env vars verbatim. Possible root causes:
1. Backend hashes admin keys on `admin_keys` table insert, so the raw value in env is for bootstrap only and doesn't match the stored hash directly
2. The key was rotated or revoked and the env var is stale
3. Header case sensitivity (`X-API-Key` vs `X-Api-Key`) — unlikely given RFC 7230 header names being case-insensitive, but worth ruling out
4. Admin keys require a different header entirely (e.g., `Admin-API-Key`)

**Agentic Orchestrator should be queried via informal query (`handoff/queries/U1-api-key-auth-failure.md`)** to resolve.

---

## Callback A package (sent to Agentic)

Because of the deployment gap + auth gap, Lab produces a `handoff/frontend-builder-to-agentic/` Callback A package with `type: deployment-lag + auth-bootstrap`. See §Callback below.

### Lab proceeds regardless
- Specs against v1.5.0 contract as documented in `frontend-handoff.md`
- Documents these gaps prominently in `feasibility.md` risk section
- Works can begin using MSW stubs + local backend (`cargo run`) for development
- Human approval at Step 4 gate should be aware that Guard verification requires resolution before Works→Guard transition

---

## Fields not used by frontend Sprint 1

Endpoints that exist in the contract but the frontend doesn't use:

| Endpoint | Sprint 1 use | Reason |
|----------|--------------|--------|
| `POST /auth/exchange` | no | Sprint 1 uses single dev key; Firebase auth deferred |
| `GET /user/me` | no | no account UI |
| `GET /user/quota` | no | no account UI |
| `POST /user/rotate-key` | no | no account UI |
| `DELETE /user/account` | no | no account UI |
| `POST /admin/*` | no | no admin UI in frontend |
| `POST /palette/adjust` | no | Sprint 1 locks rather than hue/sat adjust |
| `POST /palette/blend` | no | out of Sprint 1 scope |
| `GET /color/{hex}` | no | palette response has color info already |
| `GET /color/{hex}/blindness` | no | contrast-matrix endpoint supersedes |
| `POST /color/shades` | no | out of scope |
| `POST /analyze/contrast` | no | contrast-matrix endpoint supersedes for pair analysis too |
| `POST /analyze/palette` | no | explain mode provides equivalent insights + pedagogy |
| `POST /export/css` | no | `/export/code` format=`css-vars-hex` supersedes |
| `POST /export/scss` | no | `/export/code` format=`scss` supersedes |
| `POST /export/tailwind` | no | `/export/code` format=`tailwind-config` supersedes |
| `POST /export/design-tokens` | no | `/export/code` format=`dtcg-json` supersedes |
| `POST /export/figma-variables` | no | target user isn't Figma user |

This reduces the surface area Works needs to integrate. Sprint 1 uses **~6 endpoints**: `/theme/generate`, `/palette/lock`, `/export/code`, `/analyze/contrast-matrix`, `/analyze/explain`, `/health`.

---

## Callback A package (to be written to handoff/frontend-builder-to-agentic/)

```yaml
# callback-request.md
type: deployment-lag + auth-bootstrap
severity: critical
blocking: guard-verification

gap_1:
  name: "Sprint 6 endpoints not deployed"
  expected: "v1.5.0 with /export/code, /analyze/contrast-matrix, /analyze/explain, plus /theme/generate with semanticTokens+seed fields"
  observed: "production serves v1.4.0 with 27 paths; Sprint 6 endpoints absent"
  request: "deploy v1.5.0 to production before Frontend Works → Guard handoff"
  works_unblock: "local backend build (cargo run) or MSW stubs for development"

gap_2:
  name: "Admin API key auth failure"
  expected: "ADMIN_API_KEY value in .env authenticates successfully"
  observed: "authentication_error / INVALID_API_KEY on all authenticated endpoints"
  request: "confirm auth mechanism (hashed vs raw key) and provide working credentials"
  works_unblock: "local backend build (bypass auth check for dev) or stub auth layer"
```

---

## Knowledge 후보
- "Deployment-lag as a distinct callback type" (knowledge-candidates.md #4) — extend `05-handoff/callback-request-types.md` to include `deployment-lag` type if this pattern recurs.

## Self-Eval
- [x] Every frontend component's data need mapped to an endpoint
- [x] Contract-level gaps explicitly declared (0)
- [x] Deployment-level gaps explicitly declared (critical)
- [x] Auth issue documented with root-cause hypotheses
- [x] Callback A package drafted for handoff/frontend-builder-to-agentic/
- [x] Unused endpoints explicitly listed (avoids scope creep in Works)
- [x] Sprint 1 minimal endpoint surface identified (6 endpoints)

# Color Palette API — Architecture (v1.5.0 — Sprint 6 Amendment + v1.4.0 Historical)

> Sprint 6 amendment is at the top. Sprint 5 historical content is preserved below the divider.

---

## Sprint 6 Amendment — Developer-First Relaunch

### S6.A System overview (Sprint 6 additions only)

Sprint 6 is an **additive feature sprint**. The Sprint 5 middleware stack, auth flow, error envelope, OpenAPI generation pipeline, request_id propagation, and idempotency LRU are all reused unchanged. Sprint 6 adds:

- 3 new route handlers + 1 extension on an existing handler
- 3 new engine modules
- 1 helper in ulid_gen
- ~12 new model structs
- 6 new error codes (constructed via existing AppError methods)
- ~30 new integration tests
- 1 doc amendment + new test fixture file

```
                       ┌─────────────────────────────────────────┐
                       │         Frontend / API consumer          │
                       └──────────────┬──────────────────────────┘
                                      │ HTTPS
                                      ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                    color-palette-api (Rust + Axum 0.8) v1.5.0       │
  │                                                                     │
  │  Tower middleware stack — UNCHANGED from Sprint 5 (all Sprint 5     │
  │  numbered layers stay; Sprint 6 only adds 3 paths to the            │
  │  idempotency allowlist):                                            │
  │    1. CorsLayer                                                     │
  │    2. TraceLayer                                                    │
  │    3. CompressionLayer                                              │
  │    4. SetResponseHeaderLayer                                        │
  │    5. request_id_middleware (Sprint 5)                              │
  │    6. rate_limit_headers_layer (Sprint 5 Tier 2)                    │
  │    7. idempotency_layer ★ allowlist gains 3 new paths Sprint 6       │
  │    8. AuthLayer                                                     │
  │    9. RateLimit middleware                                          │
  │   10. IpThrottle                                                    │
  │                                                                     │
  │  Existing 27 handlers — UNCHANGED                                   │
  │                                                                     │
  │  ★ NEW Sprint 6 handlers (4 total):                                 │
  │    POST /api/v1/theme/generate (extended with semanticTokens flag)  │
  │    POST /api/v1/export/code              -> export::code_export     │
  │    POST /api/v1/analyze/contrast-matrix   -> analysis::contrast_matrix│
  │    POST /api/v1/analyze/explain           -> analysis::explain      │
  │                                                                     │
  │  ★ NEW engine modules (3 total):                                    │
  │    src/engine/colorblind.rs   — Viénot/Machado/BT.709 matrices      │
  │    src/engine/semantic_tokens.rs — auto_contrast_pair + recipe      │
  │    src/engine/explain.rs       — harmony classification + templates │
  │                                                                     │
  │  ★ NEW helper: src/ulid_gen.rs::short_seed() (Crockford 13 char)    │
  │                                                                     │
  │  All other modules: UNCHANGED                                       │
  │                                                                     │
  │  Static OpenAPI doc routes (Sprint 5) — UNCHANGED:                  │
  │   - GET /swagger-ui/*           (utoipa-swagger-ui)                 │
  │   - GET /api/v1/openapi.json    (utoipa::OpenApi::openapi())        │
  │   - GET /api/v1/docs            (308 → /swagger-ui)                 │
  └────────────────────────────────────────────────────────────────────┘
```

### S6.B Component diff (Sprint 5 → Sprint 6)

| Component | Sprint 5 state | Sprint 6 state | Reason |
|-----------|---------------|----------------|--------|
| `models/envelope.rs` Resource<T> / Collection<T> | Stable | Unchanged | Non-breaking by design |
| `error.rs` AppError + ErrorEnvelope | 8-type taxonomy | Unchanged; 6 new error codes added (not new types) | New codes inside existing taxonomy |
| `middleware/idempotency.rs` | 4-path allowlist | 7-path allowlist (+/export/code, +/analyze/contrast-matrix, +/analyze/explain) | New POSTs deserve dedup |
| `middleware/request_id.rs` | Stable | Unchanged | New handlers extract Extension<RequestId> as before |
| `middleware/auth.rs` | Stable | Unchanged | No new auth surface |
| `middleware/rate_limit_headers.rs` | Stable | Unchanged | New endpoints use existing rate limit |
| `routes/theme.rs::generate` | Generates primitives + colors | Extended: optional semanticTokens flag | Pillar 1 |
| `routes/export.rs` | css/scss/tailwind/dtcg/figma handlers | Adds `code_export` (9-format dispatch) | Pillar 2 |
| `routes/analysis.rs` | contrast/palette_analysis | Adds `contrast_matrix` + `explain` | Pillars 4 + 5 |
| `routes/palette.rs` | Sprint 4 race + Sprint 5 envelope | Unchanged | Sprint 6 doesn't touch palette engine |
| `routes/color.rs`, `auth.rs`, `user.rs`, `admin.rs`, `health.rs`, `docs.rs` | Stable | Unchanged | No Sprint 6 work |
| `engine/colorblind.rs` | — | NEW (matrices + apply_simulation) | Pillar 4 |
| `engine/semantic_tokens.rs` | — | NEW (auto_contrast_pair + generation recipe) | Pillar 1 |
| `engine/explain.rs` | — | NEW (harmony classification + template renderer) | Pillar 5 |
| `engine/wcag.rs` | Stable | Unchanged (reused by semantic_tokens) | Pillar 1 dep |
| `engine/color.rs` | OKLCH conversions | Unchanged or +helpers if needed | Pillar 4 dep |
| `ulid_gen.rs` | ULID req_xxx | + short_seed() (Crockford 13 char) + seed_to_u64() | Pillar 6 |
| `models/palette.rs` | ThemeBundle, primitives | + SemanticTokenSet, SemanticSlot, ThemeBundle.semantic field | Pillar 1 |
| `models/request.rs` | Sprint 5 requests | + CodeExportRequest, ContrastMatrixRequest, PaletteExplanationRequest, ThemeGenerateRequest::semanticTokens field | Pillars 1/2/4/5 |
| `models/response.rs` | Sprint 5 responses | + CodeExportResponse, ContrastMatrixResponse, ContrastMatrixEntry, ContrastMatrixPasses, ColorblindSimulation, PaletteExplanation, HueRelationship, OklchNarrative, LightnessRange, ChromaRange, HueSpread | Pillars 1/2/4/5 |
| `openapi.rs` | 27 paths + Sprint 5 schemas | + 3 new paths + ~12 new schemas | Pillars 2/4/5 + ToSchema derives |
| `Cargo.toml` | 1.4.0 | 1.5.0 | Minor bump per sprint policy |
| `tests/integration/error_envelope.rs` | Sprint 5 negative-path battery | Extended: same 4 negative cases run against new endpoints | Pillar 4/5 envelope verification |
| `tests/integration/sprint6_*.rs` | — | NEW (6 files) | Sprint 6 coverage |
| `tests/fixtures/colorblind_reference_vectors.json` | — | NEW | Pillar 4 cross-check |
| `docs/frontend-handoff.md` | v1.4.0 single source | + Sprint 6 amendment section | New endpoints + slot table |
| `docs/error-contract.md` | Sprint 5 codes | + 6 new codes | Pillar 1/2/4/5 |

### S6.C Before/after response shape — /theme/generate (representative)

**Before (Sprint 5)** — `POST /api/v1/theme/generate {"primary":"#0f172a","mode":"both"}`:
```json
{
  "object": "themeBundle",
  "id": "tb_01HXYZ...",
  "createdAt": "2026-04-08T01:08:56.981062900+00:00",
  "primitives": { "light": {...}, "dark": {...} },
  "primary": "#0f172a"
}
```

**After (Sprint 6, with semanticTokens flag)** — same call + `"semanticTokens": true`:
```json
{
  "object": "themeBundle",
  "id": "tb_01HXYZ...",
  "createdAt": "2026-04-09T...",
  "primitives": { "light": {...}, "dark": {...} },
  "primary": "#0f172a",
  "semantic": {
    "light": {
      "background": { "hex": "#ffffff", "oklch": "oklch(1 0 0)" },
      "foreground": { "hex": "#0a0a0a", "oklch": "oklch(0.145 0 0)" },
      "primary": { "hex": "#0f172a", "oklch": "oklch(0.205 0 0)" },
      "primaryForeground": { "hex": "#ffffff", "oklch": "oklch(0.985 0 0)" }
      // ... (all 24 slots)
    },
    "dark": { /* all 24 slots */ }
  },
  "slotSource": { "name": "shadcn-ui", "version": "v0.9.0", "commit": "<works pins>" },
  "seed": "ABCDEFGHJKMNP"
}
```

**Critical**: when `semanticTokens` is omitted or `false`, the response is byte-identical to Sprint 5. Backwards compat is preserved by default.

### S6.D Sequence diagram — Pillar 4 contrast-matrix

```
[Frontend]                  [color-palette-api]            [Engine]
   │                              │                           │
   │ POST /analyze/contrast-matrix│                           │
   │ X-API-Key: ...               │                           │
   │ Idempotency-Key: <ulid>      │                           │
   │ {palette:[hex,...],          │                           │
   │  includeColorblind:true}     │                           │
   │ ────────────────────────────▶│                           │
   │                              │ idempotency check          │
   │                              │ (allowlist: yes)          │
   │                              │ auth check                 │
   │                              │ rate limit                 │
   │                              │ ─────────────────────────▶ │
   │                              │                            │ wcag::pairwise_matrix
   │                              │                            │   (n*(n-1) calls)
   │                              │                            │ colorblind::apply_simulation
   │                              │                            │   (n colors × 8 matrices)
   │                              │ ◀───────────────────────── │
   │                              │ wrap in Resource<ContrastMatrixResponse>│
   │                              │ idempotency cache insert  │
   │ {object:"contrastMatrix",    │                           │
   │  matrix:[...],colorblind:...,│                           │
   │  matricesSource:{...}}       │                           │
   │ Request-Id: req_...          │                           │
   │ X-Idempotent-Replayed: false │                           │
   │ ◀──────────────────────────── │                           │
```

### S6.E Sequence diagram — Pillar 5 explain (deterministic)

```
[Frontend]                    [color-palette-api]
   │                                │
   │ POST /analyze/explain          │
   │ {palette:[...],seed:"AB..."}   │
   │ ───────────────────────────────▶│
   │                                │ explain::classify_harmony(palette)
   │                                │   → ("split-complementary", 0.82)
   │                                │ explain::compute_hue_relationships
   │                                │ explain::compute_oklch_narrative
   │                                │ explain::render_pedagogical_notes
   │                                │   (templated, deterministic given inputs)
   │ {object:"paletteExplanation",  │
   │  harmonyType:"split-...",      │
   │  pedagogicalNotes:[3..5 lines],│
   │  templateVersion:"sprint6.v1", │
   │  seed:"AB..."}                 │
   │ ◀────────────────────────────── │
   │                                │
   │ Same call again (any time later)
   │ ───────────────────────────────▶│
   │ (byte-identical except envelope id/createdAt)
   │ ◀────────────────────────────── │
```

### S6.F OpenAPI generation pipeline (unchanged from Sprint 5; just adds 3 paths + 12 schemas)

```
src/routes/*.rs              src/models/*.rs            src/openapi.rs
   #[utoipa::path(...)]        #[derive(ToSchema)]
   on every handler            on every struct
                ↓                       ↓
           ┌────────────────────────────────────────┐
           │     ApiDoc::openapi() → OpenAPI 3.1     │
           └────────────────┬───────────────────────┘
                            │
                            ▼
                  GET /api/v1/openapi.json
                  GET /swagger-ui
```

### S6.G Module structure (Sprint 6 final, only ★ changed)

```
src/
├── main.rs                  (Sprint 5 unchanged)
├── lib.rs                   (unchanged)
├── config.rs                (unchanged)
├── error.rs                 ★ + 6 new error codes
├── extractors.rs            ★ ApiJson<T> from Sprint 5 - reused
├── ulid_gen.rs              ★ + short_seed() + seed_to_u64()
├── openapi.rs               ★ + 3 paths + 12 schemas registered
├── auth/                    (unchanged)
├── db/                      (unchanged)
├── engine/
│   ├── color.rs             (unchanged or +sRGB linear helpers if needed)
│   ├── wcag.rs              (unchanged; reused by semantic_tokens)
│   ├── palette.rs           (unchanged)
│   ├── analysis.rs          (unchanged)
│   ├── harmony.rs           (unchanged)
│   ├── quality.rs           (unchanged)
│   ├── diversity_cache.rs   (unchanged)
│   ├── export.rs            (unchanged; new export goes via routes::export::code_export)
│   ├── theme/               (unchanged; semantic generation lives in semantic_tokens.rs)
│   ├── colorblind.rs        ★ NEW
│   ├── semantic_tokens.rs   ★ NEW
│   ├── explain.rs           ★ NEW
│   └── mod.rs               ★ + new mod declarations
├── middleware/
│   ├── auth.rs              (unchanged)
│   ├── ip_throttle.rs       (unchanged)
│   ├── request_id.rs        (unchanged)
│   ├── idempotency.rs       ★ + 3 new paths in allowlist
│   ├── rate_limit_headers.rs (unchanged)
│   └── mod.rs
├── models/
│   ├── envelope.rs          (unchanged)
│   ├── request.rs           ★ + new request structs
│   ├── response.rs          ★ + new response structs
│   ├── palette.rs           ★ + ThemeBundle.semantic field, SemanticTokenSet, SemanticSlot
│   ├── theme.rs             (unchanged)
│   └── mod.rs
├── routes/
│   ├── admin.rs             (unchanged)
│   ├── analysis.rs          ★ + contrast_matrix, explain handlers
│   ├── auth.rs              (unchanged)
│   ├── color.rs             (unchanged)
│   ├── docs.rs              (unchanged)
│   ├── export.rs            ★ + code_export handler
│   ├── health.rs            (unchanged)
│   ├── palette.rs           (unchanged)
│   ├── theme.rs             ★ extended generate to handle semanticTokens
│   ├── theme_export.rs      (unchanged)
│   ├── user.rs              (unchanged)
│   └── mod.rs               ★ + register new handlers in router

docs/
├── auth.md                  (unchanged)
├── frontend-handoff.md      ★ + Sprint 6 amendment section
├── error-contract.md        ★ + 6 new codes
└── deploy-plan.md           ★ + Sprint 6 entry (additive deploy, no migration)

tests/
├── integration/
│   ├── (Sprint 5 tests unchanged)
│   ├── error_envelope.rs    ★ extend with new endpoints
│   ├── sprint6_semantic_tokens.rs           ★ NEW
│   ├── sprint6_export_code.rs               ★ NEW
│   ├── sprint6_contrast_matrix.rs           ★ NEW
│   ├── sprint6_explain.rs                   ★ NEW
│   ├── sprint6_colorblind_crosscheck.rs     ★ NEW
│   └── sprint6_seed_determinism.rs          ★ NEW
├── fixtures/
│   └── colorblind_reference_vectors.json    ★ NEW

Cargo.toml                   ★ version 1.5.0
README.md                    ★ Sprint 6 features blurb
```

### S6.H What does NOT change in Sprint 6

- All Sprint 5 contracts (envelope, error envelope, camelCase, Request-Id, Idempotency-Key)
- Auth flow (Firebase JWT → API key)
- All 27 existing endpoint URLs and shapes
- Database schema (no migrations)
- Engine algorithms for palette generation, scoring, OKLCH, parallel race, diversity cache
- Tier model (Free / Student / Pro / Admin / Legacy)
- Quota tracking
- CORS env var configuration
- Cargo dependencies (zero new crates expected)
- Spectral lint baseline
- Build process (Railway auto-deploy on git push, multi-stage Dockerfile)

---
---

# Color Palette API -- Sprint 5 Architecture

> **Historical — Sprint 5 (preserved unchanged below).**

## System overview

Sprint 5 is a **surface-area refactor** -- the engine, persistence, auth flow, and middleware stack are unchanged. Only the JSON serialization layer and the documentation surface change.

```
                            ┌──────────────────────────────────────┐
                            │      Frontend / API consumer         │
                            │   (TypeScript, curl, openapi-typed)  │
                            └──────────────┬───────────────────────┘
                                           │
                                           │ HTTPS
                                           ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                       color-palette-api (Rust + Axum 0.8)               │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │             Tower middleware stack (outside → inside)             │ │
│  │                                                                    │ │
│  │   1. CorsLayer (existing)                                          │ │
│  │   2. TraceLayer (existing)                                         │ │
│  │   3. CompressionLayer (existing)                                   │ │
│  │   4. SetResponseHeaderLayer (existing)                             │ │
│  │   5. ★ request_id_middleware (NEW Sprint 5)                       │ │
│  │   6. ★ rate_limit_headers_layer (NEW Sprint 5, Tier 2)            │ │
│  │   7. ★ idempotency_layer (NEW Sprint 5, Tier 2, conditional)      │ │
│  │   8. AuthLayer (existing)                                          │ │
│  │   9. RateLimit middleware (existing)                               │ │
│  │  10. IpThrottle (existing, FB-002)                                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │                     Route handlers (27)                            │ │
│  │                                                                    │ │
│  │  Each handler now returns Json<Resource<T>> or Json<Collection<T>>│ │
│  │  Each handler now annotated with #[utoipa::path(...)]              │ │
│  │  Each handler accepts Extension<RequestId> for AppError construction │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                ▼                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │   Engine + DB layers (UNCHANGED -- src/engine, src/db, src/auth)  │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  Static OpenAPI doc routes (NEW):                                        │
│   - GET /swagger-ui/*           ── utoipa-swagger-ui                     │
│   - GET /api/v1/openapi.json   ── utoipa::OpenApi::openapi()            │
│   - GET /api/v1/docs           ── 308 redirect to /swagger-ui            │
└──────────────────────────────────────────────────────────────────────────┘
```

## Component diff (Sprint 4 → Sprint 5)

| Component | Sprint 4 state | Sprint 5 state | Reason |
|-----------|---------------|--------------|--------|
| `models/response.rs::ApiResponse<T>` | `{success, data, meta}` envelope, used by 5 endpoint families | DELETED. Replaced by `models/envelope.rs::Resource<T>` | No mainstream API uses `success`; envelope inconsistent across endpoint families |
| `models/envelope.rs` | -- | NEW. `Resource<T>`, `Collection<T>` | Universal envelope |
| `error.rs::ApiError` + `ErrorDetail` | `{success, error: {code, field, message}}` | DELETED. Replaced by `ErrorEnvelope`/`ErrorBody`/`ErrorType`/`SubError` | Stripe-style nested error + 8-type taxonomy |
| `error.rs::AppError` | takes (code, message) | Takes (code, message, request_id, ...) and constructs new envelope | Request-Id propagation to errors |
| `middleware/request_id.rs` | -- | NEW. Tower middleware | Request correlation |
| `middleware/idempotency.rs` | -- | NEW (Tier 2). LRU dedup | Stripe-style idempotency |
| `middleware/rate_limit_headers.rs` | -- | NEW (Tier 2). Tower layer | DX-friendly rate limit visibility |
| `openapi.rs` | -- | NEW. `ApiDoc` root | Source of truth for spec |
| `routes/docs.rs` | 400 lines hand-written HTML | 10 lines (redirect to /swagger-ui) | Drift-proof |
| `routes/palette.rs`, `color.rs`, `analysis.rs`, `export.rs`, `theme.rs`, `theme_export.rs`, `admin.rs`, `health.rs` | Bare data inside `ApiResponse` | `Resource<T>` envelope + `#[utoipa::path]` + `Extension<RequestId>` | Envelope unification |
| `routes/user.rs`, `auth.rs` | Bare structs, snake_case wire format, ad-hoc `{"error": code}` | `Resource<T>` envelope + camelCase + new `AppError` | Largest user-visible change |
| `models/response.rs`, `request.rs`, `palette.rs`, `theme.rs` | Per-field `#[serde(rename = "camelCase")]` | `#[serde(rename_all = "camelCase")]` at struct level + `#[derive(ToSchema)]` | Idiomatic serde + utoipa integration |
| `Cargo.toml` | version `1.0.0`, no utoipa | version `1.4.0`, + utoipa, utoipa-axum, utoipa-swagger-ui, ulid | Sprint 5 deps + version policy |
| `tests/*` | Assert bare-data shape with snake_case fields on /user/* | Assert envelope shape, camelCase, strongly-typed deserialization | Test rewrite (R4 mitigation) |

## Before/after response shape diffs (3 endpoint families)

### Family 1: `/palette/random` (representative of palette/color/analyze/export/theme)

**Before (Sprint 4)**:
```http
GET /api/v1/palette/random
X-API-Key: ck_live_...

200 OK
Content-Type: application/json

{
  "success": true,
  "data": {
    "colors": [
      { "hex": "4A90D9", "rgb": {...}, "oklch": {...}, ...},
      { "hex": "D94A4A", ... },
      ...
    ],
    "compositeScore": 87,
    "metrics": {
      "harmony": 92,
      "distinctness": 85,
      "lightnessDistribution": 80,
      "temperatureCoherence": 88,
      "saturationCoherence": 90,
      "gamutSpread": 85,
      "uiUtility": 80,
      "colorBlindSafety": 95,
      "accessibility": 88
    },
    "harmonyType": "analogous",
    "seed": null
  },
  "meta": {
    "generatedAt": "2026-04-08T12:34:56.789Z",
    "processingMs": 23
  }
}
```

**After (Sprint 5)**:
```http
GET /api/v1/palette/random
X-API-Key: ck_live_...

200 OK
Content-Type: application/json
Request-Id: req_01HXYZ...
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 119
X-RateLimit-Reset: 1712577600

{
  "object": "palette",
  "id": "pal_01HXYZ...",
  "createdAt": "2026-04-08T12:34:56.789Z",
  "colors": [
    { "hex": "4A90D9", "rgb": {...}, "oklch": {...}, ...},
    { "hex": "D94A4A", ... },
    ...
  ],
  "compositeScore": 87,
  "metrics": {
    "harmony": 92,
    "distinctness": 85,
    "lightnessDistribution": 80,
    "temperatureCoherence": 88,
    "saturationCoherence": 90,
    "gamutSpread": 85,
    "uiUtility": 80,
    "colorBlindSafety": 95,
    "accessibility": 88
  },
  "harmonyType": "analogous",
  "seed": null
}
```

Changes:
- Removed `success` boolean (HTTP status is the truth).
- Removed `data` indirection (one less level of nesting).
- Removed `meta` sub-object; `generatedAt` is now top-level `createdAt`; `processingMs` moves to a future header (Tier 3) -- for Sprint 5 it is intentionally dropped from the envelope (Architect Lead's call -- if anyone needs it, server-side trace logs have it).
- Added `object: "palette"` discriminator.
- Added `id: "pal_<ulid>"` correlation ID.
- Added `Request-Id`, `X-RateLimit-*` headers.

### Family 2: `/user/me` (representative of /user/* and /auth/exchange)

**Before (Sprint 4)** -- the key inconsistency:
```http
GET /api/v1/user/me
X-API-Key: ck_live_...

200 OK
Content-Type: application/json

{
  "firebase_uid": "abc123",
  "email": "eli@example.com",
  "display_name": "Eli",
  "github_login": "eli",
  "tier": "free",
  "tier_source": "default",
  "tier_verified_at": "2026-04-01T00:00:00Z",
  "tier_expires_at": null,
  "monthly_quota": 1000,
  "usage_this_month": 47,
  "key_prefix": "ck_live_abc1",
  "key_created_at": "2026-04-01T00:00:00Z",
  "last_used_at": "2026-04-08T12:00:00Z"
}
```

Note: NO envelope, snake_case fields. This is what frontend-builder would have to special-case versus the palette family.

**After (Sprint 5)**:
```http
GET /api/v1/user/me
X-API-Key: ck_live_...

200 OK
Content-Type: application/json
Request-Id: req_01HXYZ...
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 118
X-RateLimit-Reset: 1712577600

{
  "object": "user",
  "id": "abc123",
  "createdAt": "2026-04-01T00:00:00Z",
  "firebaseUid": "abc123",
  "email": "eli@example.com",
  "displayName": "Eli",
  "githubLogin": "eli",
  "tier": "free",
  "tierSource": "default",
  "tierVerifiedAt": "2026-04-01T00:00:00Z",
  "tierExpiresAt": null,
  "monthlyQuota": 1000,
  "usageThisMonth": 47,
  "keyPrefix": "ck_live_abc1",
  "keyCreatedAt": "2026-04-01T00:00:00Z",
  "lastUsedAt": "2026-04-08T12:00:00Z"
}
```

Changes:
- Added envelope: `object`, `id` (= firebase_uid), `createdAt` (= keyCreatedAt).
- All fields renamed snake_case → camelCase (12 fields).
- The Rust struct field names stay as Rust-idiomatic snake_case via `#[serde(rename_all = "camelCase")]`.
- `firebaseUid` is duplicated as the envelope `id` -- intentional. `id` is the canonical envelope field; `firebaseUid` is preserved in the resource body so existing clients that did `body.firebase_uid` only need to update to `body.firebaseUid` (one transformation, predictable).

### Family 3: `/admin/keys` POST (representative of admin/* + creation operations)

**Before (Sprint 4)** -- existing partial envelope:
```http
POST /api/v1/admin/keys
X-API-Key: <admin>
Content-Type: application/json

{ "name": "Test Key", "role": "user" }

201 Created
Content-Type: application/json

{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Test Key",
    "key": "ck_live_...",
    "role": "user",
    "tier": "free",
    "createdAt": "2026-04-08T12:34:56Z",
    "lastUsedAt": null
  }
}
```

**After (Sprint 5)**:
```http
POST /api/v1/admin/keys
X-API-Key: <admin>
Content-Type: application/json
Request-Id: req_01HXYZ...

{ "name": "Test Key", "role": "user" }

201 Created
Content-Type: application/json
Request-Id: req_01HXYZ...

{
  "object": "apiKey",
  "id": "uuid-here",
  "createdAt": "2026-04-08T12:34:56Z",
  "name": "Test Key",
  "key": "ck_live_...",
  "role": "user",
  "tier": "free",
  "keyPrefix": "ck_live_abc1",
  "lastUsedAt": null
}
```

Changes:
- `success` removed.
- `data` indirection removed.
- `id` from inner moves to envelope `id` (deduplicated).
- `createdAt` from inner moves to envelope `createdAt` (deduplicated).
- All fields camelCase already (admin family was already mostly camelCase).
- `Request-Id` echoed.

### Error response example (representative of all error responses)

**Before (Sprint 4) -- /palette/generate validation error**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_COUNT",
    "field": "count",
    "message": "Count must be between 2 and 12"
  }
}
```

**Before (Sprint 4) -- /user/me unauthenticated error**:
```json
{ "error": "invalid_key" }
```

(Note the dramatic inconsistency.)

**After (Sprint 5) -- both endpoints, identical shape**:
```http
HTTP/1.1 400 Bad Request
Content-Type: application/json
Request-Id: req_01HXYZ...

{
  "object": "error",
  "error": {
    "type": "invalid_request_error",
    "code": "INVALID_COUNT",
    "message": "Count must be between 2 and 12",
    "param": "count",
    "docUrl": "https://color-palette-api.example.com/docs/errors#INVALID_COUNT",
    "requestId": "req_01HXYZ..."
  }
}
```

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json
Request-Id: req_01HXYZ...

{
  "object": "error",
  "error": {
    "type": "authentication_error",
    "code": "INVALID_API_KEY",
    "message": "Missing or invalid X-API-Key header",
    "docUrl": "https://color-palette-api.example.com/docs/errors#INVALID_API_KEY",
    "requestId": "req_01HXYZ..."
  }
}
```

## Data flow: Request-Id propagation

```
Client                          Tower stack            Handler         AppError      Response
  │                                  │                    │              │             │
  │ POST /palette/generate           │                    │              │             │
  │ Request-Id: req_client_abc       │                    │              │             │
  │─────────────────────────────────▶│                    │              │             │
  │                                  │ extract Request-Id │              │             │
  │                                  │ → "req_client_abc" │              │             │
  │                                  │ insert in ext      │              │             │
  │                                  │ ─────────────────▶ │              │             │
  │                                  │                    │ extract via  │             │
  │                                  │                    │ Extension<   │             │
  │                                  │                    │ RequestId>   │             │
  │                                  │                    │              │             │
  │                                  │                    │ build Resource│            │
  │                                  │                    │   OR         │             │
  │                                  │                    │ build AppError(req_id) │   │
  │                                  │                    │ ───────────▶ │             │
  │                                  │                    │              │ IntoResponse│
  │                                  │                    │              │ ──────────▶ │
  │                                  │                    │              │             │ 200/4xx
  │                                  │ ◀─────────────────────────────────────────────  │
  │                                  │ insert Request-Id  │              │             │
  │                                  │ response header    │              │             │
  │ ◀─────────────────────────────── │                    │              │             │
  │ 200 OK                           │                    │              │             │
  │ Request-Id: req_client_abc       │                    │              │             │
  │ { "object": "palette", ... }     │                    │              │             │
```

## OpenAPI generation pipeline

```
src/routes/*.rs              src/models/*.rs              src/openapi.rs
     │                              │                            │
     │ #[utoipa::path(...)]         │ #[derive(ToSchema)]        │
     │ on every handler             │ on every struct            │
     │                              │                            │
     └──────────┬───────────────────┴──────────┬─────────────────┘
                │                              │
                │ utoipa derive macros         │
                │ (compile time)               │
                ▼                              ▼
                       ┌────────────────────────────┐
                       │   ApiDoc::openapi() -> Json│
                       └─────────────┬──────────────┘
                                     │
                                     ▼
                       ┌────────────────────────────┐
                       │  GET /api/v1/openapi.json  │
                       │       (public route)       │
                       └─────────────┬──────────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
   utoipa-swagger-ui          openapi-typescript          Spectral
   (embedded HTML)            (frontend type gen)         (CI lint)
   GET /swagger-ui            npx in CI                   gh action
```

## Module structure (Sprint 5 final)

```
src/
├── main.rs                  ★ + middleware layer + Swagger UI mount + utoipa import
├── lib.rs                   (test entry; unchanged)
├── config.rs                (unchanged)
├── error.rs                 ★ REWRITTEN — ErrorEnvelope + ErrorType + AppError
├── openapi.rs               ★ NEW — ApiDoc OpenAPI root
├── auth/                    (unchanged)
├── db/                      (unchanged)
├── engine/                  (unchanged — Sprint 4 parallel race + diversity stays)
├── export/                  (unchanged)
├── middleware/
│   ├── auth.rs              (unchanged + AppError construction signature update)
│   ├── ip_throttle.rs       (unchanged + AppError construction signature update)
│   ├── request_id.rs        ★ NEW
│   ├── idempotency.rs       ★ NEW (Tier 2)
│   ├── rate_limit_headers.rs ★ NEW (Tier 2)
│   └── mod.rs               ★ + new mod declarations
├── models/
│   ├── envelope.rs          ★ NEW — Resource<T>, Collection<T>
│   ├── request.rs           ★ + #[serde(rename_all)] + #[derive(ToSchema)]
│   ├── response.rs          ★ + same; remove ApiResponse<T>
│   ├── palette.rs           ★ + same on inner types
│   ├── theme.rs             ★ + same on inner types
│   └── mod.rs
├── routes/
│   ├── admin.rs             ★ envelope wrap + utoipa::path + RequestId extension
│   ├── analysis.rs          ★ same
│   ├── auth.rs              ★ envelope wrap + camelCase + new AppError
│   ├── color.rs             ★ envelope wrap + utoipa::path + RequestId extension
│   ├── docs.rs              ★ REWRITTEN — 10-line redirect
│   ├── export.rs            ★ envelope wrap + utoipa::path + RequestId extension
│   ├── health.rs            ★ envelope wrap + utoipa::path
│   ├── palette.rs           ★ envelope wrap + utoipa::path + RequestId extension
│   ├── theme.rs             ★ envelope wrap + utoipa::path + RequestId extension
│   ├── theme_export.rs      ★ envelope wrap + utoipa::path + RequestId extension
│   ├── user.rs              ★ envelope wrap + camelCase + new AppError
│   └── mod.rs               (unchanged)

docs/                        ★ NEW or extended
├── auth.md                  (existing — Sprint 3)
├── frontend-handoff.md      ★ NEW — single source of truth
├── error-contract.md        ★ NEW — error code catalog
└── deploy-plan.md           ★ NEW — Sprint 5 cutover decision

tests/                       ★ Many files modified — ~70 tests rewritten
├── api_integration.rs       ★ assertion rewrites
├── integration/             ★ assertion rewrites
├── routes/                  ★ assertion rewrites
└── (engine tests unchanged)

Cargo.toml                   ★ + utoipa + utoipa-axum + utoipa-swagger-ui + ulid; version 1.4.0
README.md                    ★ version reference + envelope note
```

## Sequence diagram: Frontend integration (post-Sprint 5 happy path)

```
[Frontend builder]            [color-palette-api]              [Firebase]
       │                              │                              │
       │ GET /api/v1/openapi.json     │                              │
       │ ────────────────────────────▶│                              │
       │     openapi.json (3.1)       │                              │
       │ ◀────────────────────────────│                              │
       │                              │                              │
       │ npx openapi-typescript ...   │                              │
       │   (generates api.d.ts)       │                              │
       │                              │                              │
       │ User clicks "Sign in"        │                              │
       │ ─────────────────────────────────────────────────────────▶ │
       │     Firebase ID token        │                              │
       │ ◀─────────────────────────────────────────────────────────  │
       │                              │                              │
       │ POST /api/v1/auth/exchange   │                              │
       │ { firebaseIdToken: "..." }   │                              │
       │ ────────────────────────────▶│                              │
       │                              │ verify token                 │
       │                              │ ───────────────────────────▶ │
       │                              │       OK                     │
       │                              │ ◀─────────────────────────── │
       │                              │ upsert user, issue api_key   │
       │ { object: "apiKeyExchange",  │                              │
       │   apiKey: "ck_...",          │                              │
       │   tier: "free", ... }        │                              │
       │ ◀────────────────────────────│                              │
       │                              │                              │
       │ Store apiKey                 │                              │
       │                              │                              │
       │ POST /api/v1/palette/generate│                              │
       │ X-API-Key: ck_...            │                              │
       │ Request-Id: req_client_abc   │                              │
       │ Idempotency-Key: <uuid>      │                              │
       │ { harmony: "analogous" }     │                              │
       │ ────────────────────────────▶│                              │
       │                              │ run engine (Sprint 4 race)   │
       │ { object: "palette",         │                              │
       │   id: "pal_...",             │                              │
       │   colors: [...] }            │                              │
       │ Request-Id: req_client_abc   │                              │
       │ X-RateLimit-Remaining: 119   │                              │
       │ ◀────────────────────────────│                              │
       │                              │                              │
       │ Render palette in UI         │                              │
```

## What does NOT change in Sprint 5

- Engine algorithms (palette generation, scoring, OKLCH conversions, parallel race, diversity cache)
- Database schema and migrations
- Auth middleware logic (just signature changes for request_id propagation)
- IP throttle middleware (FB-002)
- Rate-limit policy numbers
- Firebase JWT verification
- Firestore upsert flow
- Tier model (Free/Student/Pro/Admin/Legacy)
- Quota tracking
- Existing CORS env-var configuration mechanism
- The 27 endpoint URLs themselves

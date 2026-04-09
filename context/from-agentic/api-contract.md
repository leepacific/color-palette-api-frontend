# API Contract (Human-Readable) — color-palette-api v1.5.0

> **Authoritative machine spec**: `api-contract.yaml` (OpenAPI 3.1, 30 paths, utoipa-generated)
> **Deep dive with curl examples**: `<project-root>/docs/frontend-handoff.md` (584 lines, Sprint 6 amendment)
> **This file**: quickstart + Sprint 6 highlights for Frontend-Builder

## Base URL

```
https://color-palette-api-production-a68b.up.railway.app
```

Alt servers (see `api-contract.yaml servers[]`):
- `http://localhost:3000` — local dev

## Authentication

All `/api/v1/*` endpoints (except `/healthz`, `/api/v1/healthz`, `/api/v1/openapi.json`, `/api/v1/swagger-ui`) require an API key.

- Header: `X-Api-Key: <key>`
- Obtain a key via admin flow (see `docs/auth.md`) or use a dev key provided by the Board Chairman for Frontend-Builder Sprint 1.

## Response envelope (Sprint 5 freeze — DO NOT assume nested `data`)

Success responses are flat with `object` + `id` + `createdAt` at the top level:

```json
{
  "object": "palette",
  "id": "plt_01HX...",
  "createdAt": "2026-04-09T00:00:00Z",
  "colors": ["#0F172A", "#3B82F6", "#EF4444", "#10B981", "#F59E0B"],
  "seed": "ABCDEFGHJKMNP",
  "meta": { "requestId": "req_...", "version": "1.5.0" }
}
```

Error responses:

```json
{
  "error": {
    "type": "INVALID_INPUT",
    "code": "INVALID_PALETTE_SIZE",
    "message": "Palette must contain 1 to 256 colors",
    "requestId": "req_...",
    "field": "palette"
  }
}
```

Error types (8): `INVALID_INPUT`, `NOT_FOUND`, `UNAUTHORIZED`, `FORBIDDEN`, `RATE_LIMITED`, `INTERNAL`, `UPSTREAM`, `CONFLICT`.
Full code taxonomy (14 codes): see `docs/error-contract.md`.

## camelCase

All request + response fields are camelCase. `semantic_tokens` → `semanticTokens`, `short_seed` → `shortSeed`, etc.

## Headers

| Header | Direction | Required | Purpose |
|---|---|---|---|
| `X-Api-Key` | request | yes | auth |
| `X-Request-Id` | response | auto | request tracking — log/display in dev mode |
| `Idempotency-Key` | request | recommended on POST | retry-safe user-initiated POSTs |

---

## Sprint 6 Quickstart — the 4 endpoints you will use most

### 1. `POST /api/v1/theme/generate` — generate palette with semantic tokens

```bash
curl -X POST $BASE/api/v1/theme/generate \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "calm productivity dashboard",
    "paletteSize": 5,
    "semanticTokens": true,
    "seed": "ABCDEFGHJKMNP"
  }'
```

Response (abridged):
```json
{
  "object": "theme",
  "id": "thm_...",
  "createdAt": "...",
  "colors": ["#0F172A", "#3B82F6", "..."],
  "seed": "ABCDEFGHJKMNP",
  "extendedSemantic": {
    "primary": "#3B82F6",
    "primaryForeground": "#F8FAFC",
    "secondary": "#1E293B",
    "secondaryForeground": "#F1F5F9",
    "accent": "#10B981",
    "success": "#22C55E",
    "warning": "#F59E0B",
    "destructive": "#EF4444",
    "muted": "#334155",
    "mutedForeground": "#94A3B8",
    "background": "#0F172A",
    "foreground": "#F8FAFC",
    "card": "#1E293B",
    "cardForeground": "#F1F5F9",
    "border": "#334155",
    "ring": "#3B82F6",
    "... (28 slots total)": "..."
  },
  "slotSource": "shadcn-ui/ui@d0c86c4"
}
```

- `semanticTokens: true` triggers the 28-slot bundle (Sprint 6). If omitted or false, response matches v1-v5 shape.
- `seed` is optional. Omit → server generates one and returns it. Provide → deterministic reproduction.

### 2. `POST /api/v1/export/code` — 9-format code export

```bash
curl -X POST $BASE/api/v1/export/code \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "palette": ["#0F172A","#3B82F6","#EF4444","#10B981","#F59E0B"],
    "format": "shadcn-globals",
    "seed": "ABCDEFGHJKMNP"
  }'
```

Formats (`format` enum):
| Value | Target | pasteInto |
|---|---|---|
| `tailwind-config` | Tailwind | `tailwind.config.js` → `theme.extend.colors` |
| `css-vars-hex` | plain CSS | `:root { --... }` |
| `css-vars-oklch` | modern CSS | `:root { --... (oklch) }` |
| `shadcn-globals` | shadcn/ui | `app/globals.css` |
| `scss` | Sass | `_colors.scss` |
| `mui-palette` | Material-UI | `createTheme({ palette })` |
| `swift-uicolor` | iOS | `UIColor+Theme.swift` |
| `android-xml` | Android | `res/values/colors.xml` |
| `dtcg-json` | W3C Design Tokens | `tokens.json` |

Response fields: `code` (string, ready to paste), `pasteInto` (target file), `targetDocs` (upstream docs URL), `targetVersion` (pinned upstream version, e.g. `shadcn-ui/ui@d0c86c4`), `notes` (array of strings for caveats).

### 3. `POST /api/v1/analyze/contrast-matrix` — WCAG + colorblind simulation

```bash
curl -X POST $BASE/api/v1/analyze/contrast-matrix \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{ "palette": ["#0F172A","#3B82F6","#EF4444","#10B981","#F59E0B"] }'
```

Response:
```json
{
  "object": "contrastMatrix",
  "id": "ctm_...",
  "pairs": [
    {
      "fg": "#F8FAFC",
      "bg": "#3B82F6",
      "ratio": 4.87,
      "aaNormal": true,
      "aaLarge": true,
      "aaaNormal": false,
      "aaaLarge": true
    }
    // n*(n-1) entries
  ],
  "colorblind": {
    "protanopia":       ["#...","#...", ...],
    "deuteranopia":     ["#...","#...", ...],
    "tritanopia":       ["#...","#...", ...],
    "protanomaly":      ["#...","#...", ...],
    "deuteranomaly":    ["#...","#...", ...],
    "tritanomaly":      ["#...","#...", ...],
    "achromatopsia":    ["#...","#...", ...],
    "achromatomaly":    ["#...","#...", ...]
  },
  "matricesSource": "Viénot 1999 + Machado 2009 + ITU-R BT.709"
}
```

Display in UI by default. Any pair failing AA should be visually flagged.

### 4. `POST /api/v1/analyze/explain` — color theory explanation

```bash
curl -X POST $BASE/api/v1/analyze/explain \
  -H "X-Api-Key: $KEY" \
  -H "Content-Type: application/json" \
  -d '{ "palette": ["#0F172A","#3B82F6","#EF4444","#10B981","#F59E0B"], "seed": "ABCDEFGHJKMNP" }'
```

Response:
```json
{
  "object": "paletteExplanation",
  "id": "exp_...",
  "harmonyType": "split-complementary",
  "oklchNarrative": {
    "lightness": { "min": 0.18, "max": 0.94, "spread": 0.76 },
    "chroma":    { "min": 0.02, "max": 0.21, "spread": 0.19 },
    "hue":       { "ranges": [{ "start": 230, "end": 260 }, { "start": 0, "end": 30 }] }
  },
  "notes": [
    "Primary hue at 245° is complemented by accents at 5° and 145° (split-complementary arrangement, low cognitive clash).",
    "Lightness spread of 0.76 gives strong hierarchy — use the darkest for backgrounds, brightest for text-on-dark.",
    "Chroma stays below 0.22 — this is a muted palette, safe for long reading sessions.",
    "The 245°→5° pair at ratio 4.87 passes WCAG AA for normal text on large UI elements."
  ],
  "templateVersion": "sprint6.v1"
}
```

Use this panel as a student-facing learning surface.

---

## v1-v5 endpoints you may also need

See `api-contract.yaml` for the full 30-path catalog. Highlights:

- `POST /api/v1/palette/generate` — simple palette (no semantic tokens)
- `POST /api/v1/palette/lock` — regenerate with some colors locked
- `POST /api/v1/analyze/contrast` — single-pair WCAG check (lighter than contrast-matrix)
- `GET /api/v1/swagger-ui` — live API explorer (handy during frontend dev)
- `GET /api/v1/openapi.json` — machine-readable spec (= `api-contract.yaml` source of truth)
- `GET /api/v1/healthz` — liveness
- `GET /healthz` — no-auth liveness

---

## Rate limits

Per API key. Specific limits are enforced by `tower` middleware — if you hit one, you get `429 RATE_LIMITED` with `retryAfter` field (seconds). See `ops-requirements.md` in `handoff/works-to-guard/` for exact numbers.

## Open items / known limitations carried from Works → Guard

Non-blocking for frontend work, but be aware:
1. `INVALID_CSS_VAR_SYNTAX` error code is reserved (never emitted — serde rejects earlier).
2. `/analyze/contrast-matrix` has no explicit palette upper bound (rate limit bounds it).
3. `extendedSemantic` (28-slot, Sprint 6) and `semantic` (19-slot, Sprint 2) are independent — prefer `extendedSemantic` for new UI work.

## If the contract is wrong or missing something

Don't hack around it on the frontend. Write a callback package to `<project-path>/handoff/frontend-callback-in/` per the Frontend-Builder → Agentic contract. Agentic will process it (Lab amendment for gaps, Works Hotfix for defects).

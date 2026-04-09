---
design_philosophy_mode: on
trust_mode: standard
---

# Frontend Brief — color-palette-api (Sprint 6 → Frontend-Builder)

> **Authored by**: Orchestrator (extraction from approved Lab Sprint 6 PRD + Board Chairman design direction, 2026-04-09)
> **Backend status**: v1.5.0 live on Railway, Guard PASS Loop 1, 352/352 tests, 0 regressions
> **Board Chairman directives (2026-04-09 Step 1 clarification)**:
> - `design_philosophy_mode: on` — self-ness 강령 10스텝 서사 흐름 적용. design-language-architect 통과 필수. "Coolors가 못 이길 게임"의 내러티브 일관성 확보가 핵심.
> - `trust_mode: standard` — 모든 게이트(Step 4 Lab review, Step 8 release, Callback A/B, AMBIGUOUS)에서 인간 응답 대기. 단발 프로젝트 + 백엔드 연동 정합성 중요.
> - **API credentials**: `ADMIN_API_KEY` retrieved from Railway production env vars via Railway CLI (`railway variables`). Will be written to `<frontend-path>/.env` after bootstrap as `COLOR_PALETTE_API_DEV_KEY` (gitignored). This is the legacy-tier admin bootstrap key — no monthly quota, only per-minute rate limit — suitable for frontend development.

---

## 1. What we're building (one sentence)

A **developer/student-targeted** color palette generator that decisively beats Coolors on **code ergonomics + educational depth + accessibility transparency**, NOT on designer UX.

## 2. Why now

color-palette-api has shipped v1-v5 (core generation, themes, auth, parallel race, API consistency). Sprint 6 just landed 3 new endpoints + 1 extension specifically engineered to make the frontend a differentiator against Coolors for developers/students. The backend is ready; frontend is the last piece.

## 3. Target users (strict)

| | |
|---|---|
| **Primary** | Junior/mid developers using shadcn/ui, Tailwind, CSS vars |
| **Secondary** | Students learning design systems + color theory |
| **Non-target** | Designers (they can stay on Coolors/Figma — do NOT try to compete there) |

## 4. Value proposition — 6 pillars (all backend-supported)

1. **Semantic Token System** — 28-slot shadcn-compatible token bundle (`extendedSemantic` field on `/theme/generate` when `semanticTokens:true`). Frontend must render tokens by slot name, not by palette index.
2. **Multi-Format Code Export** — 9 formats via `POST /api/v1/export/code`: `tailwind-config`, `css-vars-hex`, `css-vars-oklch`, `shadcn-globals`, `scss`, `mui-palette`, `swift-uicolor`, `android-xml`, `dtcg-json`. Every response includes `pasteInto` + `targetDocs` + `targetVersion` + `notes`. **Frontend MUST show copy-paste-ready code blocks with one-click copy.**
3. **Live Component Preview** — Frontend renders real shadcn components (button, card, input, alert, dialog, badge, tabs) painted with the generated palette. Slot→component mapping table is in `docs/frontend-handoff.md` Sprint 6 Amendment section.
4. **WCAG Contrast Matrix + Colorblind Simulation** — `POST /api/v1/analyze/contrast-matrix` returns pairwise WCAG AA/AAA flags for all color pairs + 8 colorblind simulations (Viénot 1999 protanopia/deuteranopia/tritanopia + Machado 2009 severity-0.6 protanomaly/deuteranomaly/tritanomaly + BT.709 achromatopsia/achromatomaly). **Display by default — not behind a menu.**
5. **Explain Mode** — `POST /api/v1/analyze/explain` returns harmony type classification (complementary / analogous / triadic / split-complementary / tetradic / monochromatic / custom), OKLCH narrative (lightness/chroma/hue ranges), and 4 templated pedagogical notes with numeric insertions. **Position as a learning surface — show it prominently, not as a footer.**
6. **Deterministic Seed** — Every generation accepts and echoes a 13-char Crockford Base32 seed. Same seed = byte-identical output. URL shareability: `/?seed=XXXXXXXXXXXXX` must reproduce the exact palette. Git-diff-able palettes.

## 5. Design tone & aesthetic (LOAD-BEARING)

**Direction: experimental brutalist + code-editor aesthetic.**
This is the deliberate anti-Coolors positioning — Coolors owns minimalist designer aesthetic; we own terminal/IDE aesthetic.

### MUST
- **Monospace everywhere** — JetBrains Mono or IBM Plex Mono for titles, numerals, hex values, labels. Body text can be a humanist sans if needed for long-form explain-mode content, but all numeric/code surfaces stay monospace.
- **Simultaneous color notation** — show each color in **hex + oklch + hsl** at once (not toggled). Developers want oklch; students want to see the translation.
- **Terminal/IDE visual language** — visible grid lines, prominent numerals, tight spacing, minimal shadows, sharp rectangles. Think VSCode/JetBrains IDE sidebar aesthetic.
- **Keyboard-first** — vim-style shortcuts: `j/k` navigate palettes, `l` lock color, `e` open export drawer, `?` help overlay, `/` search/filter. Show shortcut hints inline.
- **JSON-like sidebar** — somewhere on screen, show the current palette as a JSON-ish live preview (it's the developer's mental model anyway).
- **Dark mode by default**, light mode toggle.
- **Hex/code values are copy-clickable** (click any hex → copy to clipboard, show feedback).

### MUST NOT
- No hero section with centered "Title + Subtitle + CTA button" (violates global frontend design rules)
- No identical 3-column equal card grids (violates rules)
- No AI cliché phrases: "Seamless", "Empower", "Revolutionize", "혁신적", "새로운 차원의"
- No purple→blue gradient without hue shift / unique accent
- No identical padding on consecutive sections

## 6. Critical UX flows (minimum viable)

### Flow A — "Generate → Paste into my project" (target: ≤30 seconds)
1. User lands → palette is already generated (deterministic default seed)
2. Space bar or `r` → new palette
3. `e` → export drawer slides in
4. Select format (tailwind / shadcn / css-vars-oklch / …) → code block rendered
5. Click "Copy" → clipboard populated → subtle feedback → dismiss

### Flow B — "Check accessibility" (must be visible by default)
1. Contrast matrix always visible (perhaps collapsed preview with one click to expand)
2. Colorblind simulation tabs/toggle — 8 modes, user can cycle through and see palette re-rendered
3. Any pair failing WCAG AA is visually flagged (red outline or icon)

### Flow C — "Learn from this palette" (student surface)
1. Explain-mode panel shows harmony type + OKLCH narrative + 4 pedagogical notes
2. Links/cross-references to color theory concepts (optional, Sprint 2+)

### Flow D — "Share this exact palette"
1. URL bar updates live with `?seed=XXXXXXXXXXXXX` on every generation
2. Visiting that URL reproduces byte-identically

## 7. Non-negotiable backend contract

- **Base URL**: `https://color-palette-api-production-a68b.up.railway.app` (Railway production) — also check `api-contract.yaml` for alt hosts
- **Auth**: API key via `X-Api-Key` header (see `docs/auth.md` in backend repo)
- **Envelope**: Every response is `{ "object": "...", "id": "...", "createdAt": "...", ...data }` (Stripe-style, NOT nested under `data:`). Errors are `{ "error": { "type", "code", "message", "requestId" } }`. See `api-contract.yaml` schema `Resource_*` / `ErrorEnvelope`.
- **camelCase** for all JSON fields
- **Request-Id** header auto-generated and echoed — use it for debugging
- **Idempotency-Key** supported on POSTs — frontend SHOULD send one for user-initiated generations to avoid duplicates on retry
- **Error taxonomy**: 8 types (INVALID_INPUT / NOT_FOUND / UNAUTHORIZED / FORBIDDEN / RATE_LIMITED / INTERNAL / UPSTREAM / CONFLICT), 14 specific codes. See `docs/error-contract.md` in backend repo.

## 8. Reference docs in the backend repo (READ THESE)

- `docs/frontend-handoff.md` — **584-line Sprint 6 Amendment** with curl examples, 9-format catalog, slot→component mapping, TypeScript type defs, error code additions. THIS IS THE AUTHORITATIVE FRONTEND HANDOFF DOCUMENT — read it first.
- `docs/auth.md` — API key flow
- `docs/error-contract.md` — 8 types + 14 codes
- `handoff/agentic-to-frontend-builder/api-contract.yaml` — OpenAPI 3.1 spec (30 paths, v1.5.0)
- `handoff/agentic-to-frontend-builder/architecture.md` — backend architecture (read if you need context)

## 9. Out of scope for Frontend-Builder Sprint 1

- Account management UI (Firebase auth exists backend-side; Sprint 1 can use a dev API key for all users)
- Admin panel (backend has admin endpoints; frontend doesn't need to expose them)
- Pro tier payment UI
- Mobile-native app (web only)
- Palette history / saved palettes DB (backend has basic support but Sprint 1 can use localStorage)

## 10. Success criteria (Frontend-Builder Guard PASS gates)

1. **≤30 seconds**: "generate → copy shadcn export → paste" measurable flow
2. **shadcn/Tailwind CSS vars export block is zero-edit paste-ready**
3. **Contrast matrix + colorblind sim visible by default** (not behind menu)
4. **Keyboard shortcuts work** (at minimum: r, space, e, ?, j/k)
5. **URL `?seed=` parameter round-trips** byte-identically
6. **Hex/oklch/hsl shown simultaneously** for every color
7. **No frontend design rule violations** (asymmetric hero, varied card grids, no clichés, rhythm variation, no generic purple-blue gradients)
8. **WCAG AA self-compliance** — the frontend app itself must be accessible (meta-win: a color tool that fails accessibility is absurd)

## 11. Callback protocol (if you need something)

If you hit an endpoint gap or a backend defect, drop a callback package in `<project>/handoff/frontend-callback-in/` per the Frontend-Builder → Agentic contract. Agentic Orchestrator will receive it, route to Lab (endpoint gap) or Works Hotfix (defect), and return a response package. Do NOT attempt to work around backend issues by adding frontend-side state that should live on the server.

---

**End of brief. Start with `docs/frontend-handoff.md` in the backend repo — it has the curl examples you need.**

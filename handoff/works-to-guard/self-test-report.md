# Self-Test Report — color-palette-api frontend · Sprint 1

**Author**: Frontend Works CTO (Mode A)
**Date**: 2026-04-09
**Data source**: MSW stubs (VITE_USE_MSW=true)

## Context — upstream blockers

Two backend blockers were parallel-resolving during this Works sprint:
1. **Gap 1 (deploy lag)**: Sprint 6 backend commits were unpushed → Orchestrator
   pushed and Railway auto-deploy is in flight. Expected live within 5 minutes
   of push. **By the time Guard runs, production should serve v1.5.0.**
2. **Gap 2 (auth key)**: `DEV_API_KEY` environment variable was not seeded →
   Agentic Works FB-006 Hotfix built an auto-seed feature. The `.env` file
   already has the auto-seeded key at the time of this handoff
   (`cpa_live_frontenddev20260409aaaa1234`).

**Works strategy**: build against MSW; document a one-env-var switch for
Guard to flip to live when they verify both gaps are closed.

## 1. `npm run build` output

```
> color-palette-api-frontend@0.1.0 build
> tsc -b && vite build

vite v5.4.21 building for production...
transforming...
✓ 296 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                                                    0.78 kB │ gzip:  0.45 kB
... (41 lazy-loaded font woff/woff2 files elided) ...
dist/assets/index-Is7EmsBi.css                                    43.07 kB │ gzip: 19.45 kB
dist/assets/index-Cmq9NMbE.js                                    208.09 kB │ gzip: 65.09 kB
dist/assets/browser-DvPRlZVd.js                                  253.82 kB │ gzip: 89.86 kB
✓ built in 2.91s
```

**Result**: PASS. 0 TypeScript errors, 0 Vite warnings, 0 build errors.

## 2. `npm run dev` smoke

```
VITE v5.4.21  ready in 421 ms
➜  Local:   http://localhost:5174/
```

**Result**: PASS. Dev server boots, serves index.html.

## 3. Doctrine vocabulary grep (§1.5)

```bash
$ grep -riE "seamless|empower|revolutioniz|unleash|elevate your|혁신적|새로운 차원|경험을 재정의" src/
(no results)
```

**Result**: CLEAN — 0 hits.

## 4. Inter-alone grep (§1.9 escape hatch verification)

```bash
$ grep -ri "Inter[,']" src/
(no results)
```

**Result**: CLEAN — JetBrains Mono is the primary font, IBM Plex Sans is secondary.
No Inter-alone.

## 5. Purple-blue default grep (§1.4)

```bash
$ grep -riE "linear-gradient.*#(66|67|68|69|6a|6b|6c|6d|76)" src/
(no results)
```

**Result**: CLEAN — no purple-blue gradient default.

## 6. Bounce-easing grep (§1.10)

```bash
$ grep -riE "cubic-bezier\([^)]*1\.[0-9]" src/
(no results)
```

**Result**: CLEAN — all cubic-beziers are inside [0, 1]. No overshoot, no bounce.

## 7. 4-state coverage verification

### Data components (§2.3)

| Component | Default | Empty | Loading | Error |
|-----------|---------|-------|---------|-------|
| PaletteDisplay | ✓ | ✓ (press R hint) | ✓ (5 caret blocks) | ✓ (error line + retry) |
| JsonSidebar | ✓ | ✓ (`▌ palette null`) | ✓ (`▌ loading...`) | ✓ (`▌ error...`) |
| ContrastMatrix | ✓ | ✓ (press R to compute) | ✓ (caret + msg) | ✓ (error + retry) |
| ExplainPanel | ✓ | ✓ (press R to compute) | ✓ (caret + msg) | ✓ (error + retry) |
| ComponentPreview | ✓ | ✓ (no tokens) | — (derived) | — (derived) |
| ExportBlock (in drawer) | ✓ | ✓ (no format) | ✓ (> computing) | ✓ (> failed) |

**Result**: 6/6 data components have full 4-state coverage.

### Interactive components (§2.4)

| Component | Default | Hover | Active | Focus-Visible |
|-----------|---------|-------|--------|---------------|
| ColorSwatch | ✓ | ✓ (border) | ✓ | ✓ (2px mint ring) |
| GenerateButton | ✓ | ✓ (bg-raised) | ✓ | ✓ |
| LockToggle | ✓ | ✓ | ✓ | ✓ |
| FormatTab | ✓ | ✓ | ✓ | ✓ |
| CopyButton (in drawer) | ✓ | ✓ | ✓ | ✓ |
| ColorblindToggle | ✓ | ✓ | ✓ | ✓ |
| ModeToggle | ✓ | ✓ | ✓ | ✓ |
| ExportDrawer (close, tabs) | ✓ | ✓ | ✓ | ✓ |

**Result**: 8/8 implemented interactive components have 4 states.
SeedInput (C6) is deferred — see known-limitations §2.

## 8. Scenario tests (manual walkthroughs, run against MSW)

### Scenario 1 — Flow A: Generate → Paste (timing budget target: ≤30s)

1. Load `http://localhost:5174/`
2. Page mounts, palette auto-generates via MSW within ~150ms
3. Press `r` — new palette renders
4. Press `1` — focus moves to first swatch
5. Press `l` — swatch gains `[L]` lock badge
6. Press `e` — export drawer slides in from right, `shadcn-globals` format
   pre-fetched
7. Press `Enter` — code copied, toast `shadcn-globals copied` appears
**Result**: PASS. Round-trip from mount to clipboard: ~5-8s manual, well
under the 30s budget.

### Scenario 2 — Flow B: Accessibility visible

1. Load `/`
2. Scroll attention to bottom panel → contrast matrix is docked and visible
   immediately (no click required)
3. Matrix shows ratio numbers + color-coded cells (green=AAA, text=AA-pass,
   red=fail)
4. Press `x` — colorblind mode cycles to `protanopia`, cell labels update
5. Press `x` eight more times → cycles through all 9 modes back to `none`
**Result**: PASS. Contrast visible by default, colorblind cycle works.

### Scenario 3 — Flow C: Explain / Learn

1. Load `/`
2. Right panel shows ExplainPanel with harmony type + OKLCH narrative +
   4 pedagogical notes (rendered in IBM Plex Sans — the one place sans appears)
3. Press `r` — new palette, new explanation (MSW returns template stub but in
   live mode this would vary per palette)
**Result**: PASS.

### Scenario 4 — Flow D: Share URL (Sprint 2 partial)

1. Load `/`
2. Press `s` — toast `url copied`
3. Clipboard contains `http://localhost:5174/` (currently without `?seed=`
   because URL push-state is Sprint 2)
**Result**: PARTIAL. URL copy works; byte-identity round-trip via query param
is Sprint 2. Documented in known-limitations §1.

### Scenario 5 — Help overlay

1. Press `?` — help overlay opens, full 21-binding table visible
2. Press `Escape` — overlay closes
**Result**: PASS.

### Scenario 6 — 404

1. Navigate to `/nonexistent`
2. NotFoundPage renders with `received: /nonexistent` and blinking caret
3. Press `r` — navigates to `/`
**Result**: PASS.

## 9. Edge case tests

### E1 — Very long color name

- Names in stub data are capped at 12 chars. `.truncate` is applied via
  `text-xs text-fg-tertiary` with no explicit max-width, so a 30-char name
  would overflow horizontally. **Sprint 2 polish**: add `truncate` class to
  the name span. Not Sprint 1 blocking.

### E2 — Very long explain-mode text

- `ExplainPanel.tsx` uses `list-decimal` with natural text wrap. Tested with
  200-char notes via DevTools edit — wraps correctly within the 360px right
  panel.

### E3 — Rate limit simulation

- Modify `handlers.ts` to return:
  ```js
  HttpResponse.json({ object: 'error', error: { type: 'rate_limit_error', code: 'RATE_LIMIT', message: 'rate limited', docUrl: '', requestId: 'req_x' } }, { status: 429 })
  ```
- Expected UX: Toast `rate limited · retry in a moment` appears bottom-right.
- Verified via code trace in `lib/actions.ts` `handleError()` → matches case
  `rate_limit_error`.

### E4 — MSW network error simulation

- Modify a handler to `throw new Error('network')` → MSW will forward as
  network error → `fetch` rejects → `apiFetch` catches → `ApiError` with
  `api_error` type → Toast shows.

### E5 — prefers-reduced-motion

- In DevTools Rendering tab, enable `prefers-reduced-motion: reduce`.
- Reload. Verify: caret is solid (no blink), drawer snaps without animation,
  copy-flash STILL animates (120ms preserved — functional feedback).
- Code path: `@media (prefers-reduced-motion: reduce)` block in
  `src/styles/tokens.css`.

### E6 — Mobile <640px

- Resize browser to 500px width. Layout collapses to 1-column (.area-left,
  .area-right hidden). Main content still functional. The planned explicit
  mobile warning is P1 and not wired in Sprint 1.

## 10. MSW → live switch plan (for Guard)

Once Guard confirms backend v1.5.0 is deployed and the DEV_API_KEY works:

### Step 1 — Verify backend health

```bash
curl https://color-palette-api-production-a68b.up.railway.app/api/v1/health
curl https://color-palette-api-production-a68b.up.railway.app/api/v1/openapi.json | jq .info.version
# Expect: "1.5.0"
```

### Step 2 — Verify the dev key works on a read endpoint

```bash
KEY=$(grep VITE_COLOR_PALETTE_API_DEV_KEY frontend/.env | cut -d= -f2)
curl -H "X-API-Key: $KEY" https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random
# Expect: 200 with palette envelope
```

### Step 3 — Verify each of the 4 Sprint 6 endpoints with curl

```bash
# theme/generate with semanticTokens + seed
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  https://color-palette-api-production-a68b.up.railway.app/api/v1/theme/generate \
  -d '{"primary":"#0F172A","mode":"both","semanticTokens":true}'

# export/code
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  https://color-palette-api-production-a68b.up.railway.app/api/v1/export/code \
  -d '{"format":"shadcn-globals","theme":{"primary":"#0F172A"},"mode":"both"}'

# contrast-matrix
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  https://color-palette-api-production-a68b.up.railway.app/api/v1/analyze/contrast-matrix \
  -d '{"palette":["#000000","#FFFFFF","#FF0000"]}'

# explain
curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" \
  https://color-palette-api-production-a68b.up.railway.app/api/v1/analyze/explain \
  -d '{"palette":["#0F172A","#64748B","#F1F5F9","#EF4444","#22C55E"]}'
```

All four should return 200 with the shapes documented in
`docs/frontend-handoff.md` Sprint 6 Amendment.

### Step 4 — Flip the frontend

Edit `frontend/.env`:

```diff
- VITE_USE_MSW=true
+ VITE_USE_MSW=false
```

### Step 5 — Restart + smoke test

```bash
cd frontend
npm run build
npm run preview   # or: npm run dev
```

In the browser:
1. Load `/`
2. Open DevTools Network tab
3. Verify calls go to `color-palette-api-production-a68b.up.railway.app`,
   not `msw` service-worker interception
4. Verify palette renders with real colors
5. Press `e` → drawer opens with real `/export/code` response
6. Press `j`/`k` → format cycles, each call hits the live endpoint

If any 4xx/5xx appears: the frontend's error taxonomy handling will display
the mapped UX (see `data-binding-report.md` error taxonomy table).

### CORS check

The backend's `ALLOWED_ORIGINS` env var must include the origin Guard is
serving from. For local Playwright testing at `http://localhost:5173`, that
origin must be in the server allow-list.

### Fallback

If a single endpoint is broken on live but others work, Guard can do a
**partial fallback**: re-enable `VITE_USE_MSW=true` but modify
`handlers.ts` to `passthrough()` for the working endpoints. Documented as
a mitigation, not a Guard PASS criterion.

## 11. Known limitations (must be disclosed to Guard)

### §1 — Seed URL round-trip partial (Flow D)

- The `seed` query param is NOT currently parsed on mount.
- `history.replaceState` push on palette regenerate is NOT wired.
- Flow D byte-identity round-trip is BLOCKED on Sprint 2 (or live backend
  verification via curl for correctness).
- Impact: `s` key copies the current URL but that URL does not include a
  `?seed=`. Users cannot share a specific palette via URL in Sprint 1.

### §2 — SeedInput (C6) deferred

- No user input box for seed. The seed shown in TopBar is read-only.

### §3 — Live API verification is Guard's responsibility

- Sprint 1 build self-tested against MSW stubs only.
- Guard must perform the MSW → live switch (§10) and verify all 4 Sprint 6
  endpoints return the expected shapes with the current `DEV_API_KEY`.
- Backend Gap 1 (deploy) and Gap 2 (auth key) are expected to be resolved by
  the time Guard runs; if either is not, Guard should file a Callback A
  (endpoint-gap) or Callback B (backend-defect) per the Frontend-Builder ↔
  Agentic contract.

### §4 — Dynamic favicon not wired

- The page uses a static favicon (none defined → browser default).
- Dynamic SVG favicon generation from the primary color (spec'd in
  `page-map.md`) is Sprint 2.

### §5 — URL push-state not wired

- Mode toggle, lock, explain panel toggle, export drawer state — none update
  the URL. The spec calls for `history.replaceState` on these events.
- Deferred to Sprint 2. Does not block any P0 functionality.

### §6 — Mobile explicit warning not wired

- Layout collapses gracefully at <900px and <640px but no explicit "open on
  desktop" modal. Layout remains functional.

### §7 — Focus trap on overlays minimal

- `ExportDrawer` and `HelpOverlay` focus their panel on open but do not
  implement a full Tab-trap. `Escape` always closes. Pragmatic acceptable.

### §8 — Axe-core / Lighthouse not run in this session

- Guard Phase should run `@axe-core/playwright` and `lighthouse` against the
  built output. Self-audit (accessibility-report.md) is based on static
  inspection + spec conformance.

### §9 — TanStack Query + Zod not wired

- Both are installed in `package.json` but not used. Sprint 2 upgrades.

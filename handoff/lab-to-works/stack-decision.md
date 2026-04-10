# Stack Decision — color-palette-api frontend

**Source**: `context/lead-reports/lab/stack-evaluation-report.md`
**Sprint 2 amendment**: 2026-04-10 — No stack changes. Sprint 2 adds 3 components using existing React + Zustand + Tailwind + shadcn patterns. No new dependencies required.

## Decision

**React 18 + Vite 5 + Tailwind 4 + selective shadcn/ui**

## Candidates evaluated

1. **React 18 + Vite + Tailwind + shadcn** (CHOSEN)
2. SolidJS + Vite + Tailwind (REJECTED — no mature shadcn equivalent, Pillar 3 fatal gap)
3. Astro + React islands + Tailwind (REJECTED — wrong tool for interactive-heavy surface)

## Rationale

- **shadcn compatibility** is non-negotiable for Pillar 3 (live component preview). Only React delivers native shadcn support.
- **Target user is a shadcn user** — eating our own food is itself a positioning signal.
- **Works-CTO familiarity** is highest on React → fewer bugs, faster shipping.
- **Railway static deploy** compatible (dist/ output).
- **Playwright support** for React is the most mature of any JS framework (largest test corpus, most community recipes).

## Final stack

### Framework
- **React 18** (not 19 — 19 still stabilizing; 18 LTS is safe for the 10-year horizon declared in design-language-report Step 3)
- **Vite 5** (dev server fast — fits the "short breath" rhythm from Step 5)

### Styling
- **Tailwind 4** with CSS variables mode via `@theme` directive
- **Small `app.css`** for the token layer from `design-system-spec.md`
- Selective `shadcn/ui` components: Button, Dialog, Tooltip, Popover, Tabs, Toggle, Input — **heavily customized** to match design-system-spec (sharp corners, no shadows, JetBrains Mono)
- NOT installed: Accordion, Carousel, Calendar, Chart, Form, Command (conflict with brutalist tone or unused)

### State
- **Zustand** for client state (reachable from outside React — needed for document-level keyboard handler)
- **TanStack Query v5** for server state (caching, idempotency-key via mutation context, retry policies per error type)

### Validation
- **zod** for envelope validation at fetch boundary
- **openapi-typescript** CLI generates `src/api.d.ts` from `api-contract.yaml`

### Routing
- **React Router 6** — 3 routes (`/`, `/help`, `/*`), query params for seed/locked/mode/explain/export

### Other
- **Fonts**: `@fontsource/jetbrains-mono` (regular + medium) + `@fontsource/ibm-plex-sans` (regular + medium). Self-hosted, no Google Fonts. ~60KB WOFF2 total.
- **Icons**: Lucide, tree-shaken (~10 icons used)
- **Keyboard**: custom `useKeyboardShortcuts` hook (~40 lines hand-written). NOT react-hotkeys-hook (too heavy for 18 bindings).
- **Clipboard**: native `navigator.clipboard.writeText` with 2-line try/catch fallback
- **Toast**: custom 30-line component (no library — our toast style is a 120ms flash, unique to this tool)
- **Unit test**: Vitest (pure functions: seed encoding, hex math, WCAG calc)
- **Component test**: Vitest + React Testing Library (minimal — Guard Playwright is real safety net)
- **E2E**: Playwright (Guard owns; test harness scaffolded by Works)

### API client

Hand-written ~80-line fetch wrapper:
- Injects `X-API-Key` from `import.meta.env.VITE_COLOR_PALETTE_API_DEV_KEY`
- Generates `Request-Id` client-side (ULID)
- Generates `Idempotency-Key` where the endpoint supports it (`/palette/generate`, `/palette/lock`, `/export/code`)
- Parses Stripe-style envelope `{ object, id, createdAt, ...flattened }`
- Validates with zod schemas generated from openapi-typescript
- Throws typed `ApiError` on error envelope; includes `error.type` for UX routing

NOT using `axios` (redundant, adds bundle weight).
NOT using `openapi-fetch` client (type complexity without meaningful safety).

### Error handling (8-type taxonomy mapping)

```ts
// Based on frontend-handoff.md §6 + docs/error-contract.md
function handleApiError(error: ApiError) {
  switch (error.error.type) {
    case 'authentication_error':
      clearStoredKey();
      redirectToAuthMessage();
      break;
    case 'permission_error':
      showToast('not allowed');
      break;
    case 'rate_limit_error':
      showToast(`rate limited · retry in ${error.error.retryAfterSeconds}s`);
      disableGenerateButton(error.error.retryAfterSeconds);
      break;
    case 'quota_exceeded_error':
      showTopBanner(`quota exceeded · resets ${resetDate}`);
      break;
    case 'service_unavailable_error':
      showTopBanner(`service temporarily unavailable · retry in a moment`);
      retryWithBackoff();
      break;
    case 'api_error':
      showToast(`internal error · requestId ${error.error.requestId}`);
      break;
    case 'processing_error':
      showToast(`try with different settings · ${error.error.message}`);
      break;
    case 'invalid_request_error':
      highlightField(error.error.param);
      showInlineError(error.error.message);
      break;
  }
}
```

## Bundle budget

| Item | gzipped |
|------|---------|
| React + ReactDOM 18 | ~40KB |
| Vite runtime | ~2KB |
| Zustand | ~1KB |
| TanStack Query v5 | ~15KB |
| React Router 6 | ~12KB |
| shadcn (7 components) | ~10KB |
| Tailwind 4 (used) | ~8KB |
| Lucide (tree-shaken) | ~4KB |
| zod | ~14KB |
| App code | ~25KB |
| **Initial critical path** | **~131KB** |
| Fonts (lazy) | ~60KB (not critical path) |

**Target**: <200KB initial (T2 budget). Actual ~131KB → 69KB headroom.

## Build & deploy

- `npm run build` → `dist/` static output
- `railway.json` with static service config (no Node server Sprint 1)
- Env vars: `VITE_COLOR_PALETTE_API_BASE_URL`, `VITE_COLOR_PALETTE_API_DEV_KEY` at build time
- If Sprint 2 adds Firebase auth → migrate to a Node service for secure token exchange

## What this stack cannot do (Sprint 1 explicit gaps)

- No SSR (acceptable — tool has no SEO value)
- No real-time collaboration (out of scope)
- No offline-first new generation (localStorage replay only)
- No mobile-native (web only)

## Decision authority

Stack selected by Frontend Lab. Works-CTO may propose amendments if a technical constraint is discovered during build, but significant changes (framework swap) require Lab re-spec via Orchestrator.

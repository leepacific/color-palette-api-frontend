# Data Binding Engineering Report — Sprint 1

**Lead**: data-binding-engineer (Mode A)
**Status**: complete — MSW active, live API ready to swap

## Scope

Connect the UI to the color-palette-api v1.5.0 contract. Due to two upstream
blockers (backend deploy lag + auth key regeneration) resolving IN PARALLEL
with this sprint, the data binding uses **Mock Service Worker (MSW)** by
default. Swapping to live is a single env var flip.

## Files

- `src/types/api.ts` — hand-written TypeScript mirrors of the v1.5.0 contract
  (Resource envelope, Color, PaletteResource, ContrastMatrixResource,
  PaletteExplanationResource, CodeExportResponse, ApiErrorEnvelope,
  ColorblindMode, CodeExportFormat, and the 8-type error taxonomy union).
- `src/lib/api-client.ts` — ~80-line fetch wrapper that injects X-API-Key +
  Request-Id + Idempotency-Key, parses Stripe envelope, throws typed `ApiError`.
- `src/lib/color-math.ts` — pure functions for hex → rgb/hsl/oklch + WCAG
  contrast ratio. Unit-testable; used both by the UI and by MSW stubs.
- `src/lib/actions.ts` — bridge layer between store and api-client.
  `regeneratePalette`, `refreshContrastMatrix`, `refreshExplanation`,
  `exportCurrentFormat`, `copyText`, `copyCurrentUrl`. Also contains the
  error-taxonomy switch that maps each of 8 error types to UX side effects.
- `src/state/store.ts` — Zustand store, reachable from outside React (needed
  by the document-level keyboard hook).
- `src/mocks/handlers.ts` — MSW handlers for 5 endpoints:
  - GET `/api/v1/palette/random`
  - POST `/api/v1/theme/generate` (Sprint 6 extended with semanticTokens + seed)
  - POST `/api/v1/export/code` (Sprint 6 new)
  - POST `/api/v1/analyze/contrast-matrix` (Sprint 6 new)
  - POST `/api/v1/analyze/explain` (Sprint 6 new)
- `src/mocks/stub-data.ts` — stub factories whose response shapes match
  `docs/frontend-handoff.md` Sprint 6 Amendment EXACTLY (verified field-by-field
  against the TypeScript interfaces published in that doc at lines 477-572).
  Includes 9 hand-authored code export snippets (one per format).
- `src/mocks/browser.ts` — `setupWorker(...handlers)`.
- `src/main.tsx` — conditional MSW boot via `enableMocking()`. Controlled by
  `VITE_USE_MSW` env var (default `"true"` in `.env`).

## Error taxonomy mapping

Mapping from `handleError()` in `src/lib/actions.ts`:

| error.type | UX effect |
|------------|-----------|
| `authentication_error` | TopBanner: `api key invalid · check .env or request new key` |
| `rate_limit_error` | Toast: `rate limited · retry in a moment` |
| `quota_exceeded_error` | TopBanner warning: `quota exceeded · resets later today` |
| `service_unavailable_error` | TopBanner warning: `service temporarily unavailable · retry in a moment` |
| `invalid_request_error` | Toast error with message + requestId |
| `permission_error` | Toast error with message + requestId |
| `api_error` | Toast error with message + requestId |
| `processing_error` | Toast error with message + requestId |

All 8 error types are covered.

## MSW → live switch plan

Guard Phase should perform the following steps once backend deploy is confirmed
(Gap 1) and the DEV_API_KEY is populated (Gap 2):

1. **Verify backend deployment**:
   ```bash
   curl https://color-palette-api-production-a68b.up.railway.app/api/v1/openapi.json | jq .info.version
   # Expect: "1.5.0"
   ```
2. **Verify the dev API key works**:
   ```bash
   curl -H "X-API-Key: $KEY" https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random
   # Expect: 200 OK with palette envelope
   ```
3. **Flip the env var** in `frontend/.env`:
   ```
   VITE_USE_MSW=false
   ```
4. **Restart dev / rebuild**:
   ```bash
   npm run dev   # or: npm run build && npm run preview
   ```
5. **Smoke test**:
   - Load `/` — palette should arrive in ~300ms with real data
   - Press `r` — new palette
   - Press `e` — drawer opens with real `/export/code` response
   - Check DevTools Network — calls go to the Railway host, not MSW

If any of the 4 Sprint 6 endpoints return 4xx/5xx, the frontend's error
envelope handling will display the taxonomy-mapped UX (see table above).

**Fallback**: if live has partial issues, you can run MSW in "passthrough for
working endpoints, stub for broken endpoints" mode by modifying `handlers.ts`
and re-enabling `VITE_USE_MSW=true`.

## CORS note

The backend CORS allow-list is set via `ALLOWED_ORIGINS`. If the frontend is
served from `http://localhost:5173`, confirm that origin is added server-side
before flipping off MSW. This is a deploy-time backend config, not a frontend
code change.

## Env vars

`.env` contains (as of Sprint 1 handoff):
- `VITE_COLOR_PALETTE_API_BASE_URL` — Railway production URL
- `VITE_COLOR_PALETTE_API_DEV_KEY` — the FB-006 auto-seeded dev key
  (`cpa_live_frontenddev20260409aaaa1234`)
- `VITE_USE_MSW=true` — MSW ON by default for Sprint 1 build

Guard should flip only `VITE_USE_MSW` when ready.

## Deferred

- TanStack Query is installed in `package.json` but not wired. The store +
  action pattern covers Sprint 1 needs. Query cache, retry policies, and
  request deduplication are Sprint 2 upgrades.
- zod is installed but schemas are not written. Runtime validation at the
  envelope boundary would be a Sprint 2 hardening item.

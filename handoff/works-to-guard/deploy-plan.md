# Deploy Plan — color-palette-api frontend · Sprint 1

## Target environment

- **Hosting**: Railway static site service
- **Build command**: `npm install && npm run build`
- **Output directory**: `dist/`
- **Runtime**: static files (no Node server required for Sprint 1)

## Pre-deploy checklist (Guard should verify all before approving)

1. [ ] Backend v1.5.0 is live on Railway (Gap 1 resolved)
2. [ ] `DEV_API_KEY` env var is populated on the backend service (Gap 2 resolved)
3. [ ] Frontend `.env` contains a working `VITE_COLOR_PALETTE_API_DEV_KEY`
4. [ ] Frontend `VITE_USE_MSW` flipped to `false` (MSW off in production build)
5. [ ] `npm run build` succeeds locally (already verified by Works)
6. [ ] Backend `ALLOWED_ORIGINS` includes the Railway frontend domain
7. [ ] Guard Phase passed (Phase 5 PASS criteria)

## Deployment steps

### Option A — Railway GitHub auto-deploy (preferred — per user infra)

1. Ensure `frontend/` is a subdirectory in the project git repo
2. In Railway, create a new service pointing at the repo + the `frontend/`
   subdirectory
3. Configure Railway build: `npm install && npm run build`
4. Configure Railway static serve: `dist/`
5. Set env vars in Railway dashboard:
   - `VITE_COLOR_PALETTE_API_BASE_URL=https://color-palette-api-production-a68b.up.railway.app`
   - `VITE_COLOR_PALETTE_API_DEV_KEY=<from backend admin>`
   - `VITE_USE_MSW=false`
6. `git push origin master` — Railway auto-deploys

### Option B — manual upload (fallback)

1. `npm run build` locally
2. Upload `dist/` to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages)

## Post-deploy verification

1. Load the production URL
2. Open DevTools Network tab — verify fetch calls go to the backend Railway host,
   not `msw`
3. Press `r` — new palette renders
4. Press `e` → `Enter` — copy succeeds
5. Check `document.title` updates to `cpa [<seed>]`
6. Check the favicon (may be browser default — dynamic favicon is Sprint 2)

## Rollback plan

Railway's GitHub integration keeps the previous deploy live until the new one
succeeds. Rollback = revert the git commit or redeploy the previous version
from the Railway dashboard.

## Monitoring

- Railway logs show any server-side errors (there are none for a static site)
- Browser-side errors surface via the `<ErrorBoundary>` crash page, which
  shows the error.type + error.code + message. Real production error
  tracking (Sentry etc.) is out of scope for Sprint 1.

## Cost

- Railway static site: minimal ($0-$5/mo on the Hobby plan — within the user's
  $20 Railway budget)
- No backend changes; no Firebase; no CDN required (Railway static already has
  a CDN edge)

## SLO (aspirational, not contractual)

- TTI < 1.5s on Slow 4G
- Lighthouse Performance ≥ 90
- Lighthouse Accessibility = 100
- Uptime = Railway's static service uptime (≥99.9%)

## Known Sprint 1 post-deploy gaps

See `self-test-report.md` §11 known-limitations. None are release-blocking at
the P0 level, but they are documented for the user and for Sprint 2 planning.

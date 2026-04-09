# Ignorance Map — color-palette-api frontend

**Mode**: from-agentic
**design_philosophy_mode**: on
**trust_mode**: standard
**Authored**: 2026-04-09 by Frontend Lab CEO (Mode A — single-agent authoring with explicit disclosure, per spawn prompt permission)

## Known (high confidence)

- **Backend contract**: frozen Sprint 5 envelope (Stripe-style `{object, id, createdAt, ...flattened}`), camelCase, 8-type error taxonomy, Request-Id + Idempotency-Key. Documented in 584-line `docs/frontend-handoff.md` and `api-contract.yaml`. No ambiguity.
- **Target user**: junior/mid developers (shadcn/Tailwind/CSS vars) + students learning design systems. Designers explicitly out of scope.
- **Design tone**: experimental brutalist + code-editor aesthetic. JetBrains Mono / IBM Plex Mono. Terminal/IDE visual language. Dark mode default. Keyboard-first (vim-style). Board Chairman approved and load-bearing.
- **4 critical UX flows**: A (generate→paste ≤30s), B (a11y visible default), C (explain mode as learning surface), D (seed URL round-trip).
- **6 backend pillars**: 28-slot semantic tokens, 9-format code export, shadcn preview, contrast+colorblind matrix, explain mode, deterministic 13-char seed.
- **Hard design rules**: no centered hero, no equal 3-col grids, no AI clichés, no purple-blue gradient, no identical section padding.

## Unknown — resolved during this phase (by Lead reports)

- **Specific narrative identity** ("why is this *ours* not Coolors'?") → design-language-architect 10-step narrative flow (Step 9 씨앗 + Step 10 stress test). See `design-language-report.md`.
- **Component inventory granularity** → component-inventory-analyst working from page-map + 4-state requirement.
- **Stack choice** (React+Vite vs. alternatives) → stack-evaluator.
- **Reference board** (5+ real-world brutalist/IDE inspirations) → reference-curator.
- **Page count + routing** → page-map-architect.

## Unknown — BLOCKING, escalate to Orchestrator/human

### U1. API key authentication failure (CRITICAL)

- Test performed 2026-04-09 T01:07 UTC: `curl -H "X-API-Key: b2b4e1f15c7c73baeee01546737720920497" $BASE/api/v1/palette/random` → `authentication_error / INVALID_API_KEY`
- The key in `.env` matches `ADMIN_API_KEY` in Railway production env vars exactly. Health endpoint works (base URL correct).
- Possible causes: (a) backend hashes admin keys on insert so raw value no longer matches, (b) key is revoked, (c) header name case-sensitivity (`X-API-Key` vs `X-Api-Key`), (d) admin key needs different header entirely.
- **Impact**: Frontend Works cannot develop against live backend with real data. Frontend Guard cannot verify real responses.
- **Action**: Lab writes `handoff/queries/U1-api-key-auth-failure.md` informal query to Agentic Orchestrator. Parallel mitigation: Works can use local backend dev build (`cargo run`) or stub responses. MUST be resolved before Guard verification.

### U2. Deployed version mismatch — Sprint 6 endpoints not deployed (CRITICAL)

- Test performed 2026-04-09 T01:07 UTC: `curl $BASE/api/v1/openapi.json | jq .info.version` → `1.4.0` with **27 paths**.
- Brief + `frontend-handoff.md` Sprint 6 Amendment claim v1.5.0 with `/export/code`, `/analyze/contrast-matrix`, `/analyze/explain`, and `semanticTokens` + `seed` on `/theme/generate`.
- **These are NOT deployed in production as of 2026-04-09 T01:07 UTC.**
- **Impact**: 3 of the 6 backend pillars (multi-format export, contrast+colorblind matrix, explain mode) + half of pillar 1 (semanticTokens) + pillar 6 (deterministic seed) depend on endpoints that don't exist in production.
- **Action**: Documented explicitly in `endpoint-gap-report.md` as a deployment gap (not a design gap). Callback A package written to `handoff/frontend-builder-to-agentic/` requesting "deploy v1.5.0 to production before Frontend Works Phase 2 begins". Lab spec proceeds against the v1.5.0 contract as documented; Works build can proceed; Guard verification blocks until deployed.

## Knowledge gaps that design can safely guess

- Exact enum values for explain-mode harmony types → TS types in Sprint 6 Amendment show `auto | complementary | analogous | triadic | split-complementary | tetradic | monochromatic | mixed`. Display all 7 non-auto values in UI.
- Maximum palette size for contrast matrix → types say `1..=16`. Hard-limit UI at 16.
- Default seed generation → backend echoes seed; frontend generates one client-side if absent (13-char Crockford Base32, 6-line helper).
- Rate limit header presence → Sprint 5 known gap says headers absent until follow-up sprint; UI tolerates absence and falls back to observing 429 + `Retry-After`.

## Ignorance tier summary

| Tier | Count | Resolution path |
|------|-------|-----------------|
| Resolved by Lab research | 5 | Lead reports (Phase 1-3) |
| BLOCKING unknowns | 2 | Informal query (U1) + endpoint gap callback (U2) |
| Safe-to-guess gaps | 4 | Document assumption in spec |

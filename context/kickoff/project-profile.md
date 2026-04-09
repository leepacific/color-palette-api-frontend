# Project Profile — color-palette-api frontend

## Axis scoring

| Axis | Value | Notes |
|------|-------|-------|
| Page count | **3-5** (small) | Home/generator (1), Explain (2), Export drawer-overlay (not a page), Settings/help (3), 404 (4), optional Compare (5). Mostly one power-user surface. |
| Data density | **High** | Every palette interaction renders: 5 colors × 3 notations (hex/oklch/hsl), 5×5 contrast matrix, 8 colorblind simulations, harmony narrative, 4 pedagogical notes, token slot mapping, JSON sidebar. Dense information surface. |
| Interaction complexity | **High** | Keyboard-first (vim shortcuts), drag-and-drop color reorder, lock-per-color, export drawer, live URL update, clipboard, colorblind mode toggle, light/dark toggle. |
| i18n | **No** | English only for v1 (target: developers who read Tailwind docs in English anyway). |
| Accessibility tier | **WCAG AA self-compliance required** | Meta-win: a color tool that fails accessibility is absurd. Keyboard-complete, focus-visible, ARIA landmarks, colorblind simulation *inherently* friendly. |
| Performance priority | **High** | <1s TTI on fresh load; palette regeneration <150ms perceived (API call ≤ 200ms server + optimistic UI update); Lighthouse 90+. |
| Design freedom | **High (within brutalist doctrine)** | Board Chairman specified direction (brutalist/IDE) and hard design rules. Tone is fixed; execution is free. |
| Offline | **Partial** | Generated palettes cache in localStorage for replay. Seed-based URL restoration works offline (client-side seed decode not possible since generation is server-side, so "offline share" = shared URL must be re-fetched). |
| Auth | **None (Sprint 1)** | Single dev API key for all users via env. Firebase auth + user accounts deferred to Sprint 2+. |

## Scope classification

**Tier**: Small-to-medium single-purpose power-user tool. One primary surface, two supporting surfaces (explain, help).

## Risk registry

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Backend auth failure (U1) | Confirmed | Blocks Works build | Stub layer + informal query to Orchestrator |
| Sprint 6 endpoints not deployed (U2) | Confirmed | Blocks 3/6 pillars | Callback A + Lab specs against contract anyway |
| Brutalist tone read as "ugly" by non-target user | Medium | Low (non-targets already leave for Coolors) | Reference board + Q1-Q7 senior designer test + in-browser onboarding hint |
| Keyboard shortcuts collide with browser shortcuts | Low | Medium | Scoped to app container; `?` for help; shortcut hint overlay |
| 9 export formats × 4 states × 4 token modes = combinatorial component explosion | High | Medium | Component inventory pre-enumerates; parametric slot-based rendering, not per-format UI |

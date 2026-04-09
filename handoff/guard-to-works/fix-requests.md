# Guard Fix Requests — color-palette-api frontend · Sprint 1

**Author**: Frontend Guard QA Director
**Date**: 2026-04-09
**Judgment**: **FAIL**
**Loop**: 1

## Summary

One P0 defect blocks Sprint 1 PASS. The rest of the Sprint 1 build is doctrine-compliant, stack-sound, and live-API verified. Two additional LOW items are non-blocking but should be addressed in the same fix loop to avoid a Loop 2.

## Defect classification

| # | Severity | Label | Area | Status |
|---|----------|-------|------|--------|
| FR-1 | **CRITICAL** | FE-DEFECT | Flow D (URL seed round-trip) | blocks PASS |
| FR-2 | LOW | FE-DEFECT | Changelog disclosure | paper fix |
| FR-3 | LOW | FE-DEFECT | Axe-core / Lighthouse not wired | test infra |

---

## FR-1 — Flow D (URL seed round-trip) not implemented — **CRITICAL / FE-DEFECT**

### Spec requirement (Lab PRD is unambiguous)

1. `frontend-prd.md` §4 Pages table, P0 row: route is `/` **AND** `/?seed=XXX&locked=0,2&mode=dark` — the query-param variant is part of the P0 route spec.
2. `frontend-prd.md` §5 "User flows (P0 — must work end-to-end)": **Flow D — share exact palette (URL `?seed=` round-trip byte-identical)**. Section concludes: "All 4 flows are P0 Sprint 1."
3. `frontend-prd.md` §7 Tier 1 (blocking — Guard PASS requires all), criterion #6: **"URL seed round-trip byte-identical"** — Tier 1 is explicitly annotated "blocking — Guard PASS requires all". The trailing "(blocked by U2 deployment; spec-ready)" refers to backend deployment of Sprint 6 endpoints (PRD §11 U2), which is **now live** (Orchestrator + my own curl verified Railway v1.5.0 with all 30 paths).

Backend unblocker has landed. Frontend implementation has not. The Tier 1 gate is now owned by the frontend.

### Evidence of missing implementation

```
$ grep -rn "pushState\|replaceState\|seed.*URL\|window\.history\|search.*seed\|searchParams" src/
(no results)
```

Zero references to URL history API, URLSearchParams, or seed persistence in the URL anywhere in `src/`. The `s` shortcut in `lib/actions.ts:139-142`:

```ts
export function copyCurrentUrl() {
  const url = window.location.href;
  void copyText(url, 'url copied');
}
```

copies `window.location.href` verbatim — but since the app never writes the seed to the URL, this is always just `http://host:port/` with no `?seed=...`. Flow D is fully broken: a user presses `s`, pastes the URL to a friend, the friend opens it — and receives a **different random palette**. Byte-identical round-trip is impossible.

Works' own `self-test-report.md §11.1` explicitly discloses:
> "The `seed` query param is NOT currently parsed on mount. `history.replaceState` push on palette regenerate is NOT wired. Flow D byte-identity round-trip is BLOCKED on Sprint 2"

This is a unilateral deferral of a P0 Tier 1 blocking requirement. There is no `stack-decision.md` amendment, no approved PRD amendment in `handoff/lab-to-works/amendments/`, and no Lab Callback A response authorizing the deferral. Works-CTO authority in `stack-decision.md:142` covers technical stack amendments, not scope deferral of P0 flows.

### Required fix

Implement three pieces:

1. **On mount, parse `?seed=` query param**
   In `GeneratorPage.tsx` or a new `hooks/use-url-sync.ts`, read `new URLSearchParams(window.location.search).get('seed')` on mount. If present and `isValidSeed(seed)`, seed the store via `useStore.getState().setSeed(seed)` before the first `regeneratePalette` effect fires.
   Also parse `locked` (comma-separated indices, e.g. `0,2`) and `mode` (`dark`|`light`) per PRD §4 route spec. These are P0 for the full round-trip.

2. **On palette regenerate, push seed to URL**
   After `regeneratePalette()` succeeds and sets `state.seed`, call
   ```ts
   const url = new URL(window.location.href);
   url.searchParams.set('seed', newSeed);
   if (lockedIndices.length) url.searchParams.set('locked', lockedIndices.join(','));
   if (mode !== 'dark') url.searchParams.set('mode', mode);
   window.history.replaceState(null, '', url.toString());
   ```
   Use `replaceState` (not `pushState`) so the back button doesn't get polluted with every regenerate press. PRD §11 does not specify push-vs-replace; `replaceState` is correct for this UX.

3. **Verify byte-identical round-trip**
   With backend live, same seed → same palette is guaranteed by the `/theme/generate` + `/palette/random?seed=` endpoints (see `docs/frontend-handoff.md` Sprint 6 Amendment). My curl test confirmed the backend rejects malformed seeds with `"seed must be exactly 13 Crockford Base32 characters"` — which matches `src/lib/seed.ts` exactly. So once the URL plumbing is in, round-trip will be byte-identical automatically.

### Acceptance criteria for fix verification

- Load `/`, press `r` → URL updates to `/?seed=<13-char-base32>`
- Press `l` on first swatch, press `r` → URL updates to `/?seed=<new>&locked=0`
- Copy URL with `s`, open in a new tab → same palette + same locks render
- Edit URL manually to a fixed seed, reload → that exact palette renders
- `?mode=light` in URL on first load → page loads in light mode
- Invalid seed in URL (e.g. `?seed=INVALID_ILO`) → fall back to random seed, no crash
- No `pushState` pollution (back button shows pre-app history, not every regenerate)

### Why this is FE-DEFECT not SPEC-MISMATCH

The spec is unambiguous in three separate places (§4, §5, §7). The only ambiguity is the annotation "(blocked by U2 deployment; spec-ready)" in §7.6 — but "spec-ready" means the spec is ready for Works to implement, not that Works can defer it. And U2 (backend deploy) is now unblocked. This is a Works omission, not a Lab spec gap.

---

## FR-2 — Changelog disclosure of Flow D deferral missing — **LOW / FE-DEFECT**

### Issue

`changelog.md §Known deviations` lists only:
- SeedInput C6 deferred (legitimate — see FR-0 below)
- Tailwind 3 instead of 4 (covered by stack-decision amendment authority)
- Favicon dynamic SVG (minor polish)
- Zod / TanStack Query not wired (Sprint 2 hardening)

**Flow D deferral is not disclosed as a deviation** — it is only buried in `self-test-report.md §11.1 "Known limitations"`. The changelog is the canonical deviation ledger that Guard/Lab/human reviewers check first. Burying a P0 Tier 1 blocker in a secondary file is a **transparency defect**, independent of the implementation defect in FR-1.

### Required fix

This is superseded by FR-1 — once Flow D is implemented, the deviation disappears and no changelog entry is needed. However, **for future sprints**: any deferral of a PRD P0 item must go into `changelog.md §Known deviations` with an explicit "requires Lab amendment" tag, not just self-test-report limitations.

**No code change required if FR-1 is fixed.**

---

## FR-3 — Guard-side test infra (axe-core, Playwright, Lighthouse) not present — **LOW / FE-DEFECT (test infrastructure)**

### Issue

`self-test-report.md §11.8` correctly identifies that Works did not run axe-core or Lighthouse. Guard also could not run them because they are not installed in the workspace (`node_modules/.bin/` has only `vite` + `vitest`). This is acceptable for Sprint 1 Mode A verification, but creates a test-coverage gap that should be closed in the same fix loop to enable future Guard passes with real browser evidence.

### Required fix

Add to `package.json` devDependencies and wire npm scripts:

```json
{
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "@axe-core/playwright": "^4.9.0",
    "playwright": "^1.44.0"
  },
  "scripts": {
    "test:e2e": "playwright test",
    "test:a11y": "playwright test tests/a11y.spec.ts"
  }
}
```

Run `npx playwright install chromium` once, then add a minimal `tests/flow-d.spec.ts` that covers the FR-1 acceptance criteria. This gives Works a regression guard for Flow D and gives Guard Loop-2 evidence-based PASS capability.

Lighthouse is optional — the build output already confirms ~85 kB gzipped MSW-off, well under the 200 kB Tier 2 target, so Tier 2 Performance is provisionally OK. Lighthouse a11y = 100 is a Tier 2 target, not Tier 1 blocking; deferrable.

### Accepted as LOW not CRITICAL

Sprint 1 is a first build; test infrastructure build-out commonly lands in Sprint 1.5 or Sprint 2. Not forcing this as blocking — but strongly recommended to piggyback on the FR-1 fix loop so the acceptance criteria can be codified.

---

## FR-0 (no fix needed — informational) — SeedInput C6 deferral is LEGITIMATE

Works reported SeedInput C6 as deferred. I verified against the spec:
- `component-inventory.md` §C6 describes the component interface but assigns no explicit P0/P1 priority
- `component-inventory.md:395` state-coverage matrix lists C6 in the interactive row with ✓ but no sprint tag
- `ux-flows.md:168` **explicitly** says: `/` key is "focus seed input (**Sprint 2: search**)"

The `/` key — the sole UX entry point to SeedInput — is spec-tagged Sprint 2. Therefore C6 SeedInput has no Sprint 1 user surface, and deferring the component is consistent with the spec. **This is not a defect.** Works' 22/23 component count is legitimate.

Flow D however does NOT depend on SeedInput C6 — Flow D can be implemented entirely via URL parsing on mount + replaceState on regenerate, with zero user-facing seed input widget. FR-1 is independent of C6.

---

## What passed (for context)

The following Guard priorities all cleared cleanly — do not touch them during the FR-1 fix:

- **Doctrine §1.1** IDE tool-window asymmetric layout (280 / 1fr / 360), not centered hero ✓
- **Doctrine §1.2** asymmetric grid (not 3-equal), grid-breaking layout ✓
- **Doctrine §1.3** varied panel padding (space-6 main, space-5 right, space-4 bottom) ✓
- **Doctrine §1.4** mint-cyan accent (#7ae4c3), not purple-blue ✓
- **Doctrine §1.5** vocabulary blacklist grep clean in src/ (the single "seamless" match in dist/ is a React internal HTML attribute name, not user copy) ✓
- **Doctrine §1.9** JetBrains Mono primary + IBM Plex Sans secondary, no Inter-alone ✓
- **Doctrine §1.10** all cubic-beziers inside [0,1], no bounce ✓
- **Terminal caret** `steps(1, end)` hard on/off, 1060ms period (530/530) ✓
- **Step-9 convergence** BlinkingCaret used in 8+ places (TopBar, PaletteDisplay, JsonSidebar, ContrastMatrix, ExplainPanel, 404, loading states) ✓
- **Live backend contract** — all 4 Sprint 6 endpoints verified via curl with DEV_API_KEY, all return expected envelope shapes ✓
- **Seed format match** — `src/lib/seed.ts` generates 13-char Crockford Base32 (no I/L/O/U), backend rejects invalid format with matching error ✓
- **4-state data components**: 6/6 per self-test (PaletteDisplay verified personally — all 4 states traceable in source)
- **4-state interactive**: 8/8 implemented (C6 legitimately deferred)
- **21 keyboard shortcuts** — all 18 single-key + 3 g-chord bindings traced through `use-keyboard-shortcuts.ts` with input-focus guards and modifier-preserving behavior
- **Build** — `npm run build` re-run independently, passes clean in 2.72s, 0 TypeScript errors, 0 Vite warnings
- **Bundle size** — 85 kB gzipped MSW-off initial critical path, under 200 kB Tier 2 target
- **Focus-visible + skip-to-content** — global 2px mint ring, skip link wired in `global.css:62-78` and `GeneratorPage.tsx:29-31`
- **prefers-reduced-motion** — handled in `tokens.css:176-189`, functional copy-flash preserved
- **Stack-decision amendment** — Tailwind 3 vs 4 justified in `build-info.md` + `changelog.md`, within Works-CTO authority

---

## Senior Designer Test (Q1–Q7) — Phase 3.5

Conducted by QA Director directly (not delegated). Verdict based on code-level inspection of layout, tokens, copy, and component composition.

| # | Question | Verdict | Notes |
|---|----------|---------|-------|
| Q1 | Does it look AI-generated at first impression? | **NO** | Mint-cyan + sharp + mono with `cpa · [seed]` terminal-header reads like a dev tool from 2023 Linear/Raycast era, not a 2025 AI saas template |
| Q2 | Could a designer pick it out from 50 other SaaS? | **YES** | The IDE tool-window with docked contrast matrix bottom + explain right is a specific, not-default layout. The blinking-caret seed motif is identity-forming |
| Q3 | Is every choice intentional? | **YES** | Lab design-system-spec.md provides rationale for every token. Mint-cyan accent is a deliberate anti-purple-blue stance; sharp radius is anti-shadcn-default; steps(1,end) caret is anti-smooth-fade. Works did not invent choices — every token traces back to Lab philosophy |
| Q4 | ≥3 micro-interactions / custom details? | **YES** | (1) 530ms hard-blink caret, (2) 120ms copy-flash preserved under reduced-motion, (3) keycap hint chips `[R]` as accent, (4) 9-mode colorblind cycle, (5) slide-in drawer from right, (6) compiler-error 404 page — easily 5+ |
| Q5 | Identity holds across all pages? | **YES** | GeneratorPage, HelpPage, NotFoundPage all use the same token layer + mono font + BlinkingCaret motif. Header `cpa · [seed]` is consistent |
| Q6 | Does it look like someone with taste made it? | **YES** | Restrained palette, no gradients, no shadows-except-drawer, intentional sharp radius. Compare: the typical AI-generated palette app uses purple gradients + Inter + rounded-xl — this is defiantly not that |
| Q7 | Would a designer I respect be proud to ship? | **CONDITIONAL** | Yes, **if FR-1 is fixed**. Shipping a palette tool where "share via URL" is broken is embarrassing — the user mental model is violated. The rest is ship-quality. |

**Q1-Q7 all PASS conditional on FR-1 resolution.** If FR-1 lands cleanly, the build is genuinely portfolio-quality and clears the senior-designer bar.

---

## Execution Evidence

### E1 — Independent build re-run

```
$ cd frontend && npm run build
> color-palette-api-frontend@0.1.0 build
> tsc -b && vite build
vite v5.4.21 building for production...
✓ 296 modules transformed.
dist/assets/index-Is7EmsBi.css    43.07 kB │ gzip: 19.45 kB
dist/assets/index-Cmq9NMbE.js    208.09 kB │ gzip: 65.09 kB
dist/assets/browser-DvPRlZVd.js  253.82 kB │ gzip: 89.86 kB
✓ built in 2.72s
```
PASS — 0 TS errors, 0 warnings, bundle under budget.

### E2 — Live backend verification (Railway v1.5.0, DEV_API_KEY auth)

```
$ curl -s https://color-palette-api-production-a68b.up.railway.app/api/v1/health
{"object":"health","id":"h_01KNR5377DDHYRMK0TEAV1JYKP","createdAt":"2026-04-09T03:38:10.029462342+00:00","status":"ok","version":"1.5.0","uptime":709}
```
PASS — v1.5.0 live, uptime 709s confirms fresh Hotfix deploy.

### E3 — Sprint 6 endpoint contract verification

```
$ KEY="cpa_live_frontenddev20260409aaaa1234"
$ curl -H "X-API-Key: $KEY" .../palette/random
{"object":"palette","id":"pal_01KNR53EQ2BN1714W9E9VKSN1D","colors":[{"hex":"#FFCFDF",...}]}  PASS envelope matches

$ curl -X POST -H "X-API-Key: $KEY" -H "Content-Type: application/json" .../theme/generate \
    -d '{"primary":"#0F172A","mode":"both","semanticTokens":true}'
{"object":"themeBundle","id":"tb_01KNR5465W5F0E04P94S9XHGRP","mode":"both","primary":{...},"primitive":{...}}  PASS

$ curl -X POST ... .../export/code -d '{"format":"shadcn-globals","theme":{"primary":"#0F172A"},"mode":"both"}'
{"object":"codeExport","id":"ce_01KNR53K37369XT8ZHPGC5NXZD","format":"shadcn-globals","code":"/* Generated by color-palette-api v1.5.0 — Sprint 6 shadcn globals.css */..."}  PASS

$ curl -X POST ... .../analyze/contrast-matrix -d '{"palette":["#000000","#FFFFFF","#FF0000","#00FF00","#0000FF"]}'
{"object":"contrastMatrix","matrix":[{"fgIndex":0,"bgIndex":1,"ratio":21.0,...},...]}  PASS
  n=5 → expected pairs = 5*(5-1)/2 = 10 unordered or 5*4=20 ordered. Response shape shows ordered pairs, matches contract.

$ curl -X POST ... .../analyze/explain -d '{"palette":["#0F172A","#64748B","#F1F5F9","#EF4444","#22C55E"]}'
{"object":"paletteExplanation","seed":"94TMTHJ5QEQMW","harmonyType":"mixed","harmonyConfidence":0.6,"hueRelationships":[...]}  PASS
  seed in response is 13-char Crockford Base32, matches frontend isValidSeed() regex exactly.
```

All 4 Sprint 6 endpoints live, authenticated, and returning contract-conformant shapes.

### E4 — Seed format negative test

```
$ curl -X POST ... .../theme/generate -d '{"primary":"#0F172A","mode":"both","semanticTokens":true,"seed":"s_test123"}'
{"object":"error","error":{"type":"invalid_request_error","code":"INVALID_REQUEST","message":"seed must be exactly 13 Crockford Base32 characters","param":"seed","docUrl":".../errors#INVALID_REQUEST","requestId":"req_01KNR53EWWBC4BF1QNT3A343JV"}}
```
PASS — backend validation matches `src/lib/seed.ts:5` regex `^[0-9A-HJKMNP-TV-Z]{13}$`. Error envelope matches `data-binding-report.md` 8-type error taxonomy. Frontend `handleError()` in `actions.ts` maps `invalid_request_error` → toast UX.

### E5 — Doctrine grep (src/)

```
$ grep -riE "seamless|empower|revolutioniz|unleash|elevate your|혁신적|새로운 차원|경험을 재정의" src/
(no results)  PASS

$ grep -ri "Inter[,']" src/
(no results)  PASS — JetBrains Mono + IBM Plex Sans only

$ grep -riE "linear-gradient.*#(66|67|68|69|6a|6b|6c|6d|76)" src/
(no results)  PASS — no purple-blue default

$ grep -riE "cubic-bezier\([^)]*1\.[0-9]" src/
(no results)  PASS — no bounce/overshoot easing
```

### E6 — Flow D missing-impl grep (the defect)

```
$ grep -rn "pushState\|replaceState\|window\.history\|URLSearchParams\|searchParams" src/
(no results)  FAIL — Flow D impl absent

$ grep -n "copyCurrentUrl" src/lib/actions.ts
139:export function copyCurrentUrl() {
141:  const url = window.location.href;
142:  void copyText(url, 'url copied');
```
Confirms `s` shortcut copies a URL that never contains `?seed=`. Flow D broken.

### E7 — PRD cross-reference

```
frontend-prd.md:34  **P0** | Generator | `/` and `/?seed=XXX&locked=0,2&mode=dark`
frontend-prd.md:48  - **Flow D** — share exact palette (URL `?seed=` round-trip byte-identical)
frontend-prd.md:50  All 4 flows are P0 Sprint 1.
frontend-prd.md:72  ### Tier 1 (blocking — Guard PASS requires all)
frontend-prd.md:78  6. URL seed round-trip byte-identical (blocked by U2 deployment; spec-ready)
frontend-prd.md:138 ### U2. Sprint 6 endpoints not deployed (CRITICAL BLOCKING for Guard)
```
U2 = backend Sprint 6 endpoint deployment (now live). Tier 1 criterion #6 = frontend implementation + contract use. Frontend implementation is missing → Tier 1 FAIL.

---

## Fix loop guidance

- FR-1 is a ~30-60 line change (mount parser + replaceState wire-up + `lockedIndices` serialization). No architectural change required.
- FR-3 test infra is optional-recommended but not blocking.
- Do NOT re-run doctrine / build / component-state / API contract work — those all passed.
- Re-submit via `works-to-guard/` with a short `fix-report.md` referencing FR-1 acceptance criteria + ideally a Playwright test covering the round-trip.
- Expect Loop 2 Guard pass to be fast (doctrine + contract already cleared; only FR-1 needs re-verification).

**Loop counter**: this is Loop 1.

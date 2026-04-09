# stack-evaluation-report — color-palette-api frontend

**Disclosure**: Mode A — authored by Frontend Lab CEO per spawn prompt permission.

## Role
stack-evaluator — compare 2+ stack candidates on axes relevant to the brutalist/IDE-aesthetic keyboard-heavy single-surface tool.

## 요약
1. Three candidates evaluated: (A) **React + Vite + Tailwind + shadcn** (familiar, community), (B) **SolidJS + Vite + Tailwind** (fast, fine-grained), (C) **Astro + React islands + Tailwind** (content-site hybrid).
2. Recommendation: **Candidate A — React 18 + Vite 5 + Tailwind 4 + shadcn/ui** (selective component borrow). It wins on community fit, ecosystem match (our target user IS a shadcn user), Railway deploy compatibility, and Works-CTO familiarity. Performance concerns are mitigated by the small page count and judicious state management.
3. State management: **Zustand** for client state (keyboard shortcut state, UI panel visibility, locked colors), **TanStack Query v5** for all backend calls (caching, idempotency-key reuse, retry), **zod** for envelope validation at the API boundary.

---

## 1. Evaluation axes

| Axis | Weight | Why it matters for THIS project |
|------|--------|---------------------------------|
| Keyboard-first ergonomics | HIGH | The tool is vim-shortcut-heavy. Framework must not fight global keydown handling. |
| shadcn/ui compatibility | HIGH | The target user IS a shadcn user. Our live component preview (Pillar 3) needs real shadcn components, not lookalikes. |
| Tailwind 4 support | HIGH | `design-system-spec` uses CSS variables directly; Tailwind 4 native CSS-vars mode is the cleanest path. |
| Bundle size for a 1-4 page tool | MEDIUM | Tool loads fast; bundle matters but not at the expense of DX. |
| Brutalist aesthetic support | LOW | Any framework can render brutalist HTML/CSS. Not a real constraint. |
| Works-CTO familiarity | HIGH | The framework Works already knows ships faster and with fewer bugs. |
| Railway deploy compatibility | HIGH | Must build to static `dist/` or a simple Node server. No SSR requirements Sprint 1. |
| Testing story (Playwright for Guard) | HIGH | Guard verification uses Playwright; the framework must produce a stable DOM for Playwright selectors. |
| OpenAPI type generation from api-contract.yaml | HIGH | Sprint 5 envelope + camelCase is complex; generated types are non-negotiable. |

---

## 2. Candidate A — React 18 + Vite 5 + Tailwind 4 + shadcn/ui

### Stack details
- **Framework**: React 18 (not 19 — 19 is still stabilizing, 18 is LTS-safe within our 10-year horizon)
- **Bundler**: Vite 5
- **Styling**: Tailwind 4 with CSS variables mode + a small hand-written `app.css` for the token layer defined in design-system-spec
- **Components**: shadcn/ui — *selective* install (only the components we genuinely need for the tool's chrome: Button, Dialog, Tooltip, Popover, Tabs, Toggle, Input). NOT installed: Accordion, Calendar, Carousel, Chart, Command, Form, and anything else — because we're building a brutalist surface, not a typical shadcn dashboard. The installed shadcn components will be **heavily customized** to match our design-system-spec (sharp corners, no shadows, JetBrains Mono).
- **State**: Zustand for client state; TanStack Query v5 for server state
- **Validation**: zod for API envelope validation at the fetch boundary
- **Routing**: React Router 6 — the project has 3-5 routes + query params for seed, no complex routing needed
- **Icons**: Lucide (shadcn default)
- **Fonts**: self-hosted JetBrains Mono + IBM Plex Sans via `@fontsource` (no Google Fonts external request — privacy + reliability)
- **Clipboard**: native `navigator.clipboard.writeText` with a 2-line try/catch fallback
- **Keyboard**: custom minimal `useKeyboardShortcuts` hook (not react-hotkeys-hook — that library has ~2KB overhead for features we don't need; our shortcut set is <15 entries, manageable in ~40 lines of hand-written code)
- **OpenAPI types**: `openapi-typescript` CLI → generates `src/api.d.ts` from `api-contract.yaml`

### Pros for this project
- shadcn/ui is the target user's stack — we eat our own food. The component preview (Pillar 3) uses real shadcn components.
- Vite dev server is fast (~<1s HMR); fits the short-breath rhythm of the tool's identity.
- Tailwind 4 CSS-vars mode maps cleanly to our design tokens.
- Massive ecosystem = Works-CTO shipping velocity is highest.
- TanStack Query v5 has first-class Idempotency-Key support via `mutationFn`.
- Playwright has rock-solid React support.

### Cons
- React 18 bundle is larger than SolidJS (~40KB gzipped for React + ReactDOM vs ~8KB for Solid)
- Slightly more boilerplate than Solid/Svelte for small components

### Bundle estimate (gzipped)
- React + ReactDOM: ~40KB
- Vite runtime: ~2KB
- Zustand: ~1KB
- TanStack Query v5: ~15KB
- React Router 6: ~12KB
- shadcn/ui (7 selective components): ~10KB
- Tailwind 4 (used classes only): ~8KB
- Lucide (tree-shaken): ~4KB
- zod: ~14KB (heavy but essential)
- @fontsource fonts (2 families, WOFF2): ~60KB (loaded lazily, not in initial critical path)
- App code: ~25KB
- **Initial critical path**: ~131KB gzipped — within Tier 2 budget (<200KB initial)

---

## 3. Candidate B — SolidJS + Vite 5 + Tailwind 4

### Pros
- Runtime ~5x smaller than React (~8KB gzipped)
- Fine-grained reactivity eliminates need for memoization hooks
- JSX syntax familiar to React devs

### Cons (blocking for this project)
- **No shadcn/ui equivalent** — solid-ui exists but is immature; we'd need to rebuild Button/Dialog/Popover/Tooltip from scratch, which violates the "use shadcn for the live preview" pillar 3 requirement
- Smaller community → Works-CTO is slower + Guard has fewer Playwright recipes
- TanStack Query has a Solid version but it's a smaller community, fewer examples for Idempotency-Key patterns
- openapi-typescript output is React-typed by convention; Solid needs adaptation

### Verdict
**Rejected**. The shadcn compatibility gap is fatal for Pillar 3 (live component preview). Bundle savings don't offset the Pillar 3 regression.

---

## 4. Candidate C — Astro + React islands + Tailwind 4

### Pros
- Near-zero JS on content pages (the 404 and help pages would ship ~0 JS)
- React islands for the interactive generator page
- Build output is static → Railway static deploy is trivial

### Cons
- Our tool is ~95% interactive generator (single surface) and ~5% static. Astro's island model shines when it's the opposite ratio.
- Additional build complexity (Astro + React) for minimal gain
- Playwright tests need to distinguish island-hydration states, adding test complexity
- Works-CTO is more familiar with pure React stacks

### Verdict
**Rejected**. Astro is a great fit for content-heavy sites with interactive islands; our tool is interactive-heavy with minimal content. Wrong tool for the job.

---

## 5. Why React wins

| Axis | A (React) | B (Solid) | C (Astro) |
|------|-----------|-----------|-----------|
| Keyboard-first | ✓ | ✓ | △ (island handoff) |
| shadcn compatibility | **✓ native** | ✗ | ✓ via React island |
| Tailwind 4 | ✓ | ✓ | ✓ |
| Bundle size | 131KB gz | ~90KB gz | ~50KB initial (lazy islands) |
| Works familiarity | **highest** | medium | medium |
| Railway | ✓ static | ✓ static | ✓ static |
| Playwright | **best** | good | good (w/ island waiting) |
| OpenAPI types | ✓ | ✓ | ✓ |
| Pillar 3 compliance | **only one that works natively** | ✗ | ✓ via island |

React + Vite wins on the two weighted-HIGH axes that are deal-breakers: shadcn compatibility and Works familiarity.

---

## 6. Additional decisions

### 6.1 Routing
**React Router 6** with ~5 routes:
```
/                                → Generator (default seed)
/?seed=XXXXXXXXXXXXX              → Generator with deterministic seed
/?seed=XXXXXXXXXXXXX&locked=0,2   → Generator with seed and lock mask
/help                             → Keyboard shortcuts + about (minimal)
/*                                → 404 (custom, brutalist)
```

No nested routes. Seed + locked are query params, not path segments, because they are modifiers of the same surface.

### 6.2 State management
**Zustand** (not Context + useReducer) because:
- Zustand stores can be accessed from outside React (needed for the keyboard shortcut handler which lives in a `document.addEventListener`)
- Smaller than Redux Toolkit for this scope
- Persistence middleware is 3 lines for localStorage sync of history

Store shape:
```ts
type AppStore = {
  currentPalette: PaletteResource | null;
  history: PaletteResource[];  // localStorage persisted, cap 50
  lockedIndices: number[];
  seed: string;                  // 13-char Crockford Base32, reflects URL
  ui: {
    explainOpen: boolean;
    exportDrawerOpen: boolean;
    exportFormat: CodeExportFormat;
    colorblindMode: 'none' | 'protanopia' | 'deuteranopia' | ...;
    themeMode: 'dark' | 'light';
  };
  // actions
  regenerate: () => Promise<void>;
  lockColor: (idx: number) => void;
  loadFromSeed: (seed: string) => Promise<void>;
  // ...
};
```

### 6.3 Server state: TanStack Query v5
- One `QueryClient` with `staleTime: 60_000` (palette state rarely invalidated)
- `useMutation` for `/palette/generate`, `/palette/lock`, `/export/code` with:
  - `Idempotency-Key` generated per action (not per retry) — stored in mutation context
  - `retry: 1` for 5xx, `retry: 0` for 4xx
  - `onError` maps 8 error types to UX actions (redirect on `authentication_error`, toast on `rate_limit_error`, etc.)

### 6.4 API client
- Hand-written thin fetch wrapper (~80 lines) that:
  - Injects `X-API-Key` from env
  - Generates `Request-Id` (client-side ULID)
  - Generates `Idempotency-Key` where applicable
  - Parses envelope + validates with zod schemas generated from openapi-typescript output
  - Throws typed `ApiError` on error envelope
- NOT using `axios` (redundant with native fetch + adds bundle weight)
- NOT using `openapi-fetch` client (adds type complexity without meaningful safety improvement)

### 6.5 Testing
- **Unit**: Vitest for pure functions (seed encoding, hex→oklch math helpers, WCAG ratio calc)
- **Component**: Vitest + React Testing Library for component behavior (minimal — Guard Playwright is the real safety net)
- **E2E**: Playwright (Guard owns this — not in Works Sprint 1 deliverables, but the test harness is scaffolded)

### 6.6 Build & deploy
- `npm run build` → `dist/` static output
- Railway: static service (no Node server needed Sprint 1). If Sprint 2 adds Firebase auth, migrate to Node server for token exchange security.
- Environment variables at build time via Vite `import.meta.env.VITE_*`. The dev key is in `.env` locally, in Railway env vars in production.

### 6.7 Font loading
- `@fontsource/jetbrains-mono` (regular 400 + medium 500)
- `@fontsource/ibm-plex-sans` (regular 400 + medium 500)
- Imported in the root stylesheet, not lazy — fonts are identity-critical and must paint with the initial content. Total ~60KB WOFF2, acceptable.

### 6.8 Icons
- Lucide, tree-shaken, only import used icons. Estimated final ~10 icons.

### 6.9 Clipboard + toast feedback
- Native `navigator.clipboard.writeText`
- Custom 30-line toast (not a library) because our toast style (a 120ms flash, not a sliding notification) doesn't match any library default

---

## 7. What this stack cannot do (gaps to flag)

- **No real-time collaboration** — Sprint 1 scope excludes it. If added later, consider Yjs or Liveblocks (separate decision).
- **No server-side rendering** — the landing is client-rendered. Acceptable because the tool has no SEO value (it's not a content site, it's a workbench).
- **No offline-first** — the tool depends on the backend for generation. localStorage cache of last palettes is a fallback "read-only" offline mode; new generation requires network.
- **No mobile-native** — web only. Touch-friendly is nice-to-have, not required (target user is desktop-first).

---

## Knowledge 후보
- "Selective shadcn install for brutalist tools" pattern — not every shadcn component is compatible with a brutalist aesthetic. Record which ones are retainable (Button, Dialog, Popover, Tooltip, Tabs, Input, Toggle) vs. which fight the tone (Accordion, Carousel, Calendar, Chart, Select with fancy animations). Target: `03-works/knowledge/stack-decisions/shadcn-selective-install.md` after Works confirms.

## Self-Eval
- [x] 2+ candidates compared (3 provided: React, SolidJS, Astro)
- [x] Evaluation axes explicit with weights
- [x] Trade-offs documented per candidate
- [x] Winner chosen with clear rationale
- [x] All major sub-decisions explicit (routing, state, server state, API client, testing, build, fonts, icons)
- [x] Bundle estimate provided and within Tier 2 budget (131KB initial < 200KB limit)
- [x] Railway deploy compatibility confirmed (static dist/)
- [x] Playwright compatibility confirmed (best-in-class)
- [x] OpenAPI type generation path defined (openapi-typescript CLI)
- [x] Gaps to flag documented (no SSR, no offline-first, no real-time, no mobile)

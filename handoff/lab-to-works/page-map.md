# Page Map — color-palette-api frontend

**Source**: `context/lead-reports/lab/page-map-report.md`
**Sprint 2 amendment**: 2026-04-10

---

## Sprint 2 Amendment — Extended Query Params

No new routes or pages. Sprint 2 adds 2 query parameters to the existing GeneratorPage.

### Updated query param schema (Sprint 2 additions)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `harmony` | `auto` \| `complementary` \| `analogous` \| `triadic` \| `split-complementary` \| `tetradic` \| `monochromatic` | `auto` (omitted) | harmony type for generation |
| `minQuality` | integer 0-100 | `0` (omitted) | minimum quality threshold |

### Updated URL example

```
/?seed=ABCDEFGHJKMNP&locked=0,2&mode=dark&harmony=triadic&minQuality=75
```

### URL update strategy (Sprint 2 additions)

- **On harmony change**: `history.replaceState` with `&harmony=` update. `auto` is omitted.
- **On quality change**: `history.replaceState` with `&minQuality=` update. `0` is omitted.
- Same replaceState pattern as seed/locked/mode (no back-stack pollution).

---

## Route table

| Priority | Path | Component | Data source | Entry points | Parent |
|----------|------|-----------|-------------|--------------|--------|
| P0 | `/` | `<GeneratorPage>` | `usePalette()` → `POST /theme/generate` with auto-seed | direct URL, bookmark | root |
| P0 | `/?seed=XXXXXXXXXXXXX` | `<GeneratorPage>` | `usePalette(seed)` → deterministic | shared URL | root |
| P0 | `/?seed=XXX&locked=0,2&mode=dark&explain=1&export=shadcn` | `<GeneratorPage>` | as above with additional query modifiers | deep link | root |
| P0 | `/*` | `<NotFoundPage>` | none | typo, broken link | root |
| P1 | `/help` | `<HelpPage>` | none (static) | `?` overlay navigation, `[h]` on 404 | root |
| P1 | runtime error | `<ErrorBoundary>` | caught error | React error boundary | root |

Total persistent routes: **3** (`/`, `/help`, `/*`). All state lives in query params.

## Query param schema

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `seed` | 13-char Crockford Base32 `[0-9A-HJKMNP-TV-Z]{13}` | auto-generated on mount | deterministic palette seed |
| `locked` | comma-separated indices `[0-9]+(,[0-9]+)*` | none | indices of locked colors |
| `mode` | `dark` \| `light` | `dark` | theme mode |
| `explain` | `0` \| `1` | `1` | explain panel open state |
| `export` | `CodeExportFormat` | none | pre-select export format and auto-open drawer |

## Entry points (how users arrive)

1. **Direct `/`** — bookmark, GitHub README, HN link, search. Most common. Auto-generates on mount.
2. **Shared seed URL** — teammate pasted in Slack/git commit/Linear. Must byte-reproduce.
3. **Deep link into export** — keyboard shortcut or .desktop entry. Lands directly in drawer with format pre-selected.

## Navigation model

- **No navigation bar**. No breadcrumbs. No "main nav" menu.
- The tool is single-surface; the only other route is `/help` which is accessible via:
  - `?` keyboard shortcut (opens overlay, not navigation)
  - `[help]` muted text link in bottom-right of main surface
- Browser back button:
  - Closes `?` help overlay (uses `history.pushState` only for overlays)
  - Does NOT undo palette generations (generations use `history.replaceState`)

## URL update strategy

- **On generation**: `history.replaceState` with new `?seed=` — user can bookmark but doesn't fill back stack
- **On lock/unlock**: `history.replaceState` with `&locked=` update
- **On mode toggle**: `history.replaceState` with `&mode=`
- **On explain toggle**: `history.replaceState` with `&explain=`
- **On export drawer open**: `history.pushState` with `&export=` (so back button closes drawer)
- **On help overlay**: `history.pushState` with trailing hash `#help` (back closes)

## Browser tab title

```ts
document.title = `cpa [${seed}]`;  // e.g. "cpa [ABCDEFGHJKMNP]"
```

Updates live on each palette generation. Multiple tabs of the tool are distinguishable by seed.

## Favicon

Dynamic SVG favicon generated client-side from the current palette's primary color:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${primaryColor}"/>
</svg>
```

Encoded as data URI and injected into `<link rel="icon">` on palette change. Each tab's favicon visually reflects its palette.

## 404 page design

Content (all monospace, matches compiler error tone):

```
404
path not resolved

      expected: a valid route
      received: ${location.pathname}

      > [r] return to generator
      > [h] open help
```

Keyboard shortcuts `r` and `h` are live on this page (routes back).

## Error boundary (runtime crash)

When React throws an uncaught error:

```
runtime error

      error.type: frontend_error
      error.code: ${error.name}
      message:    ${error.message}

      stack trace available at [s]

      > [r] reload page
      > [c] copy error id to clipboard
      > [g] open github issue (prefilled)
      > [s] toggle stack trace
```

## Route transitions

- No route transition animations. Route change = instant render of new component.
- No spinners on route change (routes are code-split only if bundle budget demands).
- Route components should render within 50ms of mount (pure components; data fetching is async and shows loading state inside the component).

## Code splitting (optional — if bundle exceeds budget)

- `/` is the critical path — never code-split
- `/help` can be lazy-loaded (~5KB savings)
- `<ErrorBoundary>` is eager (must be available at crash time)
- `<NotFoundPage>` can be lazy-loaded

## Accessibility routes

- Landmark structure:
  - `<main role="main">` wraps the generator content
  - `<nav aria-label="keyboard shortcuts">` wraps any visible shortcut hints
  - `<aside role="complementary" aria-label="palette json structure">` wraps the JSON sidebar
  - `<aside role="complementary" aria-label="palette explanation">` wraps the explain panel
  - `<section role="region" aria-label="contrast and colorblind matrix">` wraps the bottom panel
- Skip-to-content link: `<a href="#main">skip to generator</a>` at top of tab order (visually hidden but keyboard-focusable)

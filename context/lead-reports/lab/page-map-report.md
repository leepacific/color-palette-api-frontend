# page-map-report — color-palette-api frontend

**Disclosure**: Mode A — authored by Frontend Lab CEO per spawn prompt permission.

## Role
page-map-architect — URL structure, route tree, entry points, navigation model.

## 요약
1. Three functional routes + one 404. No marketing landing page — the generator IS the landing page.
2. All persistent state lives in query params (`?seed=`, `&locked=`, `&mode=`), enabling the seed URL round-trip (Flow D) at the router level rather than via client-side save buttons.
3. The `/help` page is a single keyboard-shortcut reference; the tool itself has no navigation chrome because there's nowhere else to go.

## 상세

### Route table

| Path | Component | Data | State | Entry point |
|------|-----------|------|-------|-------------|
| `/` | `GeneratorPage` | `usePalette()` → `POST /theme/generate` | seed auto-generated on mount | direct URL or external |
| `/?seed=X&locked=0,2&mode=dark` | `GeneratorPage` | `usePalette(seed)` → deterministic palette | seed from query, locks from query | shared URL |
| `/help` | `HelpPage` | none | none | `?` overlay also navigates here |
| `/*` | `NotFoundPage` | none | none | typo or broken link |

Total: 3 routes. No nested routing. No route groups. No layouts beyond the root `<App>`.

### Why no landing page / marketing page

- Doctrine §1.1 forbids the centered hero (which is what a marketing landing would default to)
- User persona (developer Maya) has zero patience for marketing chrome on a dev tool
- The generator IS the landing — a developer lands, sees a palette already generated, presses space, gets what they need
- Marketing claims belong elsewhere (GitHub README, Hacker News, dev-tool Twitter) — not in-product

### URL as the document

Following the Tldraw reference pattern (reference-curation-report #5):

```
https://app.example.com/
  ?seed=ABCDEFGHJKMNP   # 13-char Crockford Base32, echoed from backend
  &locked=0,2           # comma-separated indices of locked colors (optional)
  &mode=dark            # 'dark' | 'light' (optional, defaults to dark)
  &explain=1            # 0 | 1, explain panel open/closed (optional, default 1)
  &export=shadcn        # shortcut to open export drawer with format pre-selected (optional)
```

Example URLs and what they do:
- `/` → generator, auto-seeded, dark mode, explain open
- `/?seed=ABCDEFGHJKMNP` → reproduce that palette exactly
- `/?seed=ABCDEFGHJKMNP&locked=0,2&mode=light` → reproduce that palette in light mode with colors 0 and 2 locked
- `/?export=shadcn` → open export drawer with shadcn format pre-selected (useful for keyboard/external shortcut)

### Query param → Zustand sync strategy

- On mount: read URL params, hydrate Zustand store
- On state change: push new URL via `history.replaceState` (not `pushState` — we don't want every palette regeneration to add a history entry; instead, user explicitly `Cmd+D` bookmarks or copies URL)
- Exception: the `?` help overlay DOES `pushState` so back button dismisses it

### The 3 entry points

1. **Direct** (`/`) — most common. Developer arrived via bookmark, GitHub README, or search. Auto-generates.
2. **Shared seed** (`/?seed=...`) — second most common. Teammate pasted a URL. Must reproduce byte-identically.
3. **Deep link into export** (`/?export=shadcn`) — rare. Developer has a keyboard shortcut or `.desktop` entry configured. Lands directly in the export drawer.

### Navigation model

- **No navigation bar** — the tool is single-surface. Navigation to `/help` is via `?` key or a small `[help]` link in the bottom-right corner (monospace, muted)
- **Back button** respects the expected model: closing the `?` help overlay, closing the export drawer, clearing a modal
- **Browser tab title** updates live with the current seed: `cpa [ABCDEFGHJKMNP]` so multiple tabs are distinguishable
- **Favicon** is a single filled rectangle in the current palette's primary accent color — so each tab visually shows its palette

### 404 page

Per Doctrine §11 (recommended), a custom 404 that matches the tool's tone:

```
404
path not resolved

      expected: a valid route
      received: ${location.pathname}

      > [r] return to generator
      > [h] open help
```

Formatted in monospace, matches the error message style of a Rust compiler error. Keyboard shortcuts `r` and `h` are live on this page too.

### Error boundary / crash page

If React throws an uncaught error:

```
runtime error

      error.type: frontend_error
      error.code: ${error.name}
      message:    ${error.message}

      > [r] reload
      > [c] copy error to clipboard
      > [g] open GitHub issue (prefilled)
```

The error is copyable with `c` and a GitHub issue deep-link with the error prefilled is openable with `g`. This IS the tool's voice — even crashes feel like compiler errors rather than "Oops, something went wrong :(".

---

## Knowledge 후보
- "URL-as-document pattern for developer tools" — the combination of seed + query param mask + modifier flags → the URL is git-diff-able. Target: `02-lab/knowledge/design-patterns/url-as-document-dev-tools.md` after Sprint 1 Guard PASS.

## Self-Eval
- [x] All pages have URL + parent + entry point
- [x] 404 page defined (with keyboard shortcuts matching the tool's voice)
- [x] Error boundary / runtime crash page defined
- [x] Loading page not needed (generator-level loading state handled by component, not a route)
- [x] No marketing landing page (explicit rationale)
- [x] Query param model explicit
- [x] Deep link support for share URLs (Flow D)
- [x] Browser tab title + favicon behavior defined
- [x] No keyword blacklist violations

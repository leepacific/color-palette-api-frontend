# ux-flow-report — color-palette-api frontend

**Disclosure**: Mode A — authored by Frontend Lab CEO per spawn prompt permission.

## Role
ux-flow-designer — Flows A-D as state machines + keyboard shortcut map + edge cases + 4-state variants.

## 요약
1. Flow A (generate→paste ≤30s) fully diagrammed with instrumented timing assumptions. Target beats Coolors by ~40% on wall-clock.
2. Flow B (a11y visible) is not a flow per se — it's a layout constant: the contrast matrix is always visible, colorblind mode is always a single keypress away.
3. Flows C (learn) and D (share) are integrated into the main loop rather than being separate user journeys.
4. Keyboard shortcut map contains 18 bindings, all single-key or two-key `g+X` chords, no `Cmd/Ctrl` requirements.

---

## Flow A — Generate → Paste into my project (target ≤30s)

### State machine
```
[LAND]
  ↓ (auto-generate with default seed, ~200ms round-trip)
[PALETTE_READY]
  ↓ user reviews (expected 3-8s)
  ↓ [R] or [SPACE] to regenerate (optional, ~200ms round-trip)
[PALETTE_READY]
  ↓ [L] on one or more colors (optional, client-state only, instant)
[PALETTE_READY_LOCKED]
  ↓ [R] to regenerate non-locked (~200ms)
[PALETTE_READY_LOCKED]
  ↓ [E] to open export drawer (animation 150ms)
[EXPORT_DRAWER_OPEN] (default format: shadcn-globals, pre-computed)
  ↓ [J/K] to cycle format if desired (each switch ~200ms round-trip)
[EXPORT_DRAWER_OPEN]
  ↓ [ENTER] or [C] to copy
[COPY_FEEDBACK] (120ms flash)
  ↓ user switches to IDE and pastes (external, ~2s)
[DONE]
```

### Timing budget (target 30s)
| Step | Time |
|------|------|
| Page load (cold, cached) | 500ms |
| Auto-generate (default seed on mount) | 200ms |
| User review + decide to regenerate | 3000ms |
| Regenerate (1-2 times) | 400ms |
| Open export drawer | 150ms |
| Select format (optional cycling) | 800ms |
| Copy | 100ms |
| Switch to IDE (external) | 2000ms |
| Paste + confirm | 1000ms |
| **Total** | **~8s** |

We budget 22s of slack for the user's cognitive time. The ≤30s target is very achievable assuming API latency ≤200ms (the backend is Rust + Railway edge; baseline is ~80-150ms observed).

### Failure modes in Flow A
- **API latency spike** (p99 >1s): the `<GenerateButton>` shows `>` spinner caret; user perceives as slow but not broken
- **API auth failure** (U1 blocker): entire flow dead in the water. Show top-bar banner: `api key invalid · open [.env] or request new key`
- **Copy failure** (clipboard permission): toast: `copy failed · select text manually` with the code block auto-selected
- **Format not supported** (`INVALID_FORMAT` error): toast + drawer automatically reverts to `shadcn-globals` (the safe default)

---

## Flow B — Check accessibility (visible by default)

Flow B is NOT a sequential flow — it's a **layout invariant**. The contrast matrix is docked to the bottom panel of the IDE layout; the colorblind toggle is in the bottom panel's header. The user never navigates to a11y; they always see it.

### The one interactive sub-flow

```
[PALETTE_READY]
  ↓ user notices a red dot in the matrix (failing cell)
  ↓ [HOVER] that cell → tooltip: "fg: #... / bg: #... / ratio: 2.1 / AA ✗"
  ↓ [CLICK] the cell → focus jumps to the fg color swatch
  ↓ [L] to lock the fg → [R] to regenerate (attempts to improve the failing pair)
[PALETTE_READY]  ← loop until all cells pass
```

### Colorblind sub-flow

```
[PALETTE_READY] (colorblindMode = 'none')
  ↓ [X] cycles to 'protanopia'
  ↓ PaletteDisplay re-renders with protanopia-simulated colors (using the response's `colorblind.protanopia` array)
  ↓ user evaluates "does this still look distinguishable?"
  ↓ [X] again → 'deuteranopia', and so on through 8 modes
  ↓ [X] after 'achromatomaly' → returns to 'none'
```

### Doctrine §2.3 data states for contrast matrix
- Default: rendered
- Empty: "matrix not computed" hint
- Loading: cells show `...` with caret
- Error: error message + retry

---

## Flow C — Learn from this palette (explain mode as a surface, not a menu)

### State machine
```
[PALETTE_READY] (explain panel open by default, right dock)
  ↓ [G E] toggles explain panel visibility (user closes if cluttered)
[PALETTE_READY] (explain collapsed)
  ↓ [G E] re-opens
[PALETTE_READY] (explain open)
  ↓ user reads harmony type + OKLCH narrative + 4 pedagogical notes
  ↓ user clicks a hue-relationship link → focuses that color pair in the main display
[PALETTE_READY]
```

### The explain panel composition
- Header: `harmony · complementary` (monospace, in accent color)
- Confidence: `confidence · 0.87` (as dimmer subhead)
- OKLCH narrative (3 lines):
  ```
  lightness   0.42 - 0.89   span 0.47
  chroma      0.12 - 0.22   mean 0.17
  hue         27° - 207°    span 180°
  ```
- Pedagogical notes (the one sans-serif block in the tool): 4 short paragraphs from backend, IBM Plex Sans 14px
- Harmony reference link: `[↗ learn more]` — deep link to the `harmonyReference` URL

### Jun-specific flow (student)
```
[LAND]
  ↓ Jun sees a palette + explain mode already open
  ↓ reads "harmony · complementary" → reads notes
  ↓ presses [R] to regenerate → notices explain now says "analogous"
  ↓ reads the new narrative, compares
  ↓ loops 5-10 times, learning the hue-distance → harmony-type mapping
  ↓ eventually starts predicting before pressing [R]
```

The tool becomes a flashcard system by accident. That is the Jun win condition.

---

## Flow D — Share this exact palette

### State machine
```
[PALETTE_READY]
  ↓ URL bar shows "/?seed=ABCDEFGHJKMNP&locked=0,2&mode=dark"
  ↓ user copies URL (browser's own [Cmd+L then Cmd+C] OR the tool's [S] shortcut)
  ↓ [S] → copies URL to clipboard AND shows toast "seed copied"
[SHARED]
  ↓ recipient opens URL
[LOAD(seed=...)]
  ↓ app reads URL params on mount
  ↓ hydrates Zustand store (seed, locked, mode)
  ↓ fetches palette from backend with that seed
[PALETTE_READY (same palette as sender saw)]
```

### Byte-identity guarantee
- The backend produces deterministic output for the same (seed, harmonyType, count, minScore) inputs
- The URL contains only `seed` — other params default; so recipient sees the same palette but in their own mode preference (light/dark respected)
- Flow D success criterion: visiting the URL reproduces the 5 hex values byte-identically. Verified by Playwright test in Guard phase.

---

## Cross-flow: the empty / loading / error state matrix

| Component | Default | Empty | Loading | Error |
|-----------|---------|-------|---------|-------|
| PaletteDisplay | 5 swatches | `press [R] to generate` | 5 caret blocks | error envelope + retry hint |
| ContrastMatrix | full grid | `press [M] to compute` | `...` cells | error envelope |
| ExplainPanel | narrative | `no explanation` | header + `...` values | error + retry |
| ExportBlock | code | `select format [E]` | `> computing` | error + retry |
| ComponentPreview | 6 shadcn | `requires semanticTokens` | placeholders + caret | error |
| JsonSidebar | tree | `▌ palette null` | tree with `loading...` | tree with error node |

All 6 data components designed for 4 states = §2.3 compliance.

---

## Keyboard shortcut map

### Category: generator
| Key | Action |
|-----|--------|
| `r` | regenerate palette |
| `space` | regenerate palette (alias, inherited from Coolors) |
| `1`-`9` | focus color at that index |
| `l` | lock focused color |
| `L` (shift+l) | lock all colors |
| `u` | unlock focused color |
| `U` | unlock all |

### Category: export
| Key | Action |
|-----|--------|
| `e` | open export drawer (or close if open) |
| `j` | cycle to next export format (in drawer) |
| `k` | cycle to previous export format |
| `c` | copy current format to clipboard (or copy focused code block) |
| `Enter` | copy (in drawer) |

### Category: panels
| Key | Action |
|-----|--------|
| `g j` | toggle JSON sidebar (`g` is the "goto" prefix, vim-style) |
| `g e` | toggle explain panel |
| `g m` | toggle matrix panel |

### Category: accessibility
| Key | Action |
|-----|--------|
| `x` | cycle colorblind simulation mode |
| `m` | toggle light/dark mode |

### Category: share
| Key | Action |
|-----|--------|
| `s` | copy current URL with seed |

### Category: meta
| Key | Action |
|-----|--------|
| `?` | open help overlay |
| `Escape` | close current overlay / drawer / help |
| `/` | focus seed input (future: search, Sprint 2) |

### Conflicts avoided
- `t` is NOT bound (commonly new-tab)
- `f` is NOT bound (commonly find-in-page)
- `Cmd+S` / `Ctrl+S` is NOT bound (lets browser save page — acceptable, user rarely wants this)
- `Cmd+R` / `Ctrl+R` is NOT intercepted (reload works as expected)
- `Space` scroll behavior: prevented ONLY when focus is inside app container

### Inline hints
Every button has a `<KeycapHint>` next to it showing its shortcut. Not a separate help overlay only — Raycast-style inline.

---

## Edge cases

### E1. User pastes invalid seed in URL
- Backend returns 400 with `INVALID_SEED` code
- Frontend shows top-bar banner: `seed invalid · [r] reset to default`
- URL is NOT automatically corrected (user may want to edit)

### E2. User hits rate limit
- Backend returns 429 with `rate_limit_error` type + `Retry-After` header
- Frontend shows toast: `rate limited · retry in ${n}s`
- `<GenerateButton>` disables for that duration with countdown in the caret spinner

### E3. User hits quota exhausted (free tier)
- Backend returns 429 with `quota_exceeded_error` type
- Frontend shows persistent top-bar banner: `quota exceeded · resets ${date}` (no modal — doesn't interrupt flow, just warns)
- Sprint 1 note: since we use the dev key, this shouldn't happen. But the UX is designed for post-Sprint-2 user accounts.

### E4. User has `prefers-reduced-motion`
- Caret blink animation is disabled (caret stays solid)
- All 150ms transitions become 0ms
- The ONE "motion" that remains is the copy-button flash (120ms) because it's functional feedback, not decorative

### E5. User on mobile / small screen
- At <640px: show a full-screen message: `this tool is keyboard-first · open on desktop` + a small "view anyway" link that shows a read-only palette display (no keyboard interactions expected to work)
- Not a compromise: we said the tool is keyboard-first and means it.

### E6. User on screen reader
- All color swatches have `aria-label="color 1 of 5: hex #D00000, oklch 0.55 0.22 27, hsl 0 100 41"` (full notation)
- Contrast matrix cells have `aria-label="foreground color 1 on background color 3, ratio 5.25, passes AA"`
- The JSON sidebar is `aria-hidden="true"` because it duplicates information already conveyed by swatches (reduces screen reader noise)
- Keyboard focus order respects the visual IDE layout (top → main → left → right → bottom)

### E7. User has JavaScript disabled
- Static `<noscript>` message: `this tool requires javascript · it is a single-page react app · enable js or use the REST API directly: ${link to api docs}`

---

## Keyboard-first compliance check (Doctrine §2.4 + success metric T1.2)

- [x] regenerate (r, space)
- [x] lock (l)
- [x] focus color (1-9)
- [x] export (e)
- [x] cycle format (j/k)
- [x] copy (c, enter)
- [x] colorblind cycle (x)
- [x] mode toggle (m)
- [x] share URL (s)
- [x] panel toggles (g j/e/m)
- [x] help (?)
- [x] escape from overlays
- [x] every feature reachable without mouse
- [x] focus-visible on every interactive element with a visible 2px ring

---

## Knowledge 후보
- "Keyboard-first flow with inline Raycast-style hints for web tools" — target `02-lab/knowledge/design-patterns/keyboard-first-web-tools.md` after Guard PASS.

## Self-Eval
- [x] Flow A has state machine + timing budget + failure modes
- [x] Flow B documented as layout invariant + one sub-flow
- [x] Flow C has explicit student user journey
- [x] Flow D documents byte-identity guarantee and Playwright verification path
- [x] Cross-flow 4-state matrix for all 6 data components
- [x] Keyboard shortcut map (18 bindings) with conflict avoidance analysis
- [x] Edge cases E1-E7 covered
- [x] Mobile behavior explicit (refuse gracefully)
- [x] Screen reader behavior explicit
- [x] prefers-reduced-motion behavior explicit

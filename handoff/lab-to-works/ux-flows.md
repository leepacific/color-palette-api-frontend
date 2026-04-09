# UX Flows — color-palette-api frontend

**Source**: `context/lead-reports/lab/ux-flow-report.md`

## Flow A — Generate → Paste (≤30s target)

```
[LAND]
  ↓ auto-generate with URL seed or random seed (~200ms API round-trip)
[PALETTE_READY]
  ↓ user reviews (3-8s cognitive)
  ↓ [r] or [space] regenerate (optional, ~200ms)
  ↓ [l] lock colors (optional, instant client-state)
[PALETTE_READY_LOCKED]
  ↓ [e] open export drawer (150ms slide-in)
[EXPORT_DRAWER_OPEN] (default: shadcn-globals, pre-fetched)
  ↓ [j/k] cycle format (optional, ~200ms each)
  ↓ [Enter] or [c] copy to clipboard
[COPY_FEEDBACK] (120ms flash)
  ↓ user switches to IDE (external, ~2s)
  ↓ paste (~1s)
[DONE]
```

### Timing budget

| Step | Time |
|------|------|
| Cold page load | 500ms |
| Auto-generate | 200ms |
| Review + decide | 3000ms |
| Regenerate x1-2 | 400ms |
| Open drawer | 150ms |
| Format cycle (optional) | 800ms |
| Copy | 100ms |
| Switch to IDE | 2000ms |
| Paste | 1000ms |
| **Total** | **~8s** (under 30s target by 22s) |

### Failure modes

- **API >1s**: spinner caret in GenerateButton; user perceives slow not broken
- **Auth fail**: top-bar banner `api key invalid · open [.env] or request new key`
- **Clipboard denied**: toast `copy failed · text selected · copy manually`; code auto-selected
- **INVALID_FORMAT**: drawer auto-falls-back to shadcn-globals + toast

## Flow B — Accessibility visible by default

**Not a flow — a layout invariant.** Contrast matrix docked bottom, always visible. Colorblind toggle in bottom panel header, always keyboard-reachable.

### Sub-flow B1: Fix a failing pair

```
[PALETTE_READY]
  ↓ user notices red dot in matrix (failing cell)
  ↓ hover → tooltip "fg: # / bg: # / ratio: 2.1 / AA ✗"
  ↓ click cell → focus jumps to fg swatch
  ↓ [l] lock fg → [r] regenerate
[PALETTE_READY] (retry until all cells pass)
```

### Sub-flow B2: Cycle colorblind simulation

```
[PALETTE_READY] (colorblindMode: 'none')
  ↓ [x] → 'protanopia'
  ↓ PaletteDisplay re-renders with protanopia-simulated hex values from contrast-matrix response
  ↓ user evaluates distinguishability
  ↓ [x] → next mode (8 modes total: prot/deut/trit + anomalous + achr/achromatomaly)
  ↓ [x] after 'achromatomaly' → returns to 'none'
```

## Flow C — Learn from this palette (student surface)

```
[PALETTE_READY] (explain panel open by default, right dock)
  ↓ user reads: harmony type + OKLCH narrative + 4 pedagogical notes
  ↓ optionally click hue-relationship link → focuses that color pair
  ↓ [g e] toggles panel if cluttered
  ↓ user presses [r] → new explanation updates
[PALETTE_READY] (new explanation loaded)
```

### Jun-student loop (implicit flashcard system)

```
generate → read harmony → predict next → generate → compare → repeat
```

After 10-20 palettes the student starts predicting harmony type from swatches alone. That IS the Jun win condition.

## Flow D — Share this exact palette

```
[PALETTE_READY]
  ↓ URL bar: /?seed=ABCDEFGHJKMNP&locked=0,2&mode=dark
  ↓ [s] → clipboard gets the URL + toast "seed copied"
[SHARED]
  ↓ recipient opens URL
[LOAD(seed)]
  ↓ app reads URL params on mount
  ↓ hydrates Zustand store
  ↓ fetches palette with that seed (server-side deterministic)
[PALETTE_READY — byte-identical to sender]
```

### Byte-identity guarantee

Backend is deterministic: same `(seed, harmonyType, count, minScore)` → same response. URL sends `seed` only; other params default. Recipient sees identical 5 hex values. Playwright test in Guard phase verifies.

## 4-state matrix (all data components)

| Component | Default | Empty | Loading | Error |
|-----------|---------|-------|---------|-------|
| PaletteDisplay | 5 swatches + composite score | `press [R]` hint | 5 caret blocks sync-blinking | `████` + error line + retry hints |
| JsonSidebar | tree + blinking caret | `▌ palette null` | `▌ palette { loading... }` | `▌ palette { error: ... }` |
| ContrastMatrix | full N×N grid | `press [M] to compute` | cells with `...` + caret | error + retry |
| ExplainPanel | full narrative + 4 notes | `press [e] to compute` | headers with `...` | error + retry |
| ComponentPreview | 6 shadcn components | `requires semanticTokens` | placeholders + caret | error |
| ExportBlock | code block + copy | `press [e] to select format` | `> computing ${format}` | `> failed · ${code}` |

## Keyboard shortcut map (18 bindings)

### Generator
| Key | Action |
|-----|--------|
| `r` | regenerate palette |
| `space` | regenerate (Coolors-compat alias) |
| `1-9` | focus color at index |
| `l` | lock focused color |
| `L` | lock all |
| `u` | unlock focused |
| `U` | unlock all |

### Export
| Key | Action |
|-----|--------|
| `e` | toggle export drawer |
| `j` | next format (in drawer) |
| `k` | previous format (in drawer) |
| `c` | copy current format (or focused code block) |
| `Enter` | copy (in drawer) |

### Panels
| Key | Action |
|-----|--------|
| `g j` | toggle json sidebar (`g` is goto prefix) |
| `g e` | toggle explain panel |
| `g m` | toggle matrix panel |

### Accessibility
| Key | Action |
|-----|--------|
| `x` | cycle colorblind simulation forward |
| `X` | cycle backward |
| `m` | toggle dark/light mode |

### Share
| Key | Action |
|-----|--------|
| `s` | copy current URL (with seed) |

### Meta
| Key | Action |
|-----|--------|
| `?` | open help overlay |
| `Escape` | close current overlay/drawer |
| `/` | focus seed input (Sprint 2: search) |

### Conflict avoidance

- `t`, `f`, `Cmd+S`, `Cmd+R` NOT intercepted (browser defaults preserved)
- `Space` scroll behavior: prevented ONLY when focus is inside app container (not on external browser UI)

### Inline hints

Every interactive element has a `<KeycapHint>` next to it showing its shortcut. NOT hidden only in the `?` overlay. Inspired by Raycast and Linear (see `reference-board.md`).

## Edge cases

### E1. Invalid seed in URL
- Backend returns 400 `INVALID_SEED`
- Top-bar banner: `seed invalid · [r] reset`
- URL NOT auto-corrected (user may be editing)

### E2. Rate limit (429 `rate_limit_error`)
- Toast: `rate limited · retry in ${retryAfter}s`
- GenerateButton disabled with countdown caret

### E3. Quota exceeded (429 `quota_exceeded_error`)
- Top-bar banner: `quota exceeded · resets ${date}`
- Non-modal (just warns)
- Sprint 1 unlikely (dev key); UX ready for Sprint 2 accounts

### E4. prefers-reduced-motion
- Caret blink disabled (solid)
- 150ms transitions → 0ms
- Copy-flash (120ms) PRESERVED — functional, not decorative

### E5. Mobile / <640px
- Full-screen: `this tool is keyboard-first · open on desktop`
- "view anyway" link → read-only palette display
- Not a compromise — intentional

### E6. Screen reader
- Every swatch: `aria-label="color 1 of 5: hex #D00000, oklch 0.55 0.22 27, hsl 0 100 41"`
- Matrix cells: `aria-label="foreground 1 on background 3, ratio 5.25, passes AA"`
- JsonSidebar: `aria-hidden="true"` (duplicative with swatches; reduces SR noise)
- Focus order: TopBar → skip-link → main → left → right → bottom

### E7. JavaScript disabled
- `<noscript>`: `this tool requires javascript · it is a single-page react app · enable js or use the REST API directly: ${api docs link}`

## Keyboard-complete verification (T1.2)

Every Tier 1 success criterion feature reachable by keyboard:
- [x] regenerate (r/space)
- [x] lock (l)
- [x] focus color (1-9)
- [x] export (e)
- [x] cycle format (j/k)
- [x] copy (c, Enter)
- [x] colorblind (x)
- [x] mode (m)
- [x] share URL (s)
- [x] panel toggles (g j/e/m)
- [x] help (?)
- [x] escape overlays
- [x] focus-visible on every interactive element (2px mint-cyan ring)

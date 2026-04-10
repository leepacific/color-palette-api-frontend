# UX Flows — color-palette-api frontend

**Source**: `context/lead-reports/lab/ux-flow-report.md`
**Sprint 2 amendment**: 2026-04-10

---

## Sprint 2 Amendment — Extended Flows

### Flow A (amended) — Generate with Harmony + Quality → Paste

Sprint 2 extends Flow A with two optional pre-generation configuration steps. The flow remains ≤30s because these steps are optional and fast (single click or keypress).

```
[LAND]
  ↓ auto-generate with URL seed or random seed (~200ms)
[PALETTE_READY]
  ↓ (optional) [h] cycle harmony type in TopBar selector (instant, client-state)
  ↓ (optional) [q] focus quality input → type threshold (instant, client-state)
  ↓ [r] regenerate with harmony + quality params → API request includes harmonyHint + minQuality
  ↓ API may retry internally (up to maxRetries); response includes generationMeta
[PALETTE_READY_WITH_META]
  ↓ generationMeta displayed below composite score
  ↓ user reviews (3-8s cognitive)
  ↓ [e] open export drawer → rest of Flow A unchanged
[EXPORT_DRAWER_OPEN → COPY_FEEDBACK → DONE]
```

**Key behavioral details**:
- Harmony and quality settings PERSIST across regenerates (store state, not reset)
- URL updated with `?harmony=triadic&minQuality=50` via replaceState (no back-stack pollution)
- If harmony or quality are set when user presses `r`, BOTH are sent to backend
- If neither is set (defaults: auto/0), request is identical to Sprint 1 (no generationMeta in response)
- Lock preservation (FB-011) works unchanged — locked colors are stitched back post-response regardless of harmony/quality params

### Flow E — Tune Harmony Type (new, P0)

```
[PALETTE_READY]
  ↓ user presses [h] → harmony cycles: auto → comp → anal → tri → split → tet → mono → auto
  ↓ TopBar HarmonySelector visually updates (active tag changes)
  ↓ store.harmonyHint updated
  ↓ user presses [r] regenerate
  ↓ API request: { harmonyHint: "triadic", ... }
[PALETTE_READY_WITH_META]
  ↓ ExplainPanel now reflects the constrained harmony
  ↓ generationMeta.harmonyUsed = "triadic"
  ↓ user compares palettes across harmony types (Flow C learning loop)
```

This flow amplifies Flow C (learn from palette) — the student can now explicitly select a harmony theory and see its effect, turning the tool into a more deliberate learning surface.

### Flow F — Set Quality Threshold (new, P0)

```
[PALETTE_READY]
  ↓ user presses [q] → focus moves to quality input
  ↓ user types "75" or clicks [+] 8 times (10-step: 0→10→20→...→80, then type 75)
  ↓ store.minQuality = 75
  ↓ user presses [r] regenerate
  ↓ API request: { minQuality: 75, ... }
  ↓ backend retries up to 5 times for quality ≥ 75
[PALETTE_READY_WITH_META]
  ↓ generationMeta.qualityScore = 78.3
  ↓ generationMeta.attempts = 3
  ↓ user sees the quality and attempts count below the palette
  ↓ if quality is satisfactory → proceed to export
  ↓ if not → user may increase threshold or regenerate again
```

**Important**: the backend NEVER errors on unmet quality — it always returns the best palette found within the retry budget. The frontend does not need to handle a "quality unmet" error state.

### Updated 4-state matrix (Sprint 2 additions)

| Component | Default | Empty | Loading | Error |
|-----------|---------|-------|---------|-------|
| GenerationMeta | `harmony: X · quality: Y · attempts: Z` | hidden (meta is null) | inherits PaletteDisplay | inherits PaletteDisplay |

### Updated keyboard shortcut map (Sprint 2 additions)

#### Generation params
| Key | Action |
|-----|--------|
| `h` | cycle harmony type forward |
| `H` | cycle harmony type backward |
| `q` | focus quality threshold input |

Total bindings: **21** (was 18).

### URL sync additions (Sprint 2)

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `harmony` | HarmonyHint enum | `auto` (omitted from URL) | harmony type for next generation |
| `minQuality` | integer 0-100 | `0` (omitted from URL) | minimum quality threshold |

`use-url-sync.ts` changes:
- Parse `?harmony=` on mount → validate against 7 enum values → set `store.harmonyHint`
- Parse `?minQuality=` on mount → validate 0-100 integer → set `store.minQuality`
- Subscribe to `harmonyHint` and `minQuality` store changes → replaceState URL
- Default values (auto / 0) are omitted from URL for clean sharing

### Edge cases (Sprint 2)

#### E8. Invalid harmony in URL
- `?harmony=invalid` → silently ignored, defaults to `auto`
- No error banner (graceful degradation)

#### E9. Invalid minQuality in URL
- `?minQuality=-5` or `?minQuality=200` → silently ignored, defaults to `0`
- Non-numeric → silently ignored

#### E10. UNKNOWN_HARMONY_HINT from API
- Should not happen with valid enum values
- If received: toast `invalid harmony type · defaulting to auto`, reset store to `auto`

#### E11. INVALID_MIN_QUALITY from API
- Should not happen with 0-100 validation
- If received: toast `invalid quality threshold · resetting to 0`, reset store to `0`

---

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

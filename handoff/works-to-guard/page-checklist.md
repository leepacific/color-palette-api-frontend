# Page Checklist — color-palette-api frontend · Sprint 2 Amendment

## Sprint 2 URL Changes

### New URL params
- `?harmony=triadic` — sets harmony hint (omitted when "auto")
- `?minQuality=50` — sets minimum quality threshold (omitted when 0)

### Full URL shape
`/?seed=ABCDEFGHJKMNP&locked=0,2&mode=dark&harmony=triadic&minQuality=50`

### New components on GeneratorPage
- [x] HarmonySelector (C9) integrated in TopBar, between seed label and spacer
- [x] QualityThreshold (C10) integrated in TopBar, after HarmonySelector
- [x] GenerationMeta (D7) placed below PaletteDisplay, above ComponentPreview

### New keyboard shortcuts
- [x] `h` — cycle harmony forward (auto -> comp -> anal -> tri -> split -> tet -> mono -> auto)
- [x] `H` (Shift+h) — cycle harmony backward
- [x] `q` — focus quality input

---

# Page Checklist — color-palette-api frontend · Sprint 1

**Source spec**: `handoff/lab-to-works/page-map.md`

## P0 routes

### `/` — GeneratorPage

- [x] Route registered in `src/App.tsx` → `<Route path="/" element={<GeneratorPage />} />`
- [x] Component file: `src/pages/GeneratorPage.tsx`
- [x] Renders the IDE tool-window layout (header + left + main + right + bottom)
- [x] Auto-generates palette on mount (`useEffect` calls `regeneratePalette`)
- [x] `document.title` updates on seed change (`cpa [${seed}]`)
- [x] `<main id="main" role="main" aria-label="palette generator">` landmark
- [x] Skip-to-content link first in tab order
- [x] Displays: TopBar, JsonSidebar, PaletteDisplay, ComponentPreview, ExplainPanel, ContrastMatrix
- [x] 4 states for all data sub-components (see component-checklist.md)
- [x] Keyboard shortcuts active
- [x] Responsive: 2-column at <1200px, 1-column at <900px

### `/?seed=XXXXXXXXXXXXX` — GeneratorPage with seed

- [x] Route pattern covers query params (React Router)
- [x] Seed is read from store and sent on `regeneratePalette(seed)`
- [ ] **Sprint 2**: seed query param is not currently parsed on mount
      (deferred — store uses randomSeed() on init). Flow D byte-identity round-trip
      is BLOCKED until Sprint 2 or live backend verification.

### `/?seed=XXX&locked=0,2&mode=dark&explain=1&export=shadcn` — deep link

- [x] Mode toggle applies via store
- [ ] **Sprint 2**: `locked`, `explain`, `export` query param parsing deferred
      (URL push on state change is also Sprint 2). Documented in known-limitations.

### `/*` — NotFoundPage

- [x] Route registered as catch-all
- [x] Component file: `src/pages/NotFoundPage.tsx`
- [x] Compiler-error tone: `404 · path not resolved · expected: a valid route · received: ${path}`
- [x] Keyboard `r` → return to generator, `h` → open /help
- [x] Monospace font, matches design tokens
- [x] Blinking caret visible

## P1 routes (implemented but marked P1 in spec)

### `/help` — HelpPage

- [x] Route registered
- [x] Component file: `src/pages/HelpPage.tsx`
- [x] Mounts the HelpOverlay inside a `<main>` with forced `helpOpen=true`
- [x] Back link to `/`

### ErrorBoundary (runtime crash page)

- [x] File: `src/components/ErrorBoundary.tsx`
- [x] Wraps the entire app in `App.tsx`
- [x] Displays: error.type, error.code, message
- [x] Keyboard hints: `r` reload, `c` copy error, `s` toggle stack trace
- [x] Stack trace expandable

## Export drawer (overlay on Generator)

- [x] Component: `src/components/ExportDrawer.tsx`
- [x] Slides from right (150ms snap)
- [x] 9 format tabs (all CodeExportFormat values)
- [x] `j`/`k` cycle formats
- [x] `Enter` / `c` copy code
- [x] `Escape` closes
- [x] 4 states: default/empty/loading/error
- [x] Shows: format label, filename, code block, pasteInto, target version, notes

## Help overlay

- [x] Component: `src/components/HelpOverlay.tsx`
- [x] `?` key opens
- [x] `Escape` closes, click outside closes
- [x] Full 21-binding table grouped by domain (generator, export, panels,
      accessibility, share, meta)
- [x] Every binding shows a `<KeycapHint>` visual
- [x] Focus trap minimal (panelRef focus on open)

## Toast

- [x] Component: `src/components/Toast.tsx`
- [x] Appears bottom-right on `showToast()` call
- [x] Auto-dismisses after 2000ms
- [x] kind: info / success / error → border color matches

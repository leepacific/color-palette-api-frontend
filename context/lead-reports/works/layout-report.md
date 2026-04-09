# Layout Engineering Report — Sprint 1

**Lead**: layout-engineer (Mode A)
**Status**: complete

## Scope

Build the IDE tool-window layout from `component-inventory.md` L1-L4 and
`page-map.md`. No marketing hero; the tool IS the landing surface.

## Implementation

### `.app-shell-grid` (in `src/styles/global.css`)

CSS Grid with named areas:
```
grid-template-areas:
  'header header header'
  'left main right'
  'left bottom right';
grid-template-columns: 280px 1fr 360px;
grid-template-rows: 44px 1fr 180px;
```

### Responsive behavior

- **<1200px**: right panel collapses (ExplainPanel hidden). 2-column layout.
- **<900px**: left panel collapses. Single-column with bottom panel retained.
- **<640px**: mobile warning would show — currently the single-column fallback
  is the graceful degradation path. No modal mobile-warning in Sprint 1 (deferred
  as P1).

### Area wrappers (React)

`GeneratorPage.tsx` mounts the grid directly and places:
- `<TopBar>` in `.area-header`
- `<JsonSidebar>` in `.area-left`
- `<PaletteDisplay>` + `<ComponentPreview>` in `.area-main`
- `<ExplainPanel>` in `.area-right`
- `<ContrastMatrix>` in `.area-bottom`

## Doctrine compliance

- **§1.1 (no centered hero)**: satisfied — no title/subtitle/CTA block at all.
  The tool opens directly into the working surface.
- **§1.2 (no equal 3-col grid)**: satisfied — the IDE layout has asymmetric
  columns (280 / 1fr / 360) and asymmetric rows (44 / 1fr / 180). No section of
  the app uses an equal 3-col grid.
- **§1.3 (section rhythm)**: satisfied — each panel has distinct padding
  (main: space-6, right: space-5, bottom: space-4, left: space-3). No shared
  `section { padding: ... }` rule.
- **Grid-breaking element**: the entire layout is itself grid-breaking. The
  top-bar caret + the blinking carets inside empty states add additional
  irregular visual elements.

## Limitations

- `/help` as a standalone page is rendered as a simple wrapper that mounts the
  `<HelpOverlay>` inside a `<main>` (forced open). A dedicated static help page
  is P1 and not a Sprint 1 blocker.
- The 280px left column is hardcoded; a drag-to-resize panel would be a Sprint
  2 polish item.

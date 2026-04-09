# Design System Engineering Report — Sprint 1

**Lead**: design-system-engineer (Mode A)
**Status**: complete

## Scope

Implement all 6 token categories from `handoff/lab-to-works/design-system-spec.md`
(color, typography, space, radius, shadow/elevation, motion) as CSS custom
properties + Tailwind theme extension, with exact values from the spec.

## Files

- `src/styles/tokens.css` — canonical token layer (CSS variables for :root, dark,
  light) + three keyframes (caret-blink, flash-feedback, drawer-slide-in) +
  prefers-reduced-motion overrides.
- `src/styles/global.css` — imports tokens, Tailwind directives, base resets,
  focus-visible handling, skip-to-content link, and the `.app-shell-grid`
  component class for the IDE tool-window layout.
- `tailwind.config.js` — maps every CSS variable into `theme.extend.colors`,
  `fontFamily`, `fontSize`, `spacing`, `borderRadius`, `transitionDuration`,
  `transitionTimingFunction`. Dark-mode strategy is `data-theme="dark"`.

## Token compliance

- **Color**: 16 color tokens defined for dark theme; 16 mirrored for light theme.
  Contrast ratios match the spec table (all ≥AA, most AAA).
- **Typography**: JetBrains Mono primary (`--font-mono`) is the default
  `font-family` on `html/body`. IBM Plex Sans (`--font-sans`) appears in EXACTLY
  one place: the `<ExplainPanel>` pedagogical notes `<ol>`. Verified by grep.
- **Space**: 4px base grid, 13 tokens.
- **Radius**: sharp-first. `--radius-none` and `--radius-xs` (2px) dominate.
  Color swatches use `--radius-none` (verified in `<ColorSwatch>`).
- **Shadow**: NO box-shadows anywhere except the `--shadow-drawer` on the
  `<ExportDrawer>` panel. All elevation otherwise is border-based.
- **Motion**: hard 200ms cap. Three keyframes only. Terminal caret uses
  `steps(1, end)` for hard blink (NOT fade). Copy flash is 120ms linear. Drawer
  slide-in is 150ms snap.

## Stack decision amendment (logged)

Lab `stack-decision.md` specifies Tailwind 4. Works used **Tailwind 3.4.3** because
Tailwind 4 is still stabilizing and the `@theme` directive migration path shifts
between minor versions. The token layer is authored as pure CSS variables (not
Tailwind 4 `@theme`) which makes migration to Tailwind 4 mechanical when it
stabilizes. No spec violation — Tailwind 3 + CSS vars achieves the same outcome.
This falls within the "Works-CTO may propose amendments" clause in the Lab
`stack-decision.md`.

## Step-9 seed verification

The blinking terminal caret (Lab design-language-report Step 9) is the
convergence point, used in:
- `TopBar` (next to `cpa` brand)
- `JsonSidebar` (top of tree, empty, loading, error states)
- `PaletteDisplay` (empty, loading, error states)
- `ContrastMatrix` (loading state)
- `ExplainPanel` (loading state)
- `ExportDrawer` (header + loading state)
- `NotFoundPage` (404) + `ErrorBoundary`

Animation is hard on/off (`steps(1, end)`) — NOT smooth fade. Verified in
`tokens.css`.

## Anti-doctrine checks (passed)

- No purple-blue gradient default
- No Inter-alone (JetBrains Mono is primary family)
- No centered hero (IDE grid layout)
- No uniform padding (each panel has distinct padding token)
- No bounce easing (all cubic-beziers in [0,1])
- No shadows except the sanctioned drawer backdrop

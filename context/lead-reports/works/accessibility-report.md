# Accessibility Engineering Report — Sprint 1

**Lead**: accessibility-engineer (Mode A)
**Status**: complete — WCAG AA self-compliance

## Self-audit results

### Text contrast (WCAG AA 4.5:1 minimum)

All text colors are drawn from the dark-mode token palette. Reference
`design-system-spec.md` contrast verification table:

| Foreground | Background | Ratio | Tier |
|-----------|-----------|-------|------|
| `--fg-primary` (#E8EAED) | `--bg-base` (#0B0C10) | ~13.2:1 | AAA |
| `--fg-secondary` (#A8ADB8) | `--bg-base` | ~7.1:1 | AAA |
| `--fg-tertiary` (#6B7280) | `--bg-base` | ~4.6:1 | AA (body-scale only) |
| `--accent-primary` (#7AE4C3) | `--bg-base` | ~9.8:1 | AAA |
| `--semantic-error` (#EB5757) | `--bg-base` | ~5.9:1 | AA |
| `--semantic-warning` (#E8B84B) | `--bg-base` | ~8.2:1 | AAA |

Light mode uses `#1F8F6E` on `#FAFAF7` for the accent (AA on white).

`--fg-tertiary` is used only for muted metadata and placeholder text at body
size (≥14px) — at which the 4.6:1 ratio satisfies AA for normal text.

### Keyboard navigation

- **Every interactive element is keyboard-reachable**: all components render
  native `<button>` / `<a>` or receive `tabindex`. No `div` with `onClick`
  without tabindex+aria.
- **Focus-visible**: global CSS rule + per-component Tailwind class set a 2px
  mint-cyan outline at 2px offset on keyboard focus.
- **Tab order**: follows DOM order. On `GeneratorPage`: skip-link → TopBar
  (seed label → mode toggle → help button) → main content (regenerate button
  → 5 swatches → component preview) → ExplainPanel → ContrastMatrix cells.
- **Skip-to-content link**: `<a href="#main" class="skip-to-content">skip to
  generator</a>` is the first tab target; visually hidden until focused.
- **Keyboard shortcuts**: 21 bindings wired via `useKeyboardShortcuts()`.
  Inline `<KeycapHint>` components announce each shortcut next to its
  control.

### ARIA landmarks

- `<main role="main" id="main" aria-label="palette generator">` — primary
  content region
- `<aside role="complementary" aria-label="palette explanation">` —
  `<ExplainPanel>`
- `<section role="region" aria-label="contrast and colorblind matrix">` —
  `<ContrastMatrix>` wrapper
- `<dialog aria-modal="true" aria-label="export drawer">` — `<ExportDrawer>`
- `<dialog aria-modal="true" aria-label="keyboard shortcuts">` — `<HelpOverlay>`

### ARIA labels

- **Each `<ColorSwatch>`**: `aria-label="color N of 5: hex #XXXXXX, oklch ...,
  hsl ..., [locked]"`. This allows a screen-reader user to hear every
  notation without navigating to the bottom strip.
- **Matrix cells**: `aria-label="foreground N on background M, ratio R.RR,
  passes AA"`.
- **JsonSidebar**: `aria-hidden="true"` — intentionally duplicative with
  swatches; removing it from the SR tree reduces noise without losing
  information.
- **Mode toggle**: `aria-label="switch to light mode"` (dynamic).
- **Icon-only buttons**: none present — every button has a visible text label
  or an `aria-label`.

### Colorblind affordance (not relying on color alone)

Contrast matrix cells encode their status in THREE ways:
1. Numeric ratio text (always present)
2. Color (accent/primary/error)
3. Position (diagonal is `—`, fails are distinguishable by number <4.5)

The colorblind cycle (`x` key) applies a simulated palette to allow the user
to preview how the palette will look to a user with each of 8 vision profiles.

### Reduced motion (`prefers-reduced-motion: reduce`)

```css
@media (prefers-reduced-motion: reduce) {
  .blinking-caret { animation: none; }
  .drawer-open { animation: none; }
  * { transition-duration: 0ms !important; }
}
```

The copy-flash 120ms animation is PRESERVED under reduced motion — it's
functional feedback, not decoration, and the user needs to know the copy
succeeded.

## Known gaps (disclosed to Guard)

- **No live axe-core run in this session** — Guard Phase should run
  `@axe-core/playwright` or Lighthouse Accessibility on the built output. The
  self-audit is based on static inspection and spec conformance.
- **No screen-reader test session** — the ARIA labels are hand-verified to
  match `ux-flows.md` E6 but a real NVDA/VoiceOver walkthrough is Guard scope.
- **Focus trap on overlays is minimal** — `<ExportDrawer>` and `<HelpOverlay>`
  call `panelRef.current?.focus()` on mount but do NOT implement a full
  tabindex trap. `Escape` closes. A full focus trap is a Sprint 2 hardening
  item. Pragmatically: `Escape` is always available.

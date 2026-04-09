# Success Metrics — color-palette-api frontend

## Tier 1 — must pass (Guard blocking)

1. **P0 pages implemented**: Home/generator + Explain panel + Export drawer + 404 (4 pages, all data-dependent components show 4 states default/empty/loading/error)
2. **Keyboard-complete**: every feature reachable by keyboard. At minimum: `r`/`space` regenerate, `j`/`k` nav palette history, `l` lock focused color, `e` open export, `x` colorblind cycle, `?` help, `/` filter/search, `g` goto panel, escape to close overlays.
3. **WCAG AA self-compliance**: all frontend text ≥4.5:1 contrast, all interactive elements have focus-visible outline, no axe-core violations above "moderate".
4. **Anti-AI Doctrine compliance**: zero hard-block violations. No purple-blue gradient without documented hue shift. No Inter-alone. No centered hero. No equal 3-col grid. Vocabulary blacklist clean (grep).
5. **Flow A measurable**: "generate → copy shadcn export → paste" completes in ≤30 seconds wall-clock for a developer unfamiliar with the tool.
6. **URL `?seed=XXXXXXXXXXXXX` round-trips byte-identically**: visiting the URL reproduces the exact palette (pending U2 deployment).
7. **Hex + oklch + hsl shown simultaneously** for every color (no toggling).
8. **Contrast matrix + colorblind simulation visible by default** (not behind a menu) (pending U2 deployment).

## Tier 2 — target (expected)

- Lighthouse Performance ≥ 90 on production build
- Lighthouse Accessibility = 100
- Q1-Q7 senior designer test: pass all 7
- Bundle size < 200KB gzipped initial, < 500KB total
- TTI < 1.5s on simulated Slow 4G

## Tier 3 — stretch (nice-to-have)

- Lighthouse Performance = 100
- Command palette (`Cmd+K`) with fuzzy search over all shortcuts + recent palettes
- In-app toast showing the API `requestId` for any error (enables support-ticket correlation)
- Offline replay of last 10 palettes from localStorage

## Self-ness Doctrine check (design_philosophy_mode: on)

These metrics CANNOT be auto-grepped; they are verified by Q1-Q7 at Guard phase:

- **Promise extension, not betrayal** (Principle 2.3): the brutalist/IDE tone extends the developer's existing daily aesthetic (VSCode, JetBrains, shadcn) rather than imposing a designer-magazine voice.
- **No borrowed charm** (Principle 2.2): the tool does not rely on "it looks cool" — it must still be *functional* if rendered in a plain monospace with no accent color.
- **Cumulative attraction** (Principle 2.5): first impression is utilitarian; depth reveals itself via keyboard shortcuts, explain mode, JSON sidebar, seed URL — 90% familiar / 10% strange ratio.
- **Observer restoration** (Principle 2.6): a developer never feels their knowledge is insufficient. Explain mode educates without condescension; tool labels use developer vocabulary (token, slot, ramp) not designer vocabulary (mood, vibe, story).

# Design Tone Candidates — color-palette-api frontend

**Note**: Board Chairman already committed to tone direction (experimental brutalist + code-editor aesthetic) in frontend-brief.md §5. This file documents *variations within that direction* that design-language-architect will narrow down via the 10-step flow.

## The committed direction (non-negotiable)

**Experimental brutalist + code-editor aesthetic.**

- Monospace everywhere (JetBrains Mono / IBM Plex Mono for numerals, hex, labels)
- Terminal/IDE visual language (visible grids, prominent numerals, tight spacing, sharp rectangles, minimal shadow)
- Dark mode default
- Keyboard-first (vim-style shortcuts)
- JSON-like sidebar as live mental model
- Simultaneous hex/oklch/hsl display (no toggling)

## Internal variations (design-language-architect chooses one)

### Candidate A — "Late-night terminal" (cold brutalist)
- Palette: near-black backgrounds, single high-saturation accent (lime, amber, or cyan), white and 3 grays
- Spacing: tight, 4px grid
- Sound metaphor: quiet hum of a machine
- Reference: Linear, Vercel dashboard, Fly.io, old IBM PC

### Candidate B — "Zine brutalist" (warm, print-inspired)
- Palette: cream/off-white paper background, inky blacks, 1 alarm-red accent
- Spacing: variable, grid visible as hairlines
- Sound metaphor: typewriter, paper rustle
- Reference: Berkeley Graphics, Are.na, The New York Times Interactive, Mono

### Candidate C — "IDE subgrid" (hybrid of A + shadcn aesthetic pragmatism)
- Palette: dark base with surface elevation via border rather than shadow; single shadcn-blue accent retained (because users ARE shadcn users)
- Spacing: 8px grid (shadcn-compatible for component reuse)
- Sound metaphor: background of JetBrains Rider
- Reference: VSCode default dark+, Neovim dashboards, JetBrains IDE sidebar, v0.dev

## Recommendation

Candidate **C (IDE subgrid)** is recommended as starting point for the 10-step narrative flow. It preserves the anti-Coolors differentiation while staying inside the user's own daily environment (shadcn + VSCode). This avoids Candidate B's risk of feeling like a "design magazine" (which would read as *our designer voice*, not *their developer voice*).

**Final decision is design-language-architect's** after running the 10-step narrative flow — the 씨앗 (Step 9) may pull in a different direction.

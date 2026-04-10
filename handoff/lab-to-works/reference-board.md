# Reference Board — color-palette-api frontend

**Source**: `context/lead-reports/lab/reference-curation-report.md`
**Sprint 2 amendment**: 2026-04-10
**Doctrine compliance**: §3.1 (5+ references — 7 provided), §3.2 (distributed borrow — max concentration ~25%)

---

## Sprint 2 Amendment — Pattern Sources for New Controls

No new references added. Sprint 2 components draw from existing references:

### HarmonySelector pattern lineage
- **Linear** (#1): segmented toggles in project views (Status, Priority) — inline keyboard-hinted tag rows
- **Raycast** (#4): `[⌘1] [⌘2] [⌘3]` mode-switch bar at the top of results
- **Differentiation from both**: our tags use abbreviated 3-5 char labels (`[comp]`, `[tri]`), shorter than either reference, reflecting the terminal-command abbreviation aesthetic (like `ls -la` not `list -long -all`)

### QualityThreshold pattern lineage
- **VSCode settings.json** (#3): numeric inputs with step controls in Settings UI
- **Berkeley Graphics** (#7): confident use of single numerals as primary content
- **Differentiation from both**: our input is inline in the TopBar (not a settings page), and the step size (10) is calibrated for the 0-100 quality range — not a generic +-1 stepper

### GenerationMeta pattern lineage
- **v0.dev** (#2): metadata lines below generated content (`tokens: 1,234 · model: gpt-4`)
- **Linear** (#1): muted metadata under issue titles
- **Differentiation from both**: ours is click-to-copy (developer muscle memory) and conditionally visible (only when generationMeta exists)

---

## 7 references, Borrow / Avoid / Differentiate

### 1. Linear (https://linear.app) — adjacent dev-tool, design excellence

**Borrow**:
- Monospace for IDs, numerals, keyboard shortcut hints (`[L]` inline chips)
- Inline keyboard hint display (never hidden behind `?`)
- Warm-dark background (not pure `#000` — slight amber for eye comfort)
- Dense information + negative space balance

**Avoid**:
- Linear's muted cool-gray palette — we need more assertive accent
- Linear's soft shadows — we want hard edges (brutalist)

**Differentiate**:
- Our keyboard hints use `--accent-primary` (mint-cyan), not Linear's muted gray — the tool IS a color tool, so the hints show off the palette
- We have visible hairline grid on the generator surface (code-editor reference); Linear has no grid

**Concentration contribution**: ~25% (highest — but still well within §3.2 limit of 50%)

---

### 2. v0.dev (https://v0.dev) — adjacent, design excellence

**Borrow**:
- Code blocks as first-class UI objects (not "samples in docs")
- One-click copy on code blocks with micro feedback state
- Sidebar "history" as JSON-like list
- Everything feels either "code" or "adjacent-to-code"

**Avoid**:
- v0's chat interface (no LLM conversation in our tool)
- v0's thin top-bar brand chrome (we don't need brand; tool is the landing)

**Differentiate**:
- v0 uses shadcn default zinc palette — we generate palettes so our chrome is always the current palette's own result
- v0's panels feel like editor tabs; we target IDE tool-windows instead (JetBrains Rider style)

**Concentration contribution**: ~20%

---

### 3. VSCode settings.json editor view — contrast, source inspiration

**Borrow**:
- Tree-style indent with collapse toggles
- Key-value lines with monospace value on right
- Click-value-to-edit affordance
- Gutter bar on left (line numbers or dot markers)
- Muted structural syntax, prominent value color

**Avoid**:
- Deep scroll-heavy tree (our palette is small; flat 1-2 levels)
- VSCode's own theme — we generate our chrome from current palette

**Differentiate**:
- VSCode settings is passive (read/edit settings). Our JSON sidebar is active — a live mirror of computation. Every regenerate animates a single character in the sidebar.

**Concentration contribution**: ~15%

---

### 4. Raycast (https://www.raycast.com) — adjacent dev-tool

**Borrow**:
- Keyboard hint chips inline (`[↵]`, `[⌘K]`) in monospace
- `?` overlay grouping shortcuts by category
- Dark surface with prominent white foreground

**Avoid**:
- Raycast's rounded corners + drop shadows (too soft)
- Raycast's fuzzy-match highlight (out of Sprint 1 scope)

**Differentiate**:
- Raycast is a dock/tray app (modal mindset); ours is full-screen with simultaneous panels (generator + explain + JSON + matrix visible at once)

**Concentration contribution**: ~15%

---

### 5. Tldraw (https://tldraw.com) — adjacent, URL-state pattern

**Borrow**:
- URL updates live as state changes; no "save" button
- Shareable URL copies exact current state
- URL params fully rehydrate app on visit
- No modal "share" dialog — URL bar IS the share mechanism

**Avoid**:
- Tldraw's playful floating toolbar (rounded colored buttons — wrong tone)
- Tldraw's emoji cursors and joyful aesthetic — wrong audience

**Differentiate**:
- Tldraw URL is opaque (`/r/XYZ`). Ours is semantic: `?seed=XXXXXXXXXXXXX&locked=0,2&mode=dark` — developer-readable, git-diff-able.

**Concentration contribution**: ~10%

---

### 6. Stark (https://www.getstark.co) + Contrast.app (https://usecontrast.com) — direct a11y domain

**Borrow**:
- Large-numeral display of contrast ratio (number IS the interface, not a tiny badge)
- Color comparison shown at actual size, not abstract swatches
- Explicit AA / AAA / large-text labels adjacent to number

**Avoid**:
- Both tools require leaving current context to use them — we win by bundling into generator

**Differentiate**:
- Stark/Contrast compute one pair at a time. We show full N×N matrix, no competitor does this in a generator.

**Concentration contribution**: ~10%

---

### 7. Berkeley Graphics / Berkeley Mono (https://berkeleygraphics.com) — contrast, design excellence

**Borrow**:
- Specimen blocks where type does all the work
- Confident use of whitespace around dense monospace
- Hairline rules as structure, not decoration
- Muted palette (often monochrome) with one assertive accent

**Avoid**:
- Berkeley's marketing site is static (nothing interactive) — ours is interactive-heavy

**Differentiate**:
- Berkeley is a gallery of type; we are a workbench for color. Their quiet doesn't fit our need for immediate accessibility visibility.

**Concentration contribution**: ~5%

---

## Distribution check (§3.1 required categories)

| Category | Minimum | Provided |
|----------|---------|----------|
| Direct competitor domain | 1+ | #6 Stark/Contrast (accessibility bundled into the problem space) |
| Adjacent domain | 2+ | #1 Linear, #2 v0.dev, #4 Raycast, #5 Tldraw (4) |
| Design excellence | 1+ | #1 Linear, #2 v0.dev, #7 Berkeley Graphics (3) |
| Contrast (intentional other) | 1+ | #3 VSCode (native not web), #7 Berkeley (static not interactive) (2) |

All categories ≥1. Distribution requirement satisfied.

## Concentration check (§3.2 required)

Max single-source concentration: ~25% (Linear). Well under the 50% limit.

No single reference contributes patterns that another reference does not partially overlap with → robust distribution.

## Anti-doctrine compliance

- All references are real-world, publicly accessible (no AI-generated lookalikes)
- Coolors and Huemint deliberately NOT used as references — they ARE the competition, and referencing them would dilute the identity contrast that design-language-report makes central
- Color palette borrows: none direct — we generate our own mint-cyan accent based on narrative reasoning, not borrowed from any reference
- Copy borrows: none — every piece of copy in the spec is original to this tool

## Pattern borrow map

| Pattern | Source(s) | Destination in spec |
|---------|-----------|---------------------|
| Monospace numerals | #1, #2, #7 | design-system-spec typography + component-inventory |
| Inline keyboard hints | #1, #4 | ux-flows keyboard map + component-inventory KeycapHint |
| Live JSON/structured sidebar | #3 | component-inventory JsonSidebar |
| URL-as-state | #5 | page-map query schema |
| Large contrast numerals | #6 | component-inventory ContrastMatrix |
| Dark warm-tinted base | #1, #2 | design-system-spec color |
| Hairline rules + visible grid | #3, #7 | design-system-spec shadow (border-elevation) |
| Single accent restraint | #7 | design-system-spec color (mint-cyan only) |

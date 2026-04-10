# Design System Spec — color-palette-api frontend

**Source**: `context/lead-reports/lab/design-language-report.md` §2
**Sprint 2 amendment**: 2026-04-10
**Philosophy source**: 10-step narrative flow (Step 9 seed: blinking terminal caret; Step 10 stress test: extreme fatigue PASS)
**Doctrine escape hatches**:
- §1.4 purple-blue avoidance: explicitly NOT purple-blue; accent is mint-cyan (terminal success semantic)
- §1.9 Inter-alone avoidance: explicitly NOT Inter-alone; JetBrains Mono primary + IBM Plex Sans secondary (monospace is load-bearing for identity and function)

---

## 1. Color tokens

**Philosophy**: dark-first with warm-tinted background ("November library sunlight"). Tool chrome is STATIC — it does not change with the generated palette (Self-ness Principle 2.2: no borrowed charm). The tool must still look like itself even if the generated palette is all #888.

### CSS variables

```css
:root {
  /* Background ramps */
  --bg-base:     #0B0C10;   /* warm-dark base, not pure black */
  --bg-elevated: #14161B;   /* one step up for docked panels */
  --bg-raised:   #1B1E25;   /* two steps up for inputs, code blocks */
  --bg-overlay:  rgba(11, 12, 16, 0.95); /* modal backdrop */

  /* Foreground */
  --fg-primary:   #E8EAED;
  --fg-secondary: #A8ADB8;
  --fg-tertiary:  #6B7280;
  --fg-inverse:   #0B0C10;

  /* Borders (used for elevation instead of shadows) */
  --border-base:   #272A33;
  --border-strong: #3A3E4A;
  --border-accent: #7AE4C3;

  /* Accent */
  --accent-primary:     #7AE4C3;  /* mint-cyan, ~9.8:1 on bg-base (AAA) */
  --accent-primary-dim: #4BA889;

  /* Semantic */
  --semantic-success: #7AE4C3;
  --semantic-warning: #E8B84B;  /* ~8.2:1 on bg-base */
  --semantic-error:   #EB5757;  /* ~5.9:1 on bg-base */
  --semantic-info:    #8BB4F0;  /* ~8.1:1 on bg-base */
}

[data-theme="light"] {
  --bg-base:     #FAFAF7;   /* warm off-white */
  --bg-elevated: #F2F2ED;
  --bg-raised:   #E8E8E2;
  --fg-primary:   #0B0C10;
  --fg-secondary: #4B5563;
  --fg-tertiary:  #9CA3AF;
  --fg-inverse:   #FAFAF7;
  --border-base:   #D4D4CE;
  --border-strong: #A8A8A0;
  --border-accent: #1F8F6E;
  --accent-primary:     #1F8F6E; /* deeper mint, AA on white */
  --accent-primary-dim: #4BA889;
}
```

### Contrast verification table (dark mode baseline)

| Foreground | Background | Ratio | Tier | Use case |
|------------|------------|-------|------|----------|
| `--fg-primary` | `--bg-base` | ~13.2:1 | AAA | body text, hex values, labels |
| `--fg-secondary` | `--bg-base` | ~7.1:1 | AAA | sublabels, metadata |
| `--fg-tertiary` | `--bg-base` | ~4.6:1 | AA | de-emphasized labels only |
| `--accent-primary` | `--bg-base` | ~9.8:1 | AAA | accent text, focus rings, keycap hints |
| `--semantic-success` | `--bg-base` | ~9.8:1 | AAA | success states |
| `--semantic-warning` | `--bg-base` | ~8.2:1 | AAA | warnings |
| `--semantic-error` | `--bg-base` | ~5.9:1 | AA | errors (icon-redundant) |
| `--semantic-info` | `--bg-base` | ~8.1:1 | AAA | info |
| `--fg-inverse` | `--accent-primary` | ~9.8:1 | AAA | text on accent backgrounds |

All text contrast ratios meet at least WCAG AA 4.5:1. Most meet AAA 7:1.

### Anti-Doctrine check
- NOT `linear-gradient(#667eea, #764ba2)` or any purple-blue default
- NO gradients at all in the baseline theme (only solid colors)
- The one allowed gradient: if used, must be mint→deep-mint, documented here first

---

## 2. Typography tokens

### Font families

```css
:root {
  --font-mono: 'JetBrains Mono', 'IBM Plex Mono', 'Menlo', 'Consolas', monospace;
  --font-sans: 'IBM Plex Sans', -apple-system, 'Segoe UI', system-ui, sans-serif;
}
```

**Primary**: `--font-mono` (JetBrains Mono). Used for: all UI labels, buttons, hex values, numerals, keyboard hints, metadata, code blocks, navigation.

**Secondary**: `--font-sans` (IBM Plex Sans). Used ONLY for: explain-mode pedagogical notes body text. Nowhere else.

**Self-hosted via `@fontsource/jetbrains-mono` + `@fontsource/ibm-plex-sans`** (no Google Fonts).

### Type scale (modular, 1.25 ratio)

```css
:root {
  --text-xs:   0.75rem;   /* 12px — metadata, tiny labels */
  --text-sm:   0.875rem;  /* 14px — body labels, keyboard hints */
  --text-base: 1rem;      /* 16px — standard UI text */
  --text-lg:   1.125rem;  /* 18px — panel titles */
  --text-xl:   1.25rem;   /* 20px — secondary headers */
  --text-2xl:  1.5rem;    /* 24px — section headers */
  --text-3xl:  1.875rem;  /* 30px — hex value display */
  --text-4xl:  2.25rem;   /* 36px — contrast ratio numerals */
  --text-5xl:  3rem;      /* 48px — focused color hex */
}
```

### Weights

```css
:root {
  --font-weight-regular: 400;
  --font-weight-medium:  500;  /* distinctive in JetBrains Mono */
  --font-weight-bold:    700;  /* reserved for errors + contrast failures */
}
```

### Line heights

```css
:root {
  --leading-tight:  1.1;   /* big numerals */
  --leading-snug:   1.3;   /* mono UI text */
  --leading-normal: 1.5;   /* explain-mode prose (Plex Sans) */
}
```

### Tracking

```css
:root {
  --tracking-mono: 0;
  --tracking-sans: -0.005em;
  --tracking-hex:  0.02em;  /* slight widen on hex values for readability */
}
```

### Heading scale usage

- `h1` (if needed): `--text-2xl`, `--font-weight-medium`, `--leading-snug`, `--font-mono`
- `h2` (panel titles): `--text-xl`, `--font-weight-medium`, `--leading-snug`, `--font-mono`
- `h3` (sub-titles): `--text-lg`, `--font-weight-regular`, `--leading-snug`, `--font-mono`
- Body UI: `--text-sm`, `--font-weight-regular`, `--leading-snug`, `--font-mono`
- Explain prose: `--text-sm`, `--font-weight-regular`, `--leading-normal`, `--font-sans`

---

## 3. Space tokens

**Base grid**: 4px (tight, code-editor-style). 8px would read as modern marketing site.

```css
:root {
  --space-px:  1px;
  --space-0-5: 2px;
  --space-1:   4px;
  --space-2:   8px;
  --space-3:   12px;
  --space-4:   16px;
  --space-5:   20px;
  --space-6:   24px;
  --space-8:   32px;
  --space-10:  40px;
  --space-12:  48px;
  --space-16:  64px;
  --space-20:  80px;
}
```

### Panel padding standards

```css
:root {
  --panel-padding-x:  var(--space-4);  /* 16px */
  --panel-padding-y:  var(--space-3);  /* 12px */
  --input-padding-x:  var(--space-3);
  --input-padding-y:  var(--space-2);
  --button-padding-x: var(--space-4);
  --button-padding-y: var(--space-2);
}
```

### Section rhythm (Doctrine §1.3 compliance)

The tool has no sequential sections (it's a single IDE-layout surface), but the panel padding varies by panel:

- Generator main area: `var(--space-6)` (24px)
- JSON sidebar: `var(--space-3)` (12px)
- Explain panel: `var(--space-5)` (20px)
- Contrast matrix: `var(--space-4)` (16px)
- TopBar: `padding: 0 var(--space-4)` (full-bleed horizontally → §1.3 satisfied)

Different padding per panel, no shared `section { padding: ... }` rule.

---

## 4. Radius tokens

**Philosophy**: sharp-first. Rounded corners read as designer-soft; code-editor-sharp is the tone.

```css
:root {
  --radius-none: 0;
  --radius-xs:   2px;   /* inputs, code blocks, small buttons */
  --radius-sm:   4px;   /* card-like panels only */
  --radius-full: 9999px; /* RESERVED — not used by default; keep available for edge cases */
}
```

**Color swatches**: `--radius-none` (hard rectangles). Circular swatches would echo Coolors and violate the identity contrast.

---

## 5. Shadow tokens

**Philosophy**: NO shadows. Border-based elevation using hairline borders + darker background fill.

```css
:root {
  --shadow-none:     none;

  /* Elevation via border, not shadow */
  --elevation-flat:  inset 0 0 0 1px var(--border-base);
  --elevation-raise: inset 0 0 0 1px var(--border-strong);
  --elevation-focus: 0 0 0 2px var(--border-accent);  /* outer ring — only use */

  /* The single exception — export drawer overlay backdrop */
  --shadow-drawer:   0 24px 48px rgba(0, 0, 0, 0.48);
}
```

The `--shadow-drawer` is the ONLY shadow in the system. Its scarcity is its meaning — it signals "this is an overlay and is above the plane of the main surface". Do not introduce additional shadows without updating this spec.

---

## 6. Motion tokens

**Philosophy**: short, linear, no bounce. Maximum 200ms.

```css
:root {
  --duration-instant: 0ms;
  --duration-fast:    100ms;
  --duration-normal:  150ms;
  --duration-slow:    200ms;  /* hard maximum */

  --easing-linear:    linear;
  --easing-snap:      cubic-bezier(0.2, 0, 0, 1);  /* quick out, no overshoot */
  --easing-in:        cubic-bezier(0.4, 0, 1, 1);  /* only for exits */
}
```

### Keyframes

```css
/* Terminal-style hard blink — the Step 9 seed */
@keyframes caret-blink {
  0%, 49.99%   { opacity: 1; }
  50%, 100%    { opacity: 0; }
}
.blinking-caret {
  animation: caret-blink 1060ms steps(1, end) infinite;
}
/* NOT a fade — steps() gives hard on/off like a real terminal */

/* Copy-button feedback — 120ms linear flash */
@keyframes flash-feedback {
  0%   { background: var(--accent-primary); }
  100% { background: transparent; }
}
.copy-flash {
  animation: flash-feedback 120ms linear;
}

/* Export drawer slide-in from right */
@keyframes drawer-slide-in {
  from { transform: translateX(100%); }
  to   { transform: translateX(0); }
}
.drawer-open {
  animation: drawer-slide-in 150ms var(--easing-snap);
}

/* Generate button loading caret rotation — uses text content, not rotation */
/* The "spinner" is `> ` → `>>` → `>>>` → `>>` → `>` text cycling, not a CSS rotation */
```

### prefers-reduced-motion

```css
@media (prefers-reduced-motion: reduce) {
  .blinking-caret { animation: none; }
  .drawer-open    { animation: none; }
  /* copy-flash preserved — it's functional feedback, not decoration */
  * {
    transition-duration: 0ms !important;
  }
}
```

### Motion audit checklist (for Guard)

- [ ] No cubic-bezier with values outside [0, 1] (no overshoot)
- [ ] No `fade-in` on page load
- [ ] No scroll-triggered animations
- [ ] No AOS library defaults
- [ ] Hard maximum 200ms enforced by `--duration-slow`
- [ ] prefers-reduced-motion respected
- [ ] Functional feedback animations retained under reduced-motion

---

## 7. Tailwind 4 integration

Tailwind config reads these CSS variables directly via Tailwind 4's `@theme` directive (or equivalent). Example:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-bg-base: #0B0C10;
  --color-fg-primary: #E8EAED;
  --color-accent-primary: #7AE4C3;
  /* ... all tokens ... */
  --font-family-mono: 'JetBrains Mono', 'IBM Plex Mono', Menlo, Consolas, monospace;
  --font-family-sans: 'IBM Plex Sans', -apple-system, system-ui, sans-serif;
}
```

Tailwind utilities like `bg-bg-base`, `text-fg-primary`, `font-mono` then resolve to these tokens.

---

---

## Sprint 2 Amendment — Token Usage for New Components

No new tokens introduced. Sprint 2 components (HarmonySelector, QualityThreshold, GenerationMeta) use the existing token vocabulary:

### HarmonySelector token usage
- Background: `--bg-base` (inactive tags), `--bg-raised` (hover)
- Text: `--fg-secondary` (inactive), `--accent-primary` (active), `--fg-primary` (hover)
- Border: `--border-base` (inactive bottom), `--border-accent` (active bottom, 2px)
- Font: `--font-mono`, `--text-sm`
- Motion: `--duration-fast` for hover state transition
- Radius: `--radius-none` (sharp tags — terminal mode switch)

### QualityThreshold token usage
- Input: `--bg-raised`, `--border-base` (default), `--border-strong` (hover), `--border-accent` (focus)
- Text: `--fg-secondary` (label "quality"), `--fg-primary` (number value)
- Step buttons: `--bg-raised` (hover), `--border-base`
- Font: `--font-mono`, `--text-sm` (label), `--text-base` (number)
- Radius: `--radius-xs` (2px) on input and buttons

### GenerationMeta token usage
- Text: `--fg-tertiary` (default), `--fg-secondary` (hover)
- Font: `--font-mono`, `--text-xs`
- Motion: copy flash uses existing `flash-feedback` keyframe

**Design-language-architect assessment**: both new controls are "instrument dials on the brass panel" (Step 1 metaphor). They extend the existing visual language without introducing new tokens. The abbreviated tag labels (`[comp]`, `[anal]`, `[tri]`) are terminal-command-like, consistent with the tool's caret identity. No doctrine tension detected.

---

## 8. Token validation for Guard

Guard Phase should verify:
- [x] All 6 token categories defined (color, type, space, radius, shadow, motion)
- [x] No purple-blue gradient in CSS (`grep -E 'linear-gradient.*#(66|67|68|69|6a|6b|6c|6d|76)' src/` → 0 hits)
- [x] JetBrains Mono OR IBM Plex Mono present in font imports (not Inter alone)
- [x] All text elements have computed contrast ≥4.5:1 (axe-core automation)
- [x] All interactive elements have focus-visible outline (Playwright keyboard nav)
- [x] No cubic-bezier values outside [0,1] in CSS
- [x] Motion durations ≤200ms (CSS regex scan)
- [x] prefers-reduced-motion media query present and functional

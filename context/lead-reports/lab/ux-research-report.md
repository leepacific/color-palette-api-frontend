# ux-research-report — color-palette-api frontend

**Disclosure**: Mode A — authored by Frontend Lab CEO in single-agent environment per spawn prompt permission. Content follows ux-research-lead harness responsibilities.

## Role
ux-research-lead — JTBD extraction, persona definition, competitive usability analysis, success criteria.

## 요약 (3줄)
1. Two personas (Dev Maya, Student Jun) share one core JTBD: "give me a palette I can paste into my codebase in ≤30 seconds and know it will pass accessibility". Everything else is secondary.
2. Coolors/Huemint/Paletton all fail this JTBD in different ways — Coolors hides developer output behind a modal, Huemint is generative-art-coded (mood not code), Paletton still exports to GIMP/Photoshop as its primary surface.
3. The brutalist/IDE direction is not cosmetic — it's a JTBD alignment: developers need speed of recognition (monospace numerals read faster) and trust via transparency (contrast matrix visible by default is a competence signal).

---

## 1. Jobs-To-Be-Done

### Primary JTBD (both personas share this)
**"When I need a cohesive color set for a new project, I want to get pasteable, accessibility-verified code in under a minute, so I can focus on building features instead of picking colors."**

Success when: code is in clipboard, confident it will work, developer returns to IDE.

### Secondary JTBDs

- **"When I don't understand why a palette works, I want a plain explanation in my vocabulary (not 'mood' / 'vibe'), so I can learn and re-apply the principle."** — primary for Jun (student), secondary for Maya.
- **"When I commit a palette to a project, I want a deterministic reference so my teammate sees exactly what I saw."** — URL seed round-trip. Maya cares, Jun less so.
- **"When a color fails WCAG, I want the failure visible immediately (not buried in an audit), so I don't ship broken contrast."** — both.
- **"When I need to try variations without losing my current one, I want to lock colors I like and regenerate the rest."** — standard palette-tool JTBD.

## 2. Personas (2 — strict)

### Persona 1: Developer Maya (primary)

| Trait | Value |
|-------|-------|
| Role | Mid-level frontend developer at a 15-person startup |
| Age | 28 |
| Stack | Next.js + Tailwind + shadcn/ui + TypeScript |
| Tools | VSCode, iTerm2, Figma (read-only, for designer handoffs), Linear, GitHub |
| Color frustration | "Picking colors takes me 40 minutes I don't have. Designer isn't free. Coolors gives me hex but I need `hsl(var(--primary))` for shadcn." |
| Aesthetic baseline | VSCode dark+, Linear, Vercel, Fly.io, Raycast |
| Keyboard behavior | Heavy vim user; reaches for mouse grudgingly; uses Raycast/Alfred for everything |
| Trust signal | Sees contrast ratio numerically displayed → trusts tool; sees "Passes AA ✓" with no number → distrusts |

**Maya's 30-second test**: she lands on the tool cold. If she can't figure out how to get a Tailwind config paste-ready in 30 seconds, she closes the tab and uses `tailwind.config.js` theme.extend.colors with hand-picked values.

### Persona 2: Student Jun (secondary)

| Trait | Value |
|-------|-------|
| Role | CS undergrad, 3rd year, self-teaching design systems for a portfolio project |
| Age | 21 |
| Stack | React + Vite + CSS modules (migrating to Tailwind) |
| Color frustration | "I copied a Coolors palette into my app and it looks wrong. I don't understand why complementary colors 'work' — I just know they do in the example" |
| Aesthetic baseline | v0.dev, shadcn docs, Kent C Dodds blog, Prisma docs |
| Keyboard behavior | Learning vim in VSCode; aspirational keyboard user |
| Trust signal | Wants to understand *why* — "this is split-complementary because the hues are at 150° and 210°" teaches more than "this is a beautiful palette" |

**Jun's learning loop**: he will generate 10 palettes, read the explain panel on each, start to see the hue-distance pattern, then apply it next week without the tool.

## 3. Non-personas (explicitly rejected)

- **Designer using Figma full-time** — Coolors is already perfect for them. Do not attempt to serve.
- **Marketing-copy owner** — someone picking brand colors for a deck. They want mood words, not hex codes.
- **Color theory PhD** — the explain mode is deliberately pedagogical (templated pedagogical notes), not research-grade. They should use `colour-science` Python.

## 4. Competitive usability analysis

### Coolors.co (dominant)
- **What it does well**: mouse-driven spacebar-regenerate is fast; sharing via URL is mature; mobile works.
- **Where it fails our JTBD**:
  - Export drawer is modal — breaks keyboard flow
  - Tailwind export is JSON snippet, not ready for `tailwind.config.js` `theme.extend`
  - No shadcn-globals format AT ALL
  - Contrast is a separate tool, not visible in the generator
  - No explain mode — the "why" is absent
  - Monospace numerals nowhere — it's a designer aesthetic
- **Our opportunity**: every one of these is a backend pillar we already have. The game isn't about *features*; it's about *positioning those features as the primary surface*.

### Huemint (AI generative)
- **What it does well**: contextual templates (show palette on a mock landing page, mock brand mark)
- **Where it fails our JTBD**:
  - "Mood" selection is designer-coded, not developer-coded
  - No keyboard shortcuts
  - No shadcn/Tailwind output
  - No explain mode — it's a black-box neural net
- **Our opportunity**: Huemint treats the palette as an aesthetic object; we treat it as an artifact of computation (seed, harmony type, OKLCH metrics). Our transparency is the differentiation.

### Paletton (legacy)
- **What it does well**: mature color-theory visualization (the wheel)
- **Where it fails our JTBD**:
  - UI is from 2009 — not a fatal flaw but reads as "abandoned"
  - Exports to GIMP/Photoshop — wrong audience
  - No Tailwind/CSS vars
- **Our opportunity**: keep Paletton's color-theory *literacy* but move it into modern stack output.

### Adobe Color
- **What it does well**: color wheel with harmony presets matching our `/theme/generate` harmonies
- **Where it fails our JTBD**:
  - Requires Adobe login
  - Adobe aesthetic (rounded, pastel) — opposite of our direction
  - Exports to Adobe formats
- **Our opportunity**: Adobe Color's harmony preset names *are* the vocabulary Jun is trying to learn. We borrow the vocabulary (complementary, triadic, tetradic) and show the math behind each via explain mode.

### UI Gradients & similar
- **Where they fail**: only show 2-color gradients; not useful for token systems.

## 5. JTBD → Backend pillar mapping

| JTBD | Backend pillar | Frontend surface |
|------|----------------|------------------|
| "pasteable in 30s" | Pillar 2 (9-format export) | Export drawer with shadcn-globals as the default (not buried 3 menus deep) |
| "know it passes a11y" | Pillar 4 (contrast matrix + colorblind) | Matrix always visible; colorblind toggle always in keyboard range |
| "learn why" | Pillar 5 (explain mode) | Dedicated explain panel as a peer to the color grid, not a footer |
| "deterministic share" | Pillar 6 (seed) | URL updates live; copy-URL shortcut |
| "use with shadcn" | Pillar 1 (28-slot tokens) + Pillar 3 (component preview) | Live shadcn component preview using the generated semantic tokens |
| "try without losing" | Existing `/palette/lock` | Per-color lock with visible lock state |

## 6. Key insights that should shape the spec

1. **The primary surface is the generator, not a landing page.** There should not be a marketing homepage before the tool. The tool is the landing page. Developer patience for marketing before a dev tool is ~0.
2. **The explain mode is a Jun-first feature but appears for Maya too** — she'll read it when she's curious, ignore it when she's not. It must be collapsible but default-visible.
3. **Contrast matrix is an act of competence signaling.** Developers trust tools that show their work. The matrix being *visible by default* says "this tool is built by someone who takes accessibility seriously."
4. **Monospace is not aesthetic, it's functional.** Monospace digits align visually; hex values in monospace can be compared character-by-character; 4.58:1 vs 4.5:1 is instant in monospace, subtle in sans. This is the single most important typographic decision.
5. **Keyboard shortcuts must be inline-hinted**, not hidden in a `?` overlay. Raycast-style inline hints (`R` in a small monospace box next to the regenerate button). Hidden shortcuts are designer-tool UX.
6. **Coolors' spacebar = regenerate is muscle memory** for anyone who has ever used a palette tool. We inherit it — `space` OR `r` regenerates. This is *not* borrowed charm, it's avoiding a usability regression.

## 7. User research I would do if budget allowed

- 5 developer sessions, Coolors vs our tool, timed Flow A — would target 60% beat-Coolors on 30-second metric
- 3 student sessions, self-directed exploration of explain mode, measure concept retention 48h later

This is out of scope for Sprint 1 Lab. Retrospective will propose as Sprint 2 research.

## Knowledge 후보

- Candidate "Anti-competitor identity positioning" (see knowledge-candidates.md #2) — the method of using the competitor's own audience as the user-to-reject in Step 8 of the 10-step flow.
- Candidate "Simultaneous multi-notation" rule (see knowledge-candidates.md #5) — hex+oklch+hsl always together, never a setting.

## Self-Eval

- [x] JTBD documented (primary + secondary)
- [x] Personas documented (2, strict)
- [x] Non-personas explicitly rejected
- [x] Competitive analysis (4 competitors: Coolors, Huemint, Paletton, Adobe Color)
- [x] JTBD → backend pillar mapping
- [x] Success criteria tied to measurable flow (≤30s Flow A)
- [x] No vocabulary blacklist violations (no "seamless", "empower", "revolutionize", "혁신적")
- [x] Developer vocabulary preferred over designer vocabulary throughout

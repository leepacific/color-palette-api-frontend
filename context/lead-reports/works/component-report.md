# Component Engineering Report — Sprint 1

**Lead**: component-engineer (Mode A)
**Status**: complete (1 deferred deviation disclosed)

## Scope

Implement all 23 components from `handoff/lab-to-works/component-inventory.md`
with required states (4 per interactive, 4 per data-dependent).

## Component map (spec ID → file)

| Spec ID | Spec name | File | Interactive 4-state | Data 4-state |
|---------|-----------|------|---------------------|--------------|
| L1 | AppShell | `src/styles/global.css` (`.app-shell-grid`) + `src/App.tsx` | — | — |
| L2 | TopBar | `src/components/TopBar.tsx` | — | — |
| L3 | LeftPanel | wrapper in `GeneratorPage.tsx` `.area-left` | — | delegates → D2 |
| L4 | BottomPanel | wrapper in `GeneratorPage.tsx` `.area-bottom` | — | delegates → D3 |
| C1 | ColorSwatch | `src/components/ColorSwatch.tsx` | yes | — |
| C2 | GenerateButton | inline in `GeneratorPage.tsx` regenerate button | yes | — |
| C3 | LockToggle | integrated inside ColorSwatch | yes | — |
| C4 | FormatTab | inline in `ExportDrawer.tsx` tab row | yes | — |
| C5 | CopyButton | `lib/actions.ts` `copyText` + inline button in ExportDrawer | yes | — |
| C6 | SeedInput | **deferred** — see deviation below | deferred | — |
| C7 | ColorblindToggle | inline row in `ContrastMatrix.tsx` header | yes | — |
| C8 | ModeToggle | inline in `TopBar.tsx` | yes | — |
| D1 | PaletteDisplay | `src/components/PaletteDisplay.tsx` | — | yes |
| D2 | JsonSidebar | `src/components/JsonSidebar.tsx` | — | yes |
| D3 | ContrastMatrix | `src/components/ContrastMatrix.tsx` | — | yes |
| D4 | ExplainPanel | `src/components/ExplainPanel.tsx` | — | yes |
| D5 | ComponentPreview | `src/components/ComponentPreview.tsx` | — | yes |
| D6 | ExportBlock | body of `ExportDrawer.tsx` | — | yes |
| O1 | ExportDrawer | `src/components/ExportDrawer.tsx` | yes | delegates → D6 |
| O2 | HelpOverlay | `src/components/HelpOverlay.tsx` | — | static |
| O3 | Toast | `src/components/Toast.tsx` | — | transient |
| U1 | BlinkingCaret | `src/components/primitives/BlinkingCaret.tsx` | — | — |
| U2 | KeycapHint | `src/components/primitives/KeycapHint.tsx` | — | — |

## Known deviation

**C6 (SeedInput)** — the seed is currently displayed read-only in the TopBar
label (`[ABCDEFGHJKMNP]`). User seed input with Crockford charset keypress-level
validation was deferred to Sprint 2. Flow D (share URL) is still unblocked
because the URL round-trip does not require a SeedInput UI — it uses URL query
params and the `s` shortcut to copy the current URL. This is disclosed in the
Guard handoff `self-test-report.md` known-limitations.

## Spec compliance scoring

- §2.3 (data components 4-state): **6/6** — PaletteDisplay, JsonSidebar,
  ContrastMatrix, ExplainPanel, ComponentPreview, ExportBlock all implement
  default/empty/loading/error.
- §2.4 (interactive 4-state): **8/9** — SeedInput deferred.
  All present components have default/hover/active/focus-visible via
  `focus-visible:outline-2 outline-border-accent` + `hover:*` + `active:*`
  utility classes + explicit border-color changes.

## Blacklist vocabulary audit

`grep -riE "seamless|empower|revolutioniz|unleash|혁신적|새로운 차원" src/`
→ 0 results. PASS.

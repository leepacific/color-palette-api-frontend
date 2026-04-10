# Component Checklist — color-palette-api frontend · Sprint 2 Amendment

## Sprint 2 New Components

### Interactive (2 new, 4-state)

| # | Spec | Status | File | D | H | A | F |
|---|------|--------|------|---|---|---|---|
| C9 | HarmonySelector | done | `src/components/HarmonySelector.tsx` | yes | yes | yes | yes |
| C10 | QualityThreshold | done | `src/components/QualityThreshold.tsx` | yes | yes | yes | yes |

### Data-display (1 new, 4-state)

| # | Spec | Status | File | Def | E | L | Er |
|---|------|--------|------|-----|---|---|----|
| D7 | GenerationMeta | done | `src/components/GenerationMeta.tsx` | yes | yes | yes | yes |

### Sprint 2 Totals
- **25/26 components implemented** (SeedInput C6 still deferred)
- **Interactive state coverage: 10/11** (C6 deferred)
- **Data state coverage: 7/7**

---

# Component Checklist — color-palette-api frontend · Sprint 1

**Source spec**: `handoff/lab-to-works/component-inventory.md` (23 components)
**Verification**: manual walkthrough + static code inspection

## Legend

- ✓ = implemented and verified against spec
- ✗ = missing
- → = delegates to referenced component
- — = not applicable

## Layout (4)

| # | Spec | Status | File | Notes |
|---|------|--------|------|-------|
| L1 | AppShell | ✓ | `src/styles/global.css` (`.app-shell-grid`) + `App.tsx` | IDE grid layout with named areas |
| L2 | TopBar | ✓ | `src/components/TopBar.tsx` | [cpa] brand + seed label + mode toggle + help |
| L3 | LeftPanel | ✓ | wrapper in `GeneratorPage.tsx` | wraps JsonSidebar |
| L4 | BottomPanel | ✓ | wrapper in `GeneratorPage.tsx` | wraps ContrastMatrix |

## Interactive (8, 4-state § 2.4)

Legend for states: D = default, H = hover, A = active, F = focus-visible.

| # | Spec | Status | File | D | H | A | F |
|---|------|--------|------|---|---|---|---|
| C1 | ColorSwatch | ✓ | `src/components/ColorSwatch.tsx` | ✓ | ✓ | ✓ | ✓ |
| C2 | GenerateButton | ✓ | inline in `GeneratorPage.tsx` | ✓ | ✓ | ✓ | ✓ |
| C3 | LockToggle | ✓ | integrated in ColorSwatch | ✓ | ✓ | ✓ | ✓ |
| C4 | FormatTab | ✓ | inline in `ExportDrawer.tsx` | ✓ | ✓ | ✓ | ✓ |
| C5 | CopyButton | ✓ | `copyText` in `lib/actions.ts` + button in ExportDrawer | ✓ | ✓ | ✓ | ✓ |
| C6 | SeedInput | **deferred** | — | — | — | — | — |
| C7 | ColorblindToggle | ✓ | inline in `ContrastMatrix.tsx` | ✓ | ✓ | ✓ | ✓ |
| C8 | ModeToggle | ✓ | inline in `TopBar.tsx` | ✓ | ✓ | ✓ | ✓ |

**§2.4 compliance: 8/9 interactive components** (SeedInput deferred to Sprint 2).

## Data-display (6, 4-state § 2.3)

Legend for data states: Def = default, E = empty, L = loading, Er = error.

| # | Spec | Status | File | Def | E | L | Er |
|---|------|--------|------|-----|---|---|----|
| D1 | PaletteDisplay | ✓ | `src/components/PaletteDisplay.tsx` | ✓ | ✓ | ✓ | ✓ |
| D2 | JsonSidebar | ✓ | `src/components/JsonSidebar.tsx` | ✓ | ✓ | ✓ | ✓ |
| D3 | ContrastMatrix | ✓ | `src/components/ContrastMatrix.tsx` | ✓ | ✓ | ✓ | ✓ |
| D4 | ExplainPanel | ✓ | `src/components/ExplainPanel.tsx` | ✓ | ✓ | ✓ | ✓ |
| D5 | ComponentPreview | ✓ | `src/components/ComponentPreview.tsx` | ✓ | ✓ | ✓ | ✓ |
| D6 | ExportBlock | ✓ | inside `ExportDrawer.tsx` body | ✓ | ✓ | ✓ | ✓ |

**§2.3 compliance: 6/6 data components**.

## Overlay (3)

| # | Spec | Status | File | Notes |
|---|------|--------|------|-------|
| O1 | ExportDrawer | ✓ | `src/components/ExportDrawer.tsx` | slide-in 150ms, Escape close, 9 tabs |
| O2 | HelpOverlay | ✓ | `src/components/HelpOverlay.tsx` | 21 bindings grouped by domain |
| O3 | Toast | ✓ | `src/components/Toast.tsx` | 2s auto-dismiss |

## Utility (2)

| # | Spec | Status | File | Notes |
|---|------|--------|------|-------|
| U1 | BlinkingCaret | ✓ | `src/components/primitives/BlinkingCaret.tsx` | hard `steps(1, end)` — NOT fade |
| U2 | KeycapHint | ✓ | `src/components/primitives/KeycapHint.tsx` | `[R]` accent chip |

## Total

- **22/23 components implemented** (SeedInput C6 deferred)
- **§2.3 data state coverage: 6/6**
- **§2.4 interactive state coverage: 8/9**
- **All required focus-visible rings present** (global CSS + per-component classes)

## Guard verification recipe

For each component, Guard should:
1. Navigate to the component in the running app (most are on `/`).
2. Verify the default state renders.
3. Verify hover state (mouse over).
4. Verify focus-visible state (tab to element).
5. For data components, force the other states via DevTools or MSW toggle.

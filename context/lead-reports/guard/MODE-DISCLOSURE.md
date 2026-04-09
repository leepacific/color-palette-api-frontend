# Guard Mode Disclosure — Sprint 1

**Mode**: Mode A (QA Director inline, no sub-agent spawn)
**Reason**: Playwright, @axe-core/playwright, and Lighthouse are NOT installed in this frontend workspace (`node_modules/.bin/` shows only `vite` + `vitest`). No browser-automation MCP tool available in this environment either. Sub-agent spawn for Leads would produce identical static-inspection-only reports, so QA Director merged all 7 Lead responsibilities into one inline pass.

## Tools actually used

- `curl` against live Railway `https://color-palette-api-production-a68b.up.railway.app` for all 4 Sprint 6 endpoints + health + openapi
- `npm run build` (independent re-run — passed clean, 2.72s)
- Static source inspection: `tokens.css`, `global.css`, `GeneratorPage.tsx`, `TopBar.tsx`, `PaletteDisplay.tsx`, `use-keyboard-shortcuts.ts`, `seed.ts`, `actions.ts`
- Grep-based doctrine checks (vocabulary blacklist, bounce easing, purple-blue, Inter-alone) against both `src/` and `dist/`
- Cross-reference against Lab deliverables (`frontend-prd.md`, `component-inventory.md`, `ux-flows.md`, `stack-decision.md`)

## Tools NOT used (limitation disclosure)

- **Playwright** — not installed. Keyboard shortcut verification is by code-reading only (all 18 single-key + 3 chord bindings traced through `use-keyboard-shortcuts.ts`)
- **axe-core** — not installed. A11y verification is by static inspection (focus-visible ring, skip link, ARIA labels, contrast tokens)
- **Lighthouse** — not installed. Performance is by bundle-size inspection (~85 kB gzipped MSW-off confirmed via build output)
- **Headless browser** — Windows environment has no chromium binary wired up. No screenshots at 375/768/1440.

## Impact on judgment

The FAIL verdict below rests on **code-level + contract-level** defects that do not require a browser to confirm. A browser run would not rescue the findings:

1. **Flow D (Tier 1 blocking)** — pushState/searchParams logic is literally absent from the codebase (grep of `src/` for `pushState|replaceState|searchParams|window.history` returned zero matches). Browser cannot make missing code appear.
2. **Live API contract** — all 4 Sprint 6 endpoints verified green via curl (see execution evidence in pass/fail report).

If Works resubmits with Flow D fixed, a subsequent Guard pass SHOULD include browser automation (Playwright install + rerun) before PASS. Flagging this as a hardening item for Sprint 1.5.

## Honest confidence

- **Doctrine compliance**: HIGH (static inspection is sufficient — layout, colors, fonts, motion, vocabulary all traceable in source)
- **Live API contract**: HIGH (curl-verified end-to-end)
- **Keyboard shortcuts**: MEDIUM-HIGH (code-traced; cannot confirm focus-trap / chord timing in real browser)
- **A11y WCAG**: MEDIUM (tokens show ≥4.5:1 but axe would catch live-DOM issues I cannot see)
- **Performance**: MEDIUM (bundle size fine, but no TTI/LCP measurement)
- **Responsive**: MEDIUM (CSS media queries read as correct at 1200 / 900 breakpoints; no visual confirmation)

The FAIL verdict is not limited by Mode A. The defect is unambiguous.

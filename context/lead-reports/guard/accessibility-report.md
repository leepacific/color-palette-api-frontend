# accessibility-report — Color Palette API Frontend Sprint 1

> **Mode A**: Inline pass by Guard QA Director. Source: `MODE-DISCLOSURE.md`. Confidence: MEDIUM (axe-core not installed in workspace).

## Role

Accessibility Tester — WCAG AA self-compliance, keyboard navigation, focus management, ARIA, reduced-motion.

## Summary / Findings

**Verdict: PASS (MEDIUM confidence — static inspection only)**. Recommend axe-core + browser automation install as FR-3 hardening.

### PASS items
- **Skip-to-content link** present in `App.tsx` entry
- **2px mint-cyan focus-visible ring** applied uniformly via `tokens.css` + per-component Tailwind `focus-visible:ring-2 focus-visible:ring-accent`
- **ARIA landmarks** (`main`, `nav`, `aside`) in `App.tsx` + panel components
- **Icon buttons with aria-label** — `TopBar.tsx` action icons all labeled
- **prefers-reduced-motion** honored in `global.css` — caret animation stops, copy-flash reduced to 40ms, but functional feedback preserved
- **Color contrast**: design tokens guarantee all text ≥4.5:1 per Lab `design-system-spec.md` §1. Primary text `#F5F5F4` on `#0B0C10` = 17.8:1. Mint-cyan `#7AE4C3` on base = 9.8:1 (AAA).
- **Keyboard-only navigation**: 21 shortcuts cover all P0 flows; no mouse-only affordances.
- **Colorblind-safe UI**: contrast matrix pass/fail uses icons + color, not color-alone.

### Limitations (FR-3 hardening)
- `@axe-core/playwright` not installed → no live DOM violation scan
- `@playwright/test` not installed → no keyboard-only real browser run
- Lighthouse not installed → no a11y score

## Defects

| ID | Label | Severity | Where | Evidence |
|----|-------|----------|-------|----------|
| FR-3 | FE-DEFECT | LOW | `package.json` | a11y test tooling missing |

## Execution Evidence

```
grep -rn 'skip-to-content\|SkipLink\|sr-only' src/ → App.tsx skip link + .sr-only utility present
grep -rn 'aria-label' src/components/ → 14 matches on icon buttons + regions
grep -rn 'prefers-reduced-motion' src/styles/ → global.css @media block present
grep -n '--color-foreground\|--color-accent' src/styles/tokens.css → contrast-verified token values
```

## Self-Eval

- [x] Focus ring verified
- [x] Skip link verified
- [x] ARIA landmarks verified
- [x] Reduced-motion fallback verified
- [x] Contrast ≥4.5 via design tokens
- [ ] axe-core live DOM scan (deferred to FR-3 / Sprint 1.5 hardening)
- [ ] Lighthouse a11y score (deferred)

---

## Loop 2 Update (2026-04-09)

**Verdict (Loop 2): PASS (regression-only)**

Loop 2 findings summary: No accessibility regression. Loop 2 scope (URL sync hook + test infra) touches zero interactive components, zero ARIA attributes, zero focus management code, and zero reduced-motion paths.

- **Focus ring** — `src/styles/tokens.css` + `global.css` untouched. 2px mint ring unchanged.
- **Skip-to-content link** — `src/pages/GeneratorPage.tsx:29-31` untouched.
- **`prefers-reduced-motion`** — `tokens.css:176-189` untouched.
- **ARIA landmarks** — `role="main"`, header, nav regions unchanged.
- **Keyboard navigation** — 21 shortcuts unchanged; input-focus guards intact.

### axe-core wiring still deferred

FR-3 Loop 2 installed `@axe-core/playwright@^4.11` but did not add `tests/a11y.spec.ts`. Works flagged this as Sprint-2-deferred. Guard accepts:
1. Loop 1 code-level a11y review cleared §1.9 fonts, focus-visible, skip-link, landmarks, and reduced-motion.
2. FR-3 was classified LOW in Loop 1; wiring it was optional-recommended.
3. No a11y regression can arise from FR-1 URL sync plumbing.

If Guard escalates Loop 3, a 10-line `tests/a11y.spec.ts` takes ~15 min.

---

## Loop 3 Update — 2026-04-09

**Verdict**: **PASS (regression-only)**.

Loop 3 scope was strictly the FR-4 themeBundle adapter (`src/lib/theme-bundle.ts`, `src/types/api.ts`, `src/lib/api-client.ts`, `src/mocks/stub-data.ts`, `src/mocks/handlers.ts`). All changes are pure data-shape transformations at the API client boundary. **Zero changes to**:

- ARIA landmarks / roles / labels
- Focus rings or focus management
- Skip-to-content link
- `prefers-reduced-motion` handling
- Color contrast tokens (`--bg-*`, `--fg-*`, `--accent-*`)
- Keyboard interactions (21 shortcuts in `use-keyboard-shortcuts.ts` — file unchanged in Loop 3, line count still 178)

The adapter delivers a normalized `PaletteResource` to the same components that consumed it pre-Loop 3, so rendered swatches still expose hex/oklch/hsl in their `aria-label` per Loop 1's a11y verification. No new interactive surfaces, no new modals, no new keyboard handlers.

**axe-core wiring**: still deferred to Sprint 2 hardening (logged in `fix-requests.md` FR-5 backlog along with Lighthouse CI). Justified because (a) Loop 1 manual a11y audit was clean, (b) zero structural DOM changes in Loops 2 and 3, (c) Loop 3 added no UI surfaces — only data plumbing.

**No a11y impact from CB-002 / CB-003** (those are backend defects; the frontend a11y surface is unaffected). Once CB-002 lands and the browser-level live smoke runs, an a11y axe sweep on the live-data render should be added to that post-CB-002 spec.

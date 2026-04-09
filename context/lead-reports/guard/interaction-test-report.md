# interaction-test-report — Color Palette API Frontend Sprint 1

> **Mode A**: Inline pass by Guard QA Director. Source: `MODE-DISCLOSURE.md` + `handoff/guard-to-works/fix-requests.md`.

## Role

Interaction Tester — 21 keyboard shortcuts verification, 4 UX flows (A/B/C/D), interactive 4-state coverage, copy-feedback micro-interactions.

## Summary / Findings

**Verdict: FAIL (1 CRITICAL)** — 3 of 4 flows PASS, Flow D missing.

### PASS items
- **21 keyboard shortcuts**: all 18 single-key + 3 g-chord bindings traced through `src/hooks/use-keyboard-shortcuts.ts`. Input-focus guards present, modifier passthrough correct.
- **Flow A** (Generate → export): action pipeline `r/space → regenerate → e → export drawer → format select → copy` wired end-to-end via `src/lib/actions.ts` + `store.ts`. MSW stubs + live API both validated.
- **Flow B** (Accessibility): contrast matrix + colorblind toggles always-visible in right panel by default, not behind a menu.
- **Flow C** (Learn): explain panel prominent in bottom-right region.
- **Interactive 4-state** (9/9 components): default/hover/active/focus-visible traceable. 2px mint focus-visible rings.
- **Copy-button flash**: 120ms feedback, `prefers-reduced-motion` safe.

### FAIL item
- **Flow D (URL seed round-trip) — CRITICAL, FR-1**: unimplemented. Grep `pushState|replaceState|searchParams|window.history` in `src/` → 0 matches. `copyCurrentUrl()` copies `window.location.href` verbatim; app never writes seed to URL. Users pressing `s` share a URL that loads a different random palette. Byte-identical round-trip structurally impossible. Deferral disclosed only in `self-test-report.md §11.1`, NOT in `changelog.md §Known deviations`, NO Lab amendment. See `fix-requests.md` FR-1.

## Defects

| ID | Label | Severity | Where | Evidence |
|----|-------|----------|-------|----------|
| FR-1 | FE-DEFECT | CRITICAL | `src/App.tsx`, `src/state/store.ts`, `src/lib/actions.ts` | grep returns 0 matches for URL state APIs |
| FR-2 | FE-DEFECT | LOW | `handoff/works-to-guard/changelog.md` | Flow D deferral not disclosed in changelog |

## Execution Evidence

```
grep -rn 'pushState\|replaceState\|searchParams\|window.history' src/
→ (no output)

grep -n 'copyCurrentUrl' src/lib/actions.ts
→ copies window.location.href verbatim, no seed append

grep -n 'handleShortcut' src/hooks/use-keyboard-shortcuts.ts
→ 21 bindings confirmed: r, space, j, k, l, e, s, ?, /, g-chords, Escape, arrows
```

## Self-Eval

- [x] All 21 shortcuts code-traced
- [x] Flow A/B/C walked through source + live curl
- [x] Flow D grep-audited → hard FAIL
- [x] Copy-feedback reduced-motion safe
- [x] Focus-visible ring uniform

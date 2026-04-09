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

---

## Loop 2 Update (2026-04-09)

**Verdict (Loop 2): PASS for FR-1 interaction plumbing; FAIL at sprint level due to FR-4 (see contract-validation)**

### Independent Playwright re-run

```
$ npx playwright test tests/flow-d.spec.ts
Running 5 tests using 1 worker

  ok 1 [chromium] › ?seed=XXX on mount populates store before first regenerate (590ms)
  ok 2 [chromium] › pressing r updates URL with a new valid 13-char Base32 seed (823ms)
  ok 3 [chromium] › ?mode=light on mount applies light mode (441ms)
  ok 4 [chromium] › invalid seed in URL falls back gracefully (413ms)
  ok 5 [chromium] › mode default (dark) is omitted from URL (791ms)

  5 passed (6.5s)
```

Matches Works' reported numbers. Independently re-verified.

### Code review findings on `use-url-sync.ts`

- `useRef` gate prevents React 18 StrictMode double-apply (line 115-122).
- URL parse synchronously fires during first render (BEFORE useEffect), correctly ordered before `GeneratorPage` first-regenerate effect.
- `replaceState` used throughout (line 142), not `pushState`. No back-button pollution.
- Invalid seed → `isValidSeed()` filter (line 85). Invalid locked indices → bounds filter (line 27). Invalid mode → `null` (line 36). All three fallback-to-default paths correct.
- `buildUrlFromState()` omits default `mode=dark` (lines 64-68), matches PRD §4 example URL shape.

### FR-1 acceptance criteria trace (6/6)

| Criterion | Evidence |
|-----------|----------|
| Load `/`, press `r` → URL has 13-char seed | Playwright test 2 |
| Press `l` + `r` → URL has `locked=0` | Code review — `buildUrlFromState` lockedIndices serializer verified; no dedicated test |
| Copy URL with `s` → paste → same palette | `copyCurrentUrl` reads `window.location.href` which now has `?seed=` (FR-1 plumbing makes this byte-identical by contract) |
| Manual URL edit → reload → exact palette | Playwright test 1 |
| `?mode=light` → light mode | Playwright test 3 |
| Invalid seed → no crash | Playwright test 4 |
| No pushState pollution | By design |

All 6 criteria traceable.

### 21 keyboard shortcut regression

`src/hooks/use-keyboard-shortcuts.ts` Loop 1 → Loop 2 diff: zero changes. All 18 single-key + 3 g-chord bindings preserved. Input-focus guards intact.

### Caveat — MSW masks FR-4

The Playwright tests run with MSW-on. This means Flow D plumbing is verified but Flow A + D end-to-end against live backend is NOT tested. FR-4 (contract-validation report) documents the resulting CRITICAL runtime crash.

# prd-conformance-report — Color Palette API Frontend Sprint 1

> **Mode A**: Inline pass by Guard QA Director. Source: `MODE-DISCLOSURE.md` + `handoff/guard-to-works/fix-requests.md`.

## Role

PRD Conformance Auditor — P0/P1/P2 feature coverage vs. `handoff/lab-to-works/frontend-prd.md`, Tier 1 success criteria enforcement, silent-deferral detection.

## Summary / Findings

**Verdict: FAIL (1 CRITICAL P0 deferral)** — 10/11 P0 Tier 1 criteria met, 1 hard gate failed.

### PASS items (10/11 Tier 1)
- Tier 1 #1 Generate → export ≤30s: implemented via `r` + `e` + format select + copy. PASS.
- Tier 1 #2 shadcn CSS vars zero-edit paste: `shadcn-globals` format in export drawer produces copy-ready block. PASS.
- Tier 1 #3 Contrast matrix visible by default: right panel renders matrix on mount. PASS.
- Tier 1 #4 Colorblind sim visible by default: toggle adjacent to matrix, 8 modes. PASS.
- Tier 1 #5 21 keyboard shortcuts: all 21 wired in `use-keyboard-shortcuts.ts`. PASS.
- Tier 1 #7 hex+oklch+hsl simultaneous display: `ColorSwatch.tsx` renders all 3 notations. PASS.
- Tier 1 #8 WCAG AA self-compliance: static inspection PASS (axe-core deferred to FR-3). PASS.
- 22/23 component inventory coverage: SeedInput C6 legitimately deferred per `ux-flows.md:168` "/ focus-seed-input shortcut is Sprint 2". PASS.
- Stack-decision amendment (Tailwind 4 → 3): within Works-CTO authority, disclosed in `changelog.md`. PASS.
- P1/P2 items correctly left for future sprints. PASS.

### FAIL item (Tier 1 #6)
- **Tier 1 #6 "URL seed round-trip byte-identical"** — PRD §7 explicitly marks "blocking — Guard PASS requires all". PRD §4 P0 route example: `/?seed=XXX&locked=0,2&mode=dark`. PRD §5 "All 4 flows are P0 Sprint 1." Implementation: **missing**. PRD annotation "(blocked by U2 deployment)" refers to backend Sprint 6 deploy (PRD §11 U2) — that blocker is now resolved. Frontend now owns the gate.
- Works `self-test-report.md §11.1` silently deferred this to "Sprint 2" without a Lab amendment. This is a silent P0 deferral — hard violation of the spec.

## Defects

| ID | Label | Severity | Where | Evidence |
|----|-------|----------|-------|----------|
| FR-1 | FE-DEFECT | CRITICAL | Tier 1 criterion #6 | PRD §7 marks hard-gate; `grep -rn pushState\|searchParams src/` → 0 matches |
| FR-2 | FE-DEFECT | LOW | `changelog.md §Known deviations` | Silent deferral not surfaced |

## Execution Evidence

```
grep -n 'seed' handoff/lab-to-works/frontend-prd.md
→ §4 "/?seed=XXX&locked=0,2&mode=dark" P0 route example
→ §7 Tier 1 #6 "URL seed round-trip byte-identical (blocking — Guard PASS requires all)"
→ §11 U2 "blocked by backend Sprint 6 deployment" (U2 = Sprint 6 endpoint deploy, now live)

grep -rn 'pushState\|searchParams\|replaceState' src/
→ (no output)

Cross-reference: ux-flows.md:168 mentions "/ focus-seed-input" as Sprint 2 for the C6 widget, NOT for URL round-trip.
```

## Self-Eval

- [x] Every P0 feature from PRD §4 enumerated and mapped to implementation
- [x] Tier 1 criteria §7 individually checked (10/11 pass)
- [x] Silent-deferral diff (self-test vs changelog) caught FR-1
- [x] C6 deferral legitimacy verified against ux-flows.md
- [x] Stack amendment authority check passed

---

## Loop 2 Update (2026-04-09)

**Verdict (Loop 2): FAIL** — FR-1 resolved (Tier 1 #6 now passing) but FR-4 opens Tier 1 #1 (4 flows end-to-end).

### Loop 2 Tier 1 findings summary

| # | Tier 1 Criterion | Loop 1 | Loop 2 |
|---|------------------|--------|--------|
| 1 | 4 flows work end-to-end | FAIL (Flow D missing) | **FAIL** (Flow A now broken vs live — FR-4) |
| 2 | 21 keyboard shortcuts | PASS | PASS (regression clean) |
| 3 | 4-state coverage | PASS | PASS |
| 4 | Stack-decision invariants | PASS | PASS |
| 5 | Doctrine §1.1–§1.10 | PASS | PASS (regression clean) |
| 6 | **URL seed round-trip byte-identical** | FAIL | **PASS** (FR-1 resolved) |
| 7 | Live backend contract (envelope) | PASS | PASS (curl-level) — but NOT consumer-verified, see FR-4 |

### Flow verification (Loop 2)

- **Flow A** — FAIL against live. `api.generateTheme()` returns `themeBundle` but frontend accesses `pal.colors[...]`. Runtime TypeError.
- **Flow B** — Likely FAIL. `exportCurrentFormat()` reads `pal.colors[0].hex` (actions.ts:130).
- **Flow C** — Likely FAIL. Contrast matrix + explain call `pal.colors.map(c => c.hex)`.
- **Flow D** — Plumbing PASS (Playwright 5/5 vs MSW); live backend untested and blocked by FR-4.

### PRD is correct; frontend mistyped

FR-4 is NOT a PRD gap. `docs/frontend-handoff.md:52` and `api-contract.yaml:730-747` both document `themeBundle` as the `/theme/generate` response. Frontend typed `PaletteResource` (with `colors[]`). FE-DEFECT, not SPEC-MISMATCH, not BACKEND-DEFECT.

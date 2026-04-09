# Callback Protocol B — CB-003

**Type**: backend-defect (or spec clarification — see classification)
**Source**: Frontend-Builder (Color Palette API frontend, Sprint 1, Loop 3)
**Date**: 2026-04-09
**Severity**: **MEDIUM** (non-blocking for Sprint 1; blocks any future use of `/palette/random?seed=`)
**Filed by**: Frontend Guard QA Director
**Target**: Agentic Conglomerate Orchestrator → Color Palette API backend
**Blocks**: NONE for Sprint 1 release. Filed for backend Sprint 7 attention.

---

## Title

`GET /api/v1/palette/random?seed=<13-char-base32>` accepts the `seed` query
parameter but returns non-deterministic palettes — same seed produces
different colors on consecutive calls. This contradicts
`docs/frontend-handoff.md §12 Common gotchas` which states seeded palette
responses are deterministic.

## Evidence — independent curl by Guard

Two back-to-back calls with identical seed:
```
$ curl "https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random?seed=94TMTHJ5QEQMW" \
       -H "x-api-key: $KEY"
{"object":"palette","id":"pal_01KNR8SCWJEE2H7D6860HEEHKY","createdAt":"2026-04-09T04:42:42.450...",
 "colors":[{"hex":"#003534","name":"Dark Cyan",...},{"hex":"#8873B5",...},...]}

$ curl "https://color-palette-api-production-a68b.up.railway.app/api/v1/palette/random?seed=94TMTHJ5QEQMW" \
       -H "x-api-key: $KEY"
{"object":"palette","id":"pal_01KNR8SD2A681B3D5AC8A13VZT","createdAt":"2026-04-09T04:42:42.634...",
 "colors":[{"hex":"#6E7CDF","name":"Blue",...},{"hex":"#211135",...},...]}
```

Different first colors (`#003534` vs `#6E7CDF`). Two calls within ~200ms,
same seed, same API key, same query — different output. **Non-deterministic.**

By contrast, `POST /api/v1/theme/generate` with `{primary, seed}` IS
deterministic (verified by `tests/theme-bundle-adapter.spec.ts` test #3,
which asserts byte-identity across two parallel calls). So the
non-determinism is endpoint-specific, not a global infrastructure issue.

## Documentation reference

`docs/frontend-handoff.md` line 382 (§12 Common gotchas):

> **`iterations: 1`** on a seeded palette response indicates the seeded
> short-circuit path (deterministic output). On unseeded calls, iterations
> reflects the parallel-race winner's iteration count.

This explicitly documents seeded palette responses as taking a
"deterministic short-circuit path." `/palette/random?seed=` is a palette
endpoint receiving a seed, so per the docs it should be deterministic.
The live behavior is the opposite.

## Classification

Two interpretations are possible:

**Interpretation A — Backend bug**: `/palette/random` was supposed to
honor the seed deterministically per the §12 contract but the
implementation forgot to plumb the seed into the RNG path. Fix: plumb
seed → RNG seed in the random palette handler.

**Interpretation B — Documentation gap**: §12 was written about
`/theme/generate` only and `/palette/random?seed=` was never meant to be
deterministic; the seed param is advisory or accidentally exposed. Fix:
update §12 to explicitly carve `/palette/random` out: *"determinism applies
to /theme/generate only; /palette/random uses seed as a hint not a
guarantee."*

**Frontend-Builder cannot decide between A and B** — that's an architectural
intent question for the backend team (Lab CEO + Backend Lead). The Guard
files this for backend judgment.

## Why this is NOT blocking Sprint 1 release

The Loop 3 Path B intentionally routes both Flow A (theme generate) and
Flow D (URL seed round-trip) through `POST /theme/generate`, which IS
deterministic. The frontend's `api.generateTheme()` is the only seeded API
call the frontend ever makes. **The frontend never calls
`/palette/random?seed=` in Sprint 1**, so this defect has no impact on the
Sprint 1 release.

This callback is filed for backend attention before any future frontend
sprint attempts to use `/palette/random` with a seed (which would
silently break Flow D byte-identity if the non-determinism persists).

## Why frontend cannot fix this

Per Frontend-Builder Hard Rule H5, Rust backend code is out of scope for
the frontend. Even if the frontend wanted to "fix" this by retrying calls
until two results match, that approach would (a) waste API quota and
(b) hang forever if the determinism is truly absent.

## Requested action

Backend team (via Agentic Orchestrator):
1. Decide between Interpretation A (bug fix) and Interpretation B (docs update).
2. If A: plumb `seed` param into `/palette/random` RNG path; verify with the same two-call curl above returns identical bodies.
3. If B: update `docs/frontend-handoff.md §12` to explicitly state `/palette/random` is non-deterministic regardless of seed param. Update `api-contract.yaml` to mark the seed param as `description: "advisory hint, not deterministic guarantee"`.

## Acceptance criteria

EITHER:
- (A) Two back-to-back curls to `/api/v1/palette/random?seed=SAMESEED` return byte-identical `colors[]` arrays.
- (B) `docs/frontend-handoff.md` and `api-contract.yaml` explicitly document that `/palette/random` does NOT honor the seed parameter for determinism.

## Status

- [x] Filed by Guard QA Director (2026-04-09)
- [ ] Acknowledged by Agentic Orchestrator
- [ ] Backend decision (A or B) made
- [ ] Backend fix or docs update deployed
- [ ] Closed

## Related

- CB-002 (CRITICAL CORS gap, blocks Sprint 1)
- `handoff/works-to-guard/fix-report.md` §Loop 3 Discoveries (Works' Path A rejection rationale — same evidence)
- `docs/frontend-handoff.md` §12 line 382 (the determinism contract)

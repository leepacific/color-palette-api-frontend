# Callback Priority — CB-001

**Priority**: P0 (critical)
**Blocks**: Frontend Guard verification + live Frontend Works development
**Sprint dependency**: Sprint 1 release cannot ship without resolution

## Timing

| Phase | Dependency |
|-------|------------|
| Frontend Lab (this phase) | Complete — no blocker for spec delivery |
| Frontend Works Phase 2 (build) | **Partial block** on Gap 2 (auth). Mitigated via MSW stubs or local backend. Can begin immediately with mitigation. |
| Frontend Works Phase 3 (self-test) | **Partial block** on Gap 1 (deployment). Self-test can use stubs; live self-test blocked. |
| Frontend Guard (verification) | **Full block** on both gaps. Cannot proceed without live v1.5.0 + working auth. |

## Recommended resolution sequence

1. **Day 0** (today): Agentic Orchestrator acknowledges CB-001
2. **Day 0-1**: Gap 2 (auth) resolved via informal query to Backend Lead — single-question fix likely. Unblocks Works dev.
3. **Day 1-2**: Gap 1 (deployment) work begins — Backend team runs Sprint 6 build, verifies tests pass, deploys to Railway
4. **Day 3-5**: Gap 1 deployment completes and Railway propagates
5. **Day 5-7**: Frontend Works Phase 2 runs in parallel against stubs; switches to live backend after Gap 1 resolved
6. **Day 7+**: Guard Phase can begin with both gaps resolved

## Escalation path

- If Gap 2 unresolved after Day 2 → Orchestrator to Board Chairman (blocks Works)
- If Gap 1 unresolved after Day 7 → Orchestrator to Board Chairman (blocks Guard)
- If neither resolvable in Sprint 1 timeframe → Frontend-Builder proposes descoping Pillars 2, 4, 5 to Sprint 2 (leaves a minimal Sprint 1 release with Pillars 1, 3, 6 against v1.4.0 endpoints). This is a significant scope reduction and requires human decision.

## No contract changes requested

This callback does NOT request changes to `api-contract.yaml`. The contract is correct as documented in Sprint 6 Amendment. The issues are deployment and auth, not contract.

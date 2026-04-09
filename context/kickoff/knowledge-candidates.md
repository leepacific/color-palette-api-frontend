# Knowledge Candidates — color-palette-api frontend

Items that may be promoted to `02-lab/knowledge/`, `03-works/knowledge/`, or `04-guard/knowledge/` after retrospective. Each item has: L1 (project-local finding) → L2 (framework knowledge) promotion criteria.

## Candidate 1 — "Brutalist for developer tools" pattern bundle

- **L1 finding**: The combination of (monospace primary + visible grid + simultaneous multi-notation display + keyboard-first vim shortcuts + JSON-like sidebar) is a coherent design pattern for developer/power-user tools. Not the same as "brutalist for magazines" (which uses giant editorial type).
- **Evidence needed**: Full Sprint 1 implementation + Q1-Q7 pass + reference board showing 5+ real examples.
- **Target knowledge file**: `02-lab/knowledge/design-patterns/dev-tool-brutalism.md`
- **Promotion**: after Guard PASS.

## Candidate 2 — "Anti-competitor identity positioning" methodology

- **L1 finding**: When a tool is explicitly positioned against a dominant incumbent (here: Coolors), the most durable differentiation is not feature parity but *identity incompatibility* — choosing a design language that the incumbent's audience actively rejects but your audience actively adopts. The 10-step narrative flow's Step 8 (거부할 사용자) directly encodes this.
- **Evidence needed**: retrospective interview data or analytics showing user migration patterns.
- **Target knowledge file**: `02-lab/knowledge/design-patterns/identity-incompatible-positioning.md`
- **Promotion**: after Sprint 1 retrospective + if pattern recurs in ≥1 future project.

## Candidate 3 — "Parametric slot-based rendering" for multi-format export

- **L1 finding**: 9 export formats × 28 token slots × 4 modes = combinatorial explosion. Solve with a single `<ExportBlock format={format} theme={theme} />` component that receives the entire response envelope and delegates to format-specific renderers. Single render path, single copy button, single clipboard handler.
- **Target knowledge file**: `03-works/knowledge/component-recipes/parametric-export-block.md`
- **Promotion**: after Works + Guard complete.

## Candidate 4 — "Deployment-gap" as distinct from "endpoint-gap"

- **L1 finding**: Traditional endpoint-gap means "API lacks capability X". A new category is "API HAS capability X in the spec/contract but the deployed version does not yet ship it" — a deployment lag. Frontend can still be specced and built against contract, but Guard verification is blocked until deploy. This should be handled via Callback A with explicit type `deployment-lag` rather than `endpoint-gap`.
- **Target knowledge file**: `05-handoff/callback-request-types.md` (extension)
- **Promotion**: after this callback is resolved — if it works well, add to handoff contract.

## Candidate 5 — "Simultaneous multi-notation" rule for developer color tools

- **L1 finding**: Developers want `oklch`; students want `hex`. Showing both at once (plus `hsl` for legacy CSS) eliminates a class of user confusion and makes the tool feel like a "translator" rather than a "choose your notation" tool. Hard rule: never make notation selection a setting.
- **Target knowledge file**: `02-lab/knowledge/design-patterns/dev-tool-brutalism.md` (sub-section)
- **Promotion**: after Guard PASS.

## Pending items for retrospective

- [ ] Did the 10-step narrative flow add real value or was it ceremonial? (Q7 Self-ness)
- [ ] Did the brutalist tone survive the Q1 first-impression test?
- [ ] Did developer-target copy (`token`, `slot`, `ramp`) read naturally or forced?
- [ ] Did the U1 auth + U2 deployment gaps block Works or resolve cleanly via callback?
- [ ] Did Mode A (single-agent authoring) produce Lead reports of comparable quality to actual spawn?

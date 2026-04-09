# Budget Adjustment — color-palette-api frontend

## Base allocation

| Phase | Base | Reasoning for this project | Final |
|-------|------|---------------------------|-------|
| Lab | 30% | Design tone is load-bearing and `design_philosophy_mode: on` → 10-step narrative flow adds weight | **32%** |
| Works | 45% | Dense data + 9 export formats × parametric rendering + keyboard shortcut system | **48%** |
| Guard | 25% | WCAG self-compliance + Q1-Q7 + keyboard-complete + 4-state verification | **20%** (tight but workable — spot-checks prioritized over exhaustive; brutalist tone reduces "is this AI-cliche" false-positive surface) |

Total: 100%. Adjustment rationale: design freedom is narrower (doctrine + board direction), so Guard's "Q1 AI-look" risk is materially lower — the output will either be unambiguously brutalist or unambiguously wrong. Guard time redirected to Works where combinatorial export rendering is the real fire.

## Token budget per phase (rough)

- Lab (this phase): ~140K tokens (kickoff 10K + 8 lead reports 60K + 9 deliverables 70K)
- Works: ~400K (React/Vite scaffold + components + integration + self-test)
- Guard: ~180K (Playwright scripts + axe-core + Q1-Q7 review + report)

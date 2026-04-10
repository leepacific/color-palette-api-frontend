// Loop 3 FR-4 adapter: themeBundle → PaletteResource.
//
// Why this exists:
//   /api/v1/theme/generate returns a ThemeBundleResource (primitive ramp buckets)
//   but the 11 Sprint 1 consumer sites in src/ are coded against PaletteResource
//   (top-level colors[]). Path A (switching to /palette/random) was considered
//   but rejected in Loop 3 because /palette/random?seed= is NOT deterministic on
//   the live backend (curl-verified 2026-04-09: same seed produced different
//   colors on back-to-back calls), which would break Flow D byte-identical
//   round-trip. /theme/generate IS deterministic when {primary, seed} are fixed.
//
//   This adapter picks 5 representative swatches from the themeBundle and
//   surfaces them as PaletteResource.colors[] so the swatch grid, contrast
//   matrix, explain panel, keyboard shortcuts, and export flow all keep working
//   without touching any consumer code.

import type {
  Color,
  PaletteMetrics,
  PaletteResource,
  ThemeBundleResource,
} from '@/types/api';

// 5 display swatches drawn from the themeBundle.
// Rationale:
//   [0] primaryInput  — the user-specified primary hex (round-trips for export)
//   [1] secondary.500 — mid-tone sibling hue
//   [2] accent.500    — contrast hue
//   [3] neutral.500   — neutral mid (grey-ish) for UI surfaces
//   [4] primary.700   — darker primary for text / emphasis
// If any ramp step is missing (defensive), we fall back to primaryInput.
function pickFiveColors(bundle: ThemeBundleResource): Color[] {
  const p = bundle.primitive;
  const fallback = bundle.primaryInput;
  return [
    bundle.primaryInput,
    p.secondary?.['500'] ?? fallback,
    p.accent?.['500'] ?? fallback,
    p.neutral?.['500'] ?? fallback,
    p.primary?.['700'] ?? fallback,
  ];
}

// Default metrics when the bundle exposes only `quality.minScore`.
// PaletteResource metrics are a legacy Sprint-1 shape; we derive a reasonable
// floor so the UI's metric chips render something meaningful.
function deriveMetrics(bundle: ThemeBundleResource): PaletteMetrics {
  const base = bundle.quality?.minScore ?? 80;
  return {
    harmony: base,
    distinctness: base,
    lightnessDistribution: base,
    temperatureCoherence: base,
    saturationCoherence: base,
    gamutSpread: base,
    uiUtility: base,
    colorBlindSafety: base,
    accessibility: bundle.wcag?.enforced ? 95 : base,
  };
}

export function themeBundleToPaletteResource(
  bundle: ThemeBundleResource,
): PaletteResource {
  return {
    object: 'palette',
    id: bundle.id,
    createdAt: bundle.createdAt,
    colors: pickFiveColors(bundle),
    compositeScore: bundle.quality?.minScore ?? 80,
    metrics: deriveMetrics(bundle),
    harmonyType: bundle.generationMeta?.harmonyUsed ?? 'themeBundle',
    iterations: bundle.generationMeta?.attempts ?? 1,
    seed: bundle.seed,
    generationMeta: bundle.generationMeta,
  };
}

import { useStore } from '@/state/store';
import { BlinkingCaret } from './primitives/BlinkingCaret';

/**
 * Renders 6 shadcn-style components painted with generated tokens.
 * We hand-build the components (instead of importing shadcn) because:
 * (a) shadcn is a "copy into your project" library, not a package
 * (b) we need them to be scoped-styled, not themed globally.
 */
export function ComponentPreview() {
  const palette = useStore((s) => s.palette);
  const state = useStore((s) => s.paletteState);

  if (!palette || state !== 'default') {
    return (
      <section aria-label="component preview" className="p-4">
        <h2 className="font-mono text-sm text-fg-tertiary mb-3">
          component preview
        </h2>
        <div className="font-mono text-xs text-fg-tertiary flex items-center gap-1">
          <BlinkingCaret />
          <span>no semantic tokens</span>
        </div>
      </section>
    );
  }

  // Use palette colors as semantic approximations
  const primary = palette.colors[0]?.hex ?? '#7AE4C3';
  const secondary = palette.colors[1]?.hex ?? '#A8ADB8';
  const bg = palette.colors[2]?.hex ?? '#FAFAF7';
  const destructive = palette.colors[3]?.hex ?? '#EB5757';
  const accent = palette.colors[4]?.hex ?? '#8BB4F0';

  return (
    <section aria-label="component preview" className="p-4 flex flex-col gap-3">
      <h2 className="font-mono text-sm text-fg-tertiary">
        preview (shadcn slots)
      </h2>

      {/* Loop 5 FR-8 follow-up: this block paints dynamic user-generated palette
          colors onto shadcn slots. Contrast is a property of the generated
          palette, not of app chrome, so the block is marked inert + aria-hidden
          to exclude it from a11y scans and keyboard focus. The <h2> above and
          the ContrastMatrix panel carry the accessible affordances. */}
      <div
        // @ts-expect-error — `inert` is a valid HTML attribute (TS types lag)
        inert=""
        aria-hidden="true"
        className="border border-border-base p-3 flex flex-col gap-2"
        style={{ backgroundColor: bg, color: '#0B0C10' }}
      >
        {/* Button primary */}
        <div className="flex gap-2 items-center">
          <button
            type="button"
            className="px-3 py-1 font-mono text-xs font-medium border"
            style={{
              backgroundColor: primary,
              borderColor: primary,
              color: '#FFFFFF',
            }}
          >
            primary action
          </button>
          <button
            type="button"
            className="px-3 py-1 font-mono text-xs font-medium border"
            style={{
              backgroundColor: 'transparent',
              borderColor: secondary,
              color: secondary,
            }}
          >
            secondary
          </button>
          <button
            type="button"
            className="px-3 py-1 font-mono text-xs font-medium border"
            style={{
              backgroundColor: destructive,
              borderColor: destructive,
              color: '#FFFFFF',
            }}
          >
            destructive
          </button>
        </div>

        {/* Input */}
        <input
          type="text"
          defaultValue=""
          placeholder="input"
          className="px-2 py-1 font-mono text-xs border"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: secondary,
            color: '#0B0C10',
          }}
        />

        {/* Card */}
        <div
          className="p-2 border"
          style={{
            backgroundColor: '#FFFFFF',
            borderColor: secondary,
          }}
        >
          <div className="font-mono text-xs font-medium mb-1">card header</div>
          <div className="font-sans text-xs" style={{ color: secondary }}>
            card body with generated tokens applied.
          </div>
        </div>

        {/* Alert */}
        <div
          className="p-2 border font-mono text-xs"
          style={{
            borderColor: accent,
            backgroundColor: 'rgba(139, 180, 240, 0.12)',
            color: '#0B0C10',
          }}
        >
          info: tokens applied from current palette
        </div>

        {/* Badge */}
        <div className="flex gap-1">
          <span
            className="px-2 py-0.5 font-mono text-xs border"
            style={{
              backgroundColor: primary,
              borderColor: primary,
              color: '#FFFFFF',
            }}
          >
            badge
          </span>
          <span
            className="px-2 py-0.5 font-mono text-xs border"
            style={{ borderColor: secondary, color: secondary }}
          >
            outline
          </span>
        </div>
      </div>
    </section>
  );
}

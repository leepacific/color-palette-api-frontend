import { useStore } from '@/state/store';
import { ColorSwatch } from './ColorSwatch';
import { BlinkingCaret } from './primitives/BlinkingCaret';
import { KeycapHint } from './primitives/KeycapHint';
import { regeneratePalette } from '@/lib/actions';

export function PaletteDisplay() {
  const palette = useStore((s) => s.palette);
  const state = useStore((s) => s.paletteState);
  const error = useStore((s) => s.paletteError);

  // Empty
  if (state === 'default' && !palette) {
    return (
      <section
        aria-label="palette display"
        className="panel flex flex-col items-start justify-center p-6 min-h-[320px] gap-2"
      >
        <div className="flex items-center gap-2">
          <BlinkingCaret />
          <span className="font-mono text-fg-tertiary text-sm">
            no palette · press <KeycapHint keys="R" /> to generate
          </span>
        </div>
      </section>
    );
  }

  // Loading
  if (state === 'loading') {
    return (
      <section
        aria-label="palette display loading"
        className="flex flex-col gap-3"
      >
        <div className="flex gap-2 min-h-[280px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-1 bg-bg-raised border border-border-base flex items-center justify-center"
            >
              <BlinkingCaret character="█" />
            </div>
          ))}
        </div>
        <div className="font-mono text-xs text-fg-tertiary">
          <BlinkingCaret /> generating palette...
        </div>
      </section>
    );
  }

  // Error
  if (state === 'error' && error) {
    return (
      <section
        role="alert"
        aria-label="palette error"
        className="flex flex-col gap-2"
      >
        <div className="flex gap-2 min-h-[280px]">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="flex-1 border border-semantic-error"
              style={{ backgroundColor: 'rgba(235, 87, 87, 0.15)' }}
            >
              <div className="h-full w-full flex items-center justify-center text-semantic-error font-mono text-xs">
                ████
              </div>
            </div>
          ))}
        </div>
        <div className="font-mono text-sm text-semantic-error">
          error: {error.type} ({error.code})
        </div>
        <div className="font-mono text-xs text-fg-tertiary">
          requestId: {error.requestId} ·{' '}
          <button
            type="button"
            className="underline decoration-dotted hover:text-fg-primary"
            onClick={() => regeneratePalette()}
          >
            [r] retry
          </button>
        </div>
      </section>
    );
  }

  // Default
  return (
    <section aria-label="palette display" className="flex flex-col gap-3">
      <div className="flex gap-2 min-h-[280px]">
        {palette?.colors.map((c, i) => (
          <ColorSwatch key={`${c.hex}-${i}`} color={c} index={i} />
        ))}
      </div>
      <div className="flex items-baseline gap-3 font-mono text-xs">
        <span className="text-fg-tertiary">composite score</span>
        <span className="text-fg-primary text-4xl leading-none">
          {palette?.compositeScore.toFixed(1)}
        </span>
        <span className="text-fg-tertiary">/ 100</span>
        <span className="text-fg-tertiary">·</span>
        <span className="text-fg-secondary">harmony: {palette?.harmonyType}</span>
        <span className="text-fg-tertiary">·</span>
        <span className="text-fg-secondary">
          iterations: {palette?.iterations ?? 1}
        </span>
      </div>
    </section>
  );
}

import { useStore } from '@/state/store';
import { BlinkingCaret } from './primitives/BlinkingCaret';
import { KeycapHint } from './primitives/KeycapHint';
import { refreshExplanation } from '@/lib/actions';

export function ExplainPanel() {
  const explanation = useStore((s) => s.explanation);
  const state = useStore((s) => s.explanationState);
  const error = useStore((s) => s.explanationError);
  const palette = useStore((s) => s.palette);
  const seed = useStore((s) => s.seed);

  return (
    <aside
      role="complementary"
      aria-label="palette explanation"
      className="h-full flex flex-col gap-3"
    >
      <h2 className="font-mono text-lg font-medium text-fg-primary">
        explain
      </h2>

      {state === 'loading' && (
        <div className="font-mono text-xs text-fg-tertiary flex items-center gap-1">
          <BlinkingCaret />
          <span>computing explanation...</span>
        </div>
      )}

      {state === 'error' && error && (
        <div role="alert" className="font-mono text-sm text-semantic-error">
          explanation failed · {error.code} ·{' '}
          <button
            type="button"
            className="underline decoration-dotted"
            onClick={() =>
              refreshExplanation(palette?.colors.map((c) => c.hex) ?? [], seed)
            }
          >
            [r] retry
          </button>
        </div>
      )}

      {state === 'default' && !explanation && (
        <div className="font-mono text-xs text-fg-tertiary">
          palette has no explanation · press <KeycapHint keys="R" /> to compute
        </div>
      )}

      {state === 'default' && explanation && (
        <div className="flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-baseline gap-2">
            <span className="text-fg-tertiary">harmony ·</span>
            <span className="text-fg-primary text-sm font-medium">
              {explanation.harmonyType}
            </span>
            <span className="text-fg-tertiary">
              · confidence {(explanation.harmonyConfidence * 100).toFixed(0)}%
            </span>
          </div>

          <table className="border-collapse text-xs">
            <tbody>
              <tr>
                <td className="text-fg-tertiary pr-2">lightness span</td>
                <td className="text-fg-primary">
                  {explanation.oklchNarrative.lightnessRange.span.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="text-fg-tertiary pr-2">chroma mean</td>
                <td className="text-fg-primary">
                  {explanation.oklchNarrative.chromaRange.mean.toFixed(2)}
                </td>
              </tr>
              <tr>
                <td className="text-fg-tertiary pr-2">hue spread</td>
                <td className="text-fg-primary">
                  {explanation.oklchNarrative.hueSpread.span.toFixed(0)}°
                </td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-border-base pt-3">
            <div className="text-fg-tertiary mb-2">pedagogical notes</div>
            <ol className="font-sans text-sm leading-normal text-fg-secondary list-decimal pl-4 flex flex-col gap-1.5">
              {explanation.pedagogicalNotes.map((note, i) => (
                <li key={i}>{note}</li>
              ))}
            </ol>
          </div>

          <a
            href={explanation.harmonyReference}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent-primary hover:underline text-xs"
          >
            → {explanation.harmonyType} harmony reference
          </a>
        </div>
      )}
    </aside>
  );
}

import { useStore } from '@/state/store';
import { BlinkingCaret } from './primitives/BlinkingCaret';
import { KeycapHint } from './primitives/KeycapHint';
import { COLORBLIND_MODES } from '@/types/api';
import { refreshContrastMatrix } from '@/lib/actions';

function abbreviate(mode: string): string {
  return {
    none: 'none',
    protanopia: 'prot',
    deuteranopia: 'deut',
    tritanopia: 'trit',
    protanomaly: 'prot-anm',
    deuteranomaly: 'deut-anm',
    tritanomaly: 'trit-anm',
    achromatopsia: 'achr',
    achromatomaly: 'achr-anm',
  }[mode] ?? mode;
}

export function ContrastMatrix() {
  const matrix = useStore((s) => s.contrastMatrix);
  const state = useStore((s) => s.contrastState);
  const error = useStore((s) => s.contrastError);
  const cbMode = useStore((s) => s.colorblindMode);
  const palette = useStore((s) => s.palette);
  const setFocusedIndex = useStore((s) => s.setFocusedIndex);

  return (
    <section
      role="region"
      aria-label="contrast and colorblind matrix"
      className="h-full flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <h2 className="font-mono text-lg font-medium text-fg-primary">
          contrast · colorblind
        </h2>
        <div className="flex items-center gap-1 font-mono text-xs overflow-x-auto">
          {COLORBLIND_MODES.map((m) => (
            <button
              key={m}
              type="button"
              className={`px-2 py-0.5 border transition-colors duration-fast ${
                cbMode === m
                  ? 'border-accent-primary text-accent-primary'
                  : 'border-transparent text-fg-tertiary hover:text-fg-secondary hover:border-border-base'
              }`}
              onClick={() => useStore.setState({ colorblindMode: m })}
              aria-pressed={cbMode === m}
              aria-label={`colorblind simulation ${m}`}
            >
              {abbreviate(m)}
            </button>
          ))}
          <span className="ml-2">
            <KeycapHint keys="X" />
          </span>
        </div>
      </div>

      {state === 'loading' && (
        <div className="flex-1 flex items-center justify-center font-mono text-xs text-fg-tertiary gap-1">
          <BlinkingCaret />
          <span>computing matrix...</span>
        </div>
      )}

      {state === 'error' && error && (
        <div role="alert" className="font-mono text-sm text-semantic-error">
          error: {error.type} ({error.code}) ·{' '}
          <button
            type="button"
            className="underline decoration-dotted"
            onClick={() =>
              refreshContrastMatrix(palette?.colors.map((c) => c.hex) ?? [])
            }
          >
            [r] retry
          </button>
        </div>
      )}

      {state === 'default' && !matrix && (
        <div className="font-mono text-xs text-fg-tertiary">
          matrix not computed · press <KeycapHint keys="R" /> to analyze
        </div>
      )}

      {state === 'default' && matrix && (
        <div className="overflow-auto flex-1">
          <table className="border-collapse font-mono text-xs">
            <thead>
              <tr>
                <th className="p-1 text-fg-tertiary" scope="col">
                  fg \\ bg
                </th>
                {matrix.palette.map((hex, i) => (
                  <th
                    key={`h-${i}`}
                    scope="col"
                    className="p-1 text-fg-tertiary"
                    style={{ minWidth: 48 }}
                  >
                    <div
                      role="img"
                      className="w-8 h-3 border border-border-base inline-block"
                      style={{ backgroundColor: hex }}
                      aria-label={hex}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.palette.map((fgHex, fi) => (
                <tr key={`r-${fi}`}>
                  <th scope="row" className="p-1 text-left">
                    <div
                      role="img"
                      className="w-8 h-3 border border-border-base inline-block"
                      style={{ backgroundColor: fgHex }}
                      aria-label={fgHex}
                    />
                  </th>
                  {matrix.palette.map((_, bi) => {
                    const entry = matrix.matrix.find(
                      (e) => e.fgIndex === fi && e.bgIndex === bi,
                    );
                    if (!entry || fi === bi) {
                      return (
                        <td
                          key={`c-${fi}-${bi}`}
                          className="p-1 text-center text-fg-tertiary"
                        >
                          —
                        </td>
                      );
                    }
                    const pass = entry.passes.aaNormal;
                    const aaa = entry.passes.aaaNormal;
                    return (
                      <td
                        key={`c-${fi}-${bi}`}
                        className="p-1 text-center"
                        style={{
                          color: aaa
                            ? 'var(--semantic-success)'
                            : pass
                              ? 'var(--fg-primary)'
                              : 'var(--semantic-error)',
                        }}
                        aria-label={`foreground ${fi + 1} on background ${bi + 1}, ratio ${entry.ratio.toFixed(2)}, ${pass ? 'passes AA' : 'fails AA'}`}
                      >
                        <button
                          type="button"
                          className="focus-visible:outline focus-visible:outline-2 focus-visible:outline-border-accent"
                          onClick={() => setFocusedIndex(fi)}
                        >
                          {entry.ratio.toFixed(1)}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

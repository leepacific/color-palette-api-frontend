// D7 — GenerationMeta: conditional one-line status display.
// Sprint 2. Shows harmony/quality/attempts when generationMeta is present.

import { useStore } from '@/state/store';
import { copyText } from '@/lib/actions';

export function GenerationMeta() {
  const meta = useStore((s) => s.generationMeta);
  const paletteState = useStore((s) => s.paletteState);

  // Loading state: show caret indicator.
  if (paletteState === 'loading') {
    return (
      <div
        className="font-mono text-fg-tertiary mt-2"
        style={{ fontSize: 'var(--text-xs)' }}
        aria-label="generation meta loading"
      >
        <span className="animate-pulse">_</span>
      </div>
    );
  }

  // Error state.
  if (paletteState === 'error') {
    return (
      <div
        className="font-mono text-semantic-error mt-2"
        style={{ fontSize: 'var(--text-xs)' }}
        aria-label="generation meta error"
      >
        generation failed
      </div>
    );
  }

  // Hidden when no meta (default state without harmony/quality params).
  if (!meta) return null;

  const line = `harmony: ${meta.harmonyUsed} · quality: ${meta.qualityScore} · attempts: ${meta.attempts}`;

  return (
    <button
      type="button"
      className="font-mono text-fg-tertiary mt-2 hover:text-fg-secondary transition-colors duration-fast cursor-pointer border-none bg-transparent p-0 text-left"
      style={{ fontSize: 'var(--text-xs)' }}
      aria-label={`generation metadata: ${line}. click to copy`}
      onClick={() => void copyText(line, 'meta copied')}
    >
      {line}
    </button>
  );
}

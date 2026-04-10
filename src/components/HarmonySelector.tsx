// C9 — HarmonySelector: segmented inline tag row for harmony hint selection.
// Sprint 2. Instrument-dial style, monospace, border-based.

import { useStore } from '@/state/store';
import { HARMONY_HINTS, HARMONY_LABELS } from '@/types/api';
import type { HarmonyHint } from '@/types/api';
import { KeycapHint } from './primitives/KeycapHint';

export function HarmonySelector() {
  const harmonyHint = useStore((s) => s.harmonyHint);
  const setHarmonyHint = useStore((s) => s.setHarmonyHint);

  return (
    <div
      className="flex items-center gap-0 font-mono text-xs"
      role="radiogroup"
      aria-label="harmony type selector"
    >
      {HARMONY_HINTS.map((hint: HarmonyHint) => {
        const isActive = harmonyHint === hint;
        return (
          <button
            key={hint}
            type="button"
            role="radio"
            aria-checked={isActive}
            aria-label={`harmony ${hint}`}
            className={[
              'px-2 py-1 border transition-colors duration-fast',
              'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-primary',
              isActive
                ? 'border-border-accent text-accent-primary bg-bg-raised'
                : 'border-border-base text-fg-tertiary hover:text-fg-secondary hover:border-border-strong',
              // Collapse double borders between adjacent buttons.
              '-ml-px first:ml-0',
            ].join(' ')}
            onClick={() => setHarmonyHint(hint)}
          >
            {HARMONY_LABELS[hint]}
          </button>
        );
      })}
      <span className="ml-2 text-fg-tertiary">
        <KeycapHint keys="H" />
      </span>
    </div>
  );
}

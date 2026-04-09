import { useState } from 'react';
import type { Color } from '@/types/api';
import { formatHex, formatHsl, formatOklch } from '@/lib/color-math';
import { copyText } from '@/lib/actions';
import { useStore } from '@/state/store';

interface ColorSwatchProps {
  color: Color;
  index: number;
}

export function ColorSwatch({ color, index }: ColorSwatchProps) {
  const locked = useStore((s) => s.locked[index] ?? false);
  const focused = useStore((s) => s.focusedIndex === index);
  const toggleLock = useStore((s) => s.toggleLock);
  const setFocusedIndex = useStore((s) => s.setFocusedIndex);

  const [flashed, setFlashed] = useState<string | null>(null);

  const onCopy = (notation: 'hex' | 'oklch' | 'hsl', value: string) => {
    setFlashed(notation);
    void copyText(value, `${notation} copied`);
    window.setTimeout(() => setFlashed(null), 160);
  };

  // Loop 5 FR-7 fix (Approach B):
  // The outer element is a plain <div> (no interactive role) so it can legally
  // contain the inner <button> elements (select + lock). The "select this color"
  // affordance lives on a dedicated button overlaying the color block at the top
  // of the swatch, and the lock toggle is a sibling button in the metadata area.
  return (
    <div
      className="relative flex flex-col flex-1 min-w-0 font-mono text-left"
      style={{
        border: focused ? '2px solid var(--border-accent)' : '1px solid var(--border-base)',
      }}
    >
      {/* Color block + main select button (carries the full aria-label) */}
      <button
        type="button"
        className="flex-1 min-h-[160px] relative block w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-border-accent"
        style={{ backgroundColor: color.hex }}
        onClick={() => setFocusedIndex(index)}
        aria-label={`color ${index + 1} of 5: hex ${color.hex}, oklch ${formatOklch(color.oklch)}, hsl ${formatHsl(color.hsl)}${locked ? ', locked' : ''}`}
      >
        {locked && (
          <span className="absolute top-2 right-2 keycap" aria-hidden>
            L
          </span>
        )}
        <span className="absolute top-2 left-2 keycap" aria-hidden>
          {index + 1}
        </span>
      </button>

      {/* Metadata area — sibling of the select button, contains lock toggle */}
      <div className="bg-bg-raised border-t border-border-base px-3 py-2 flex flex-col gap-0.5">
        <span
          className={`text-3xl tracking-[0.02em] text-fg-primary ${flashed === 'hex' ? 'copy-flash' : ''}`}
          onClick={() => onCopy('hex', formatHex(color.hex))}
        >
          {formatHex(color.hex)}
        </span>
        <span
          className={`text-sm text-fg-secondary ${flashed === 'oklch' ? 'copy-flash' : ''}`}
          onClick={() => onCopy('oklch', formatOklch(color.oklch))}
        >
          {formatOklch(color.oklch)}
        </span>
        <span
          className={`text-xs text-fg-tertiary ${flashed === 'hsl' ? 'copy-flash' : ''}`}
          onClick={() => onCopy('hsl', formatHsl(color.hsl))}
        >
          {formatHsl(color.hsl)}
        </span>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-fg-tertiary">
            {color.name ?? `color ${index + 1}`}
          </span>
          <button
            type="button"
            className="font-mono text-xs text-fg-secondary hover:text-accent-primary focus-visible:text-accent-primary"
            onClick={() => toggleLock(index)}
            aria-label={locked ? `unlock color ${index + 1}` : `lock color ${index + 1}`}
          >
            [{locked ? 'locked' : 'lock'}]
          </button>
        </div>
      </div>
    </div>
  );
}

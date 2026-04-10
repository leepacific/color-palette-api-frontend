// C10 — QualityThreshold: numeric input with +/- buttons for minQuality.
// Sprint 2. Monospace, narrow, inline with TopBar.

import { useRef } from 'react';
import { useStore } from '@/state/store';
import { KeycapHint } from './primitives/KeycapHint';

const STEP = 10;
const MIN = 0;
const MAX = 100;

export function QualityThreshold() {
  const minQuality = useStore((s) => s.minQuality);
  const setMinQuality = useStore((s) => s.setMinQuality);
  const inputRef = useRef<HTMLInputElement>(null);

  function adjust(delta: number) {
    const next = Math.max(MIN, Math.min(MAX, minQuality + delta));
    setMinQuality(next);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw === '') {
      setMinQuality(0);
      return;
    }
    const n = Math.max(MIN, Math.min(MAX, Number.parseInt(raw, 10)));
    setMinQuality(n);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowUp' || e.key === '+') {
      e.preventDefault();
      adjust(STEP);
    } else if (e.key === 'ArrowDown' || e.key === '-') {
      e.preventDefault();
      adjust(-STEP);
    }
  }

  return (
    <div
      className="flex items-center gap-0 font-mono text-xs"
      aria-label="quality threshold control"
    >
      <span className="text-fg-tertiary mr-1">quality</span>
      <button
        type="button"
        className="px-1 py-1 border border-border-base text-fg-tertiary hover:text-fg-secondary hover:border-border-strong transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-primary"
        onClick={() => adjust(-STEP)}
        aria-label="decrease quality threshold"
      >
        -
      </button>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={minQuality}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="w-10 text-center py-1 border-y border-border-base bg-bg-base text-fg-primary font-mono text-xs focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-primary"
        aria-label="quality threshold value"
        data-quality-input
      />
      <button
        type="button"
        className="px-1 py-1 border border-border-base text-fg-tertiary hover:text-fg-secondary hover:border-border-strong transition-colors duration-fast focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent-primary"
        onClick={() => adjust(STEP)}
        aria-label="increase quality threshold"
      >
        +
      </button>
      <span className="ml-2 text-fg-tertiary">
        <KeycapHint keys="Q" />
      </span>
    </div>
  );
}

/** Focus the quality input — called by keyboard shortcut handler. */
export function focusQualityInput() {
  const el = document.querySelector<HTMLInputElement>('[data-quality-input]');
  if (el) el.focus();
}

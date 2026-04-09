import { useStore } from '@/state/store';
import { KeycapHint } from './primitives/KeycapHint';
import { BlinkingCaret } from './primitives/BlinkingCaret';

export function TopBar() {
  const seed = useStore((s) => s.seed);
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const toggleHelp = useStore((s) => s.toggleHelp);
  const topBanner = useStore((s) => s.topBanner);

  return (
    <header className="area-header flex items-center h-full px-4 gap-4 text-sm">
      <div className="flex items-center gap-2 text-fg-primary">
        <BlinkingCaret />
        <span className="font-mono font-medium">cpa</span>
        <span className="text-fg-tertiary">·</span>
        <span className="font-mono text-fg-secondary" aria-label={`current seed ${seed}`}>
          [{seed}]
        </span>
      </div>

      <div className="flex-1" />

      {topBanner && (
        <div
          role="status"
          aria-live="polite"
          className={`font-mono text-xs px-3 py-1 border ${
            topBanner.kind === 'error'
              ? 'border-semantic-error text-semantic-error'
              : topBanner.kind === 'warning'
                ? 'border-semantic-warning text-semantic-warning'
                : 'border-semantic-info text-semantic-info'
          }`}
        >
          {topBanner.message}
        </div>
      )}

      <button
        type="button"
        className="font-mono text-xs text-fg-secondary hover:text-fg-primary px-2 py-1 border border-transparent hover:border-border-base active:border-border-strong transition-colors duration-fast"
        onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
        aria-label={`switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
      >
        <span className={mode === 'dark' ? 'text-fg-primary font-medium' : ''}>dark</span>
        <span className="text-fg-tertiary mx-1">|</span>
        <span className={mode === 'light' ? 'text-fg-primary font-medium' : ''}>light</span>
        <span className="ml-2">
          <KeycapHint keys="M" />
        </span>
      </button>

      <button
        type="button"
        className="font-mono text-xs text-fg-secondary hover:text-fg-primary px-2 py-1 border border-transparent hover:border-border-base transition-colors duration-fast"
        onClick={toggleHelp}
        aria-label="open keyboard shortcut help"
      >
        help <KeycapHint keys="?" />
      </button>
    </header>
  );
}

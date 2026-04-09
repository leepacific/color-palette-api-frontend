import { useStore } from '@/state/store';
import { BlinkingCaret } from './primitives/BlinkingCaret';

export function JsonSidebar() {
  const palette = useStore((s) => s.palette);
  const state = useStore((s) => s.paletteState);
  const error = useStore((s) => s.paletteError);
  const setFocusedIndex = useStore((s) => s.setFocusedIndex);

  if (state === 'loading') {
    return (
      <aside
        className="p-3 font-mono text-xs text-fg-secondary"
        aria-hidden="true"
      >
        <div className="flex items-center gap-1">
          <BlinkingCaret />
          <span>palette {'{ loading... }'}</span>
        </div>
      </aside>
    );
  }

  if (state === 'error') {
    return (
      <aside className="p-3 font-mono text-xs text-semantic-error" aria-hidden="true">
        <div className="flex items-center gap-1">
          <BlinkingCaret color="var(--semantic-error)" />
          <span>
            palette {'{ error: "'}
            {error?.type}
            {'", requestId: "'}
            {error?.requestId}
            {'" }'}
          </span>
        </div>
      </aside>
    );
  }

  if (!palette) {
    return (
      <aside className="p-3 font-mono text-xs text-fg-tertiary" aria-hidden="true">
        <div className="flex items-center gap-1">
          <BlinkingCaret />
          <span>palette null</span>
        </div>
      </aside>
    );
  }

  return (
    <aside
      className="p-3 font-mono text-xs text-fg-secondary flex flex-col gap-1"
      aria-hidden="true"
    >
      <div className="flex items-center gap-1 text-fg-primary">
        <BlinkingCaret />
        <span>palette {'{'}</span>
      </div>
      <div className="pl-4">
        <span className="text-fg-tertiary">id</span>
        <span className="text-fg-tertiary">: </span>
        <span className="text-fg-secondary">&quot;{palette.id}&quot;</span>,
      </div>
      <div className="pl-4">
        <span className="text-fg-tertiary">compositeScore</span>
        <span className="text-fg-tertiary">: </span>
        <span className="text-fg-primary">{palette.compositeScore}</span>,
      </div>
      <div className="pl-4">
        <span className="text-fg-tertiary">harmonyType</span>
        <span className="text-fg-tertiary">: </span>
        <span className="text-fg-secondary">&quot;{palette.harmonyType}&quot;</span>,
      </div>
      <div className="pl-4 text-fg-tertiary">colors: [</div>
      {palette.colors.map((c, i) => (
        <button
          key={`${c.hex}-${i}`}
          type="button"
          className="pl-8 text-left hover:bg-bg-raised rounded-none focus-visible:bg-bg-raised"
          onClick={() => setFocusedIndex(i)}
        >
          <span className="text-fg-tertiary">{i}: </span>
          <span
            className="tracking-[0.02em]"
            style={{ color: c.hex }}
          >
            &quot;{c.hex}&quot;
          </span>
          <span className="text-fg-tertiary">,</span>
        </button>
      ))}
      <div className="pl-4 text-fg-tertiary">]</div>
      <div className="text-fg-primary">{'}'}</div>
    </aside>
  );
}

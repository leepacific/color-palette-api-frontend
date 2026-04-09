import { useStore } from '@/state/store';
import { KeycapHint } from './primitives/KeycapHint';

const SECTIONS: Array<{
  title: string;
  bindings: Array<{ keys: string | string[]; label: string }>;
}> = [
  {
    title: 'generator',
    bindings: [
      { keys: 'R', label: 'regenerate palette' },
      { keys: 'Space', label: 'regenerate (alias)' },
      { keys: '1..9', label: 'focus color at index' },
      { keys: 'L', label: 'lock focused color' },
      { keys: 'Shift+L', label: 'lock all' },
      { keys: 'U', label: 'unlock focused' },
      { keys: 'Shift+U', label: 'unlock all' },
    ],
  },
  {
    title: 'export',
    bindings: [
      { keys: 'E', label: 'toggle export drawer' },
      { keys: 'J', label: 'next format (in drawer)' },
      { keys: 'K', label: 'previous format (in drawer)' },
      { keys: 'C', label: 'copy current format or focused hex' },
      { keys: 'Enter', label: 'copy (in drawer)' },
    ],
  },
  {
    title: 'panels',
    bindings: [
      { keys: ['G', 'J'], label: 'toggle json sidebar' },
      { keys: ['G', 'E'], label: 'toggle explain panel' },
      { keys: ['G', 'M'], label: 'toggle matrix panel' },
    ],
  },
  {
    title: 'accessibility',
    bindings: [
      { keys: 'X', label: 'cycle colorblind forward' },
      { keys: 'Shift+X', label: 'cycle colorblind backward' },
      { keys: 'M', label: 'toggle dark/light mode' },
    ],
  },
  {
    title: 'share',
    bindings: [{ keys: 'S', label: 'copy current url' }],
  },
  {
    title: 'meta',
    bindings: [
      { keys: '?', label: 'open this help' },
      { keys: 'Esc', label: 'close current overlay' },
    ],
  },
];

export function HelpOverlay() {
  const open = useStore((s) => s.helpOpen);
  const toggle = useStore((s) => s.toggleHelp);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-overlay)' }}
      role="dialog"
      aria-modal="true"
      aria-label="keyboard shortcuts"
      onClick={toggle}
    >
      <div
        className="panel-raised max-w-3xl w-[90vw] max-h-[80vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-mono text-2xl font-medium text-fg-primary mb-4">
          keyboard shortcuts
        </h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="font-mono text-sm text-fg-tertiary uppercase mb-2 tracking-[0.05em]">
                {section.title}
              </h3>
              <dl className="flex flex-col gap-1.5">
                {section.bindings.map((b, i) => (
                  <div key={i} className="flex items-center justify-between gap-3">
                    <dd className="font-mono text-xs text-fg-secondary">
                      {b.label}
                    </dd>
                    <dt>
                      <KeycapHint keys={b.keys} />
                    </dt>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
        <div className="border-t border-border-base mt-6 pt-3 flex items-center justify-between font-mono text-xs text-fg-tertiary">
          <span>press any key to close</span>
          <button
            type="button"
            onClick={toggle}
            className="text-fg-secondary hover:text-fg-primary underline decoration-dotted"
          >
            [close]
          </button>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import { CODE_EXPORT_FORMATS } from '@/types/api';
import type { CodeExportFormat } from '@/types/api';
import { BlinkingCaret } from './primitives/BlinkingCaret';
import { KeycapHint } from './primitives/KeycapHint';
import { copyText, exportCurrentFormat } from '@/lib/actions';

export function ExportDrawer() {
  const open = useStore((s) => s.exportOpen);
  const format = useStore((s) => s.exportFormat);
  const response = useStore((s) => s.exportResponse);
  const state = useStore((s) => s.exportState);
  const error = useStore((s) => s.exportError);
  const setExportOpen = useStore((s) => s.setExportOpen);
  const setExportFormat = useStore((s) => s.setExportFormat);

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && panelRef.current) {
      panelRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const onSelectFormat = (f: CodeExportFormat) => {
    setExportFormat(f);
    void exportCurrentFormat(f);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-label="export drawer"
    >
      <button
        type="button"
        className="flex-1 cursor-default"
        style={{ backgroundColor: 'var(--bg-overlay)' }}
        onClick={() => setExportOpen(false)}
        aria-label="close export drawer"
      />
      <div
        ref={panelRef}
        tabIndex={-1}
        className="drawer-open w-[720px] max-w-[90vw] bg-bg-elevated border-l border-border-strong flex flex-col focus:outline-none"
        style={{ boxShadow: 'var(--shadow-drawer)' }}
      >
        <div className="border-b border-border-base px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm">
            <BlinkingCaret />
            <span className="text-fg-primary font-medium">export code</span>
          </div>
          <div className="flex items-center gap-2 font-mono text-xs text-fg-tertiary">
            <KeycapHint keys={['J']} /> <span>/</span> <KeycapHint keys={['K']} />
            <span>cycle</span>
            <span className="mx-1">·</span>
            <KeycapHint keys="Enter" />
            <span>copy</span>
            <span className="mx-1">·</span>
            <KeycapHint keys="Esc" />
            <span>close</span>
          </div>
        </div>

        {/* Format tabs */}
        <div
          role="tablist"
          aria-label="export formats"
          className="flex overflow-x-auto border-b border-border-base"
        >
          {CODE_EXPORT_FORMATS.map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={f === format}
              type="button"
              className={`px-3 py-2 font-mono text-xs whitespace-nowrap border-b-2 transition-colors duration-fast ${
                f === format
                  ? 'border-border-accent text-accent-primary'
                  : 'border-transparent text-fg-tertiary hover:text-fg-secondary'
              }`}
              onClick={() => onSelectFormat(f)}
            >
              [{f}]
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {state === 'loading' && (
            <div className="font-mono text-xs text-fg-tertiary flex items-center gap-1">
              <BlinkingCaret />
              <span>&gt; computing {format}</span>
            </div>
          )}

          {state === 'error' && error && (
            <div role="alert" className="font-mono text-sm text-semantic-error">
              &gt; export failed · {error.code}{' '}
              <button
                type="button"
                className="underline decoration-dotted ml-2"
                onClick={() => exportCurrentFormat(format)}
              >
                [r] retry
              </button>
            </div>
          )}

          {state === 'default' && !response && (
            <div className="font-mono text-xs text-fg-tertiary">
              no format selected · press <KeycapHint keys="E" /> to choose
            </div>
          )}

          {state === 'default' && response && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between font-mono text-xs">
                <span className="text-fg-secondary">
                  {response.format} · {response.filename}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 border border-border-accent text-accent-primary hover:bg-bg-raised focus-visible:bg-bg-raised"
                  onClick={() =>
                    copyText(response.code, `${response.format} copied`)
                  }
                >
                  [copy]
                </button>
              </div>
              <pre
                className="bg-bg-base border border-border-base p-3 font-mono text-xs text-fg-primary overflow-auto max-h-[400px]"
                aria-label={`${response.format} code`}
              >
                {response.code}
              </pre>
              <div className="font-mono text-xs text-fg-tertiary flex flex-col gap-0.5">
                <div>
                  <span className="text-fg-secondary">paste into:</span>{' '}
                  {response.pasteInto}
                </div>
                <div>
                  <span className="text-fg-secondary">target:</span>{' '}
                  {response.targetVersion}
                </div>
                <div>
                  <span className="text-fg-secondary">notes:</span> {response.notes}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

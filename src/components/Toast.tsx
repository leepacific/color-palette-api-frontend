import { useStore } from '@/state/store';

export function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-40 panel-raised px-3 py-2 font-mono text-xs"
      style={{
        borderColor:
          toast.kind === 'error'
            ? 'var(--semantic-error)'
            : toast.kind === 'success'
              ? 'var(--semantic-success)'
              : 'var(--semantic-info)',
        color:
          toast.kind === 'error'
            ? 'var(--semantic-error)'
            : toast.kind === 'success'
              ? 'var(--semantic-success)'
              : 'var(--fg-primary)',
      }}
    >
      {toast.message}
    </div>
  );
}

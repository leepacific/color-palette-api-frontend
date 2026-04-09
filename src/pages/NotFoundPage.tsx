import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlinkingCaret } from '@/components/primitives/BlinkingCaret';
import { KeycapHint } from '@/components/primitives/KeycapHint';

export function NotFoundPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'r') navigate('/');
      else if (e.key === 'h') navigate('/help');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navigate]);

  return (
    <main
      role="main"
      className="min-h-screen p-8 font-mono text-sm text-fg-primary"
    >
      <div className="max-w-2xl">
        <div className="text-5xl text-fg-primary flex items-center gap-2 mb-2">
          404<BlinkingCaret />
        </div>
        <div className="text-fg-secondary mb-6">path not resolved</div>

        <div className="pl-6 flex flex-col gap-1">
          <div>
            <span className="text-fg-tertiary">expected: </span>
            <span>a valid route</span>
          </div>
          <div>
            <span className="text-fg-tertiary">received: </span>
            <span className="text-semantic-error">
              {window.location.pathname}
            </span>
          </div>
        </div>

        <div className="pl-6 mt-6 flex flex-col gap-2 text-fg-secondary">
          <div>
            <span className="text-fg-tertiary">&gt; </span>
            <KeycapHint keys="R" /> return to generator
          </div>
          <div>
            <span className="text-fg-tertiary">&gt; </span>
            <KeycapHint keys="H" /> open help
          </div>
        </div>
      </div>
    </main>
  );
}

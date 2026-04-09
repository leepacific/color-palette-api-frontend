import { Link } from 'react-router-dom';
import { HelpOverlay } from '@/components/HelpOverlay';
import { useStore } from '@/state/store';
import { useEffect } from 'react';

export function HelpPage() {
  // Render the HelpOverlay inline (outside modal context) by forcing open
  useEffect(() => {
    useStore.setState({ helpOpen: true });
  }, []);

  return (
    <main role="main" className="min-h-screen p-8 font-mono">
      <Link
        to="/"
        className="font-mono text-xs text-fg-tertiary hover:text-fg-primary underline decoration-dotted"
      >
        &lt; back to generator
      </Link>
      <HelpOverlay />
    </main>
  );
}

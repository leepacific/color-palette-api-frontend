import { useEffect } from 'react';
import { useStore } from '@/state/store';
import { regeneratePalette } from '@/lib/actions';
import { PaletteDisplay } from '@/components/PaletteDisplay';
import { JsonSidebar } from '@/components/JsonSidebar';
import { ContrastMatrix } from '@/components/ContrastMatrix';
import { ExplainPanel } from '@/components/ExplainPanel';
import { ComponentPreview } from '@/components/ComponentPreview';
import { TopBar } from '@/components/TopBar';
import { KeycapHint } from '@/components/primitives/KeycapHint';

export function GeneratorPage() {
  const palette = useStore((s) => s.palette);
  const seed = useStore((s) => s.seed);

  useEffect(() => {
    if (!palette) {
      void regeneratePalette(seed);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    document.title = `cpa [${seed}]`;
  }, [seed]);

  return (
    <>
      <a href="#main" className="skip-to-content">
        skip to generator
      </a>
      <div className="app-shell-grid">
        <TopBar />

        <div className="area-left">
          <JsonSidebar />
        </div>

        <main id="main" className="area-main" role="main" aria-label="palette generator">
          <div className="flex items-baseline justify-between mb-4">
            <div className="flex items-baseline gap-3">
              <h1 className="font-mono text-2xl font-medium text-fg-primary">
                generator
              </h1>
              <span className="font-mono text-xs text-fg-tertiary">
                press <KeycapHint keys="R" /> regenerate ·{' '}
                <KeycapHint keys="E" /> export ·{' '}
                <KeycapHint keys="?" /> help
              </span>
            </div>
            <button
              type="button"
              className="font-mono text-sm px-4 py-2 border border-border-accent text-accent-primary hover:bg-bg-raised focus-visible:bg-bg-raised transition-colors duration-fast"
              onClick={() => regeneratePalette()}
              aria-label="regenerate palette"
            >
              regenerate <KeycapHint keys="R" />
            </button>
          </div>

          <PaletteDisplay />

          <div className="mt-6">
            <ComponentPreview />
          </div>
        </main>

        <div className="area-right">
          <ExplainPanel />
        </div>

        <div className="area-bottom">
          <ContrastMatrix />
        </div>
      </div>
    </>
  );
}

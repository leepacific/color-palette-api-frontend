import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { GeneratorPage } from '@/pages/GeneratorPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { HelpPage } from '@/pages/HelpPage';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HelpOverlay } from '@/components/HelpOverlay';
import { ExportDrawer } from '@/components/ExportDrawer';
import { Toast } from '@/components/Toast';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { useStore } from '@/state/store';

function AppInner() {
  useKeyboardShortcuts();
  const mode = useStore((s) => s.mode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<GeneratorPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <HelpOverlay />
      <ExportDrawer />
      <Toast />
    </ErrorBoundary>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

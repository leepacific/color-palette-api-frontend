// Central keybinding system — 18 shortcuts, document-level listener.
// Supports single-key and two-key `g+X` chord bindings.

import { useEffect } from 'react';
import { useStore } from '@/state/store';
import {
  copyCurrentUrl,
  copyText,
  exportCurrentFormat,
  regeneratePalette,
} from '@/lib/actions';
import { CODE_EXPORT_FORMATS, HARMONY_HINTS } from '@/types/api';
import { focusQualityInput } from '@/components/QualityThreshold';

type ActionFn = () => void;

const CHORD_TIMEOUT_MS = 1000;

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    let chordPrefix: string | null = null;
    let chordTimer: number | null = null;

    function clearChord() {
      chordPrefix = null;
      if (chordTimer !== null) {
        window.clearTimeout(chordTimer);
        chordTimer = null;
      }
    }

    function startChord(prefix: string) {
      chordPrefix = prefix;
      if (chordTimer !== null) window.clearTimeout(chordTimer);
      chordTimer = window.setTimeout(clearChord, CHORD_TIMEOUT_MS);
    }

    const bindings: Record<string, ActionFn> = {
      // Generator
      r: () => regeneratePalette(),
      ' ': () => regeneratePalette(),
      l: () => {
        const s = useStore.getState();
        if (s.focusedIndex !== null) s.toggleLock(s.focusedIndex);
      },
      L: () => {
        const s = useStore.getState();
        s.locked.forEach((_, i) => {
          if (!s.locked[i]) s.toggleLock(i);
        });
      },
      u: () => {
        const s = useStore.getState();
        if (s.focusedIndex !== null && s.locked[s.focusedIndex]) {
          s.toggleLock(s.focusedIndex);
        }
      },
      U: () => {
        const s = useStore.getState();
        s.locked.forEach((locked, i) => {
          if (locked) s.toggleLock(i);
        });
      },

      // Export
      e: () => {
        const s = useStore.getState();
        const next = !s.exportOpen;
        s.setExportOpen(next);
        if (next) void exportCurrentFormat(s.exportFormat);
      },
      j: () => {
        const s = useStore.getState();
        if (!s.exportOpen) return;
        const idx = CODE_EXPORT_FORMATS.indexOf(s.exportFormat);
        const next = CODE_EXPORT_FORMATS[(idx + 1) % CODE_EXPORT_FORMATS.length];
        s.setExportFormat(next);
        void exportCurrentFormat(next);
      },
      k: () => {
        const s = useStore.getState();
        if (!s.exportOpen) return;
        const idx = CODE_EXPORT_FORMATS.indexOf(s.exportFormat);
        const next =
          CODE_EXPORT_FORMATS[(idx - 1 + CODE_EXPORT_FORMATS.length) % CODE_EXPORT_FORMATS.length];
        s.setExportFormat(next);
        void exportCurrentFormat(next);
      },
      c: () => {
        const s = useStore.getState();
        if (s.exportOpen && s.exportResponse) {
          void copyText(s.exportResponse.code, `${s.exportResponse.format} copied`);
          return;
        }
        const focused = s.focusedIndex;
        if (focused !== null && s.palette) {
          void copyText(s.palette.colors[focused].hex, 'hex copied');
        }
      },
      Enter: () => {
        const s = useStore.getState();
        if (s.exportOpen && s.exportResponse) {
          void copyText(s.exportResponse.code, `${s.exportResponse.format} copied`);
        }
      },

      // Sprint 2: Harmony cycle + Quality focus
      h: () => {
        const s = useStore.getState();
        const idx = HARMONY_HINTS.indexOf(s.harmonyHint);
        const next = HARMONY_HINTS[(idx + 1) % HARMONY_HINTS.length];
        s.setHarmonyHint(next);
      },
      H: () => {
        const s = useStore.getState();
        const idx = HARMONY_HINTS.indexOf(s.harmonyHint);
        const next =
          HARMONY_HINTS[(idx - 1 + HARMONY_HINTS.length) % HARMONY_HINTS.length];
        s.setHarmonyHint(next);
      },
      q: () => focusQualityInput(),

      // Accessibility
      x: () => useStore.getState().cycleColorblind(1),
      X: () => useStore.getState().cycleColorblind(-1),
      m: () => {
        const s = useStore.getState();
        s.setMode(s.mode === 'dark' ? 'light' : 'dark');
      },

      // Share
      s: () => copyCurrentUrl(),

      // Meta
      '?': () => useStore.getState().toggleHelp(),
      Escape: () => {
        const s = useStore.getState();
        if (s.helpOpen) s.toggleHelp();
        else if (s.exportOpen) s.setExportOpen(false);
      },
    };

    function onKeyDown(ev: KeyboardEvent) {
      // Ignore if focus is inside an editable field (except for Escape)
      const target = ev.target as HTMLElement | null;
      const isEditing =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable;
      if (isEditing && ev.key !== 'Escape') return;

      // Ignore modifier combinations (browser defaults preserved)
      if (ev.ctrlKey || ev.metaKey || ev.altKey) return;

      const key = ev.key;

      // Digit focus
      if (/^[1-9]$/.test(key)) {
        ev.preventDefault();
        useStore.getState().setFocusedIndex(parseInt(key, 10) - 1);
        clearChord();
        return;
      }

      // Chord handling: `g` starts a chord
      if (chordPrefix === 'g') {
        ev.preventDefault();
        clearChord();
        const s = useStore.getState();
        if (key === 'j') s.toggleLeftPanel();
        else if (key === 'e') s.toggleRightPanel();
        else if (key === 'm') s.toggleBottomPanel();
        return;
      }
      if (key === 'g') {
        ev.preventDefault();
        startChord('g');
        return;
      }

      const action = bindings[key];
      if (action) {
        ev.preventDefault();
        action();
        clearChord();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearChord();
    };
  }, []);
}

// Global store — Zustand, reachable from outside React for document-level keyboard handler.

import { create } from 'zustand';
import type {
  CodeExportFormat,
  CodeExportResponse,
  ColorblindMode,
  ContrastMatrixResource,
  GenerationMeta,
  HarmonyHint,
  PaletteExplanationResource,
  PaletteResource,
} from '@/types/api';

export type ThemeMode = 'dark' | 'light';
export type LoadState = 'default' | 'loading' | 'error';

export interface AppError {
  type: string;
  code: string;
  message: string;
  requestId: string;
}

interface AppState {
  // Palette
  palette: PaletteResource | null;
  paletteState: LoadState;
  paletteError: AppError | null;
  locked: boolean[];
  focusedIndex: number | null;

  // Seed + mode
  seed: string;
  mode: ThemeMode;

  // Sprint 2: harmony + quality
  harmonyHint: HarmonyHint;
  minQuality: number;
  generationMeta: GenerationMeta | null;

  // Analysis
  contrastMatrix: ContrastMatrixResource | null;
  contrastState: LoadState;
  contrastError: AppError | null;
  colorblindMode: ColorblindMode;

  explanation: PaletteExplanationResource | null;
  explanationState: LoadState;
  explanationError: AppError | null;

  // Export
  exportOpen: boolean;
  exportFormat: CodeExportFormat;
  exportResponse: CodeExportResponse | null;
  exportState: LoadState;
  exportError: AppError | null;

  // UI
  helpOpen: boolean;
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  topBanner: { kind: 'info' | 'warning' | 'error'; message: string } | null;
  toast: { kind: 'info' | 'success' | 'error'; message: string } | null;

  // Setters / actions
  setPalette: (p: PaletteResource | null) => void;
  setPaletteLoading: () => void;
  setPaletteError: (e: AppError) => void;
  toggleLock: (i: number) => void;
  setFocusedIndex: (i: number | null) => void;

  setSeed: (s: string) => void;
  setMode: (m: ThemeMode) => void;
  setHarmonyHint: (h: HarmonyHint) => void;
  setMinQuality: (q: number) => void;
  setGenerationMeta: (m: GenerationMeta | null) => void;

  setContrastMatrix: (m: ContrastMatrixResource | null) => void;
  setContrastLoading: () => void;
  setContrastError: (e: AppError) => void;
  cycleColorblind: (direction?: 1 | -1) => void;

  setExplanation: (e: PaletteExplanationResource | null) => void;
  setExplanationLoading: () => void;
  setExplanationError: (e: AppError) => void;

  setExportOpen: (open: boolean) => void;
  setExportFormat: (f: CodeExportFormat) => void;
  setExportResponse: (r: CodeExportResponse | null) => void;
  setExportLoading: () => void;
  setExportError: (e: AppError) => void;

  toggleHelp: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: () => void;
  setTopBanner: (b: AppState['topBanner']) => void;
  showToast: (t: AppState['toast']) => void;
}

import { COLORBLIND_MODES } from '@/types/api';
import { randomSeed } from '@/lib/seed';

export const useStore = create<AppState>((set, get) => ({
  palette: null,
  paletteState: 'default',
  paletteError: null,
  locked: [false, false, false, false, false],
  focusedIndex: null,

  seed: randomSeed(),
  mode: 'dark',

  harmonyHint: 'auto',
  minQuality: 0,
  generationMeta: null,

  contrastMatrix: null,
  contrastState: 'default',
  contrastError: null,
  colorblindMode: 'none',

  explanation: null,
  explanationState: 'default',
  explanationError: null,

  exportOpen: false,
  exportFormat: 'shadcn-globals',
  exportResponse: null,
  exportState: 'default',
  exportError: null,

  helpOpen: false,
  leftPanelOpen: true,
  rightPanelOpen: true,
  bottomPanelOpen: true,
  topBanner: null,
  toast: null,

  setPalette: (p) =>
    set({
      palette: p,
      paletteState: 'default',
      paletteError: null,
      locked: p ? p.colors.map((_, i) => get().locked[i] ?? false) : get().locked,
    }),
  setPaletteLoading: () => set({ paletteState: 'loading', paletteError: null }),
  setPaletteError: (e) => set({ paletteState: 'error', paletteError: e }),
  toggleLock: (i) => {
    const locked = [...get().locked];
    while (locked.length <= i) locked.push(false);
    locked[i] = !locked[i];
    set({ locked });
  },
  setFocusedIndex: (i) => set({ focusedIndex: i }),

  setSeed: (s) => set({ seed: s }),
  setMode: (m) => {
    set({ mode: m });
    document.documentElement.setAttribute('data-theme', m);
  },
  setHarmonyHint: (h) => set({ harmonyHint: h }),
  setMinQuality: (q) => set({ minQuality: Math.max(0, Math.min(100, q)) }),
  setGenerationMeta: (m) => set({ generationMeta: m }),

  setContrastMatrix: (m) =>
    set({ contrastMatrix: m, contrastState: 'default', contrastError: null }),
  setContrastLoading: () => set({ contrastState: 'loading', contrastError: null }),
  setContrastError: (e) => set({ contrastState: 'error', contrastError: e }),
  cycleColorblind: (direction = 1) => {
    const idx = COLORBLIND_MODES.indexOf(get().colorblindMode);
    const next = (idx + direction + COLORBLIND_MODES.length) % COLORBLIND_MODES.length;
    set({ colorblindMode: COLORBLIND_MODES[next] });
  },

  setExplanation: (e) =>
    set({ explanation: e, explanationState: 'default', explanationError: null }),
  setExplanationLoading: () =>
    set({ explanationState: 'loading', explanationError: null }),
  setExplanationError: (e) => set({ explanationState: 'error', explanationError: e }),

  setExportOpen: (open) => set({ exportOpen: open }),
  setExportFormat: (f) => set({ exportFormat: f }),
  setExportResponse: (r) =>
    set({ exportResponse: r, exportState: 'default', exportError: null }),
  setExportLoading: () => set({ exportState: 'loading', exportError: null }),
  setExportError: (e) => set({ exportState: 'error', exportError: e }),

  toggleHelp: () => set({ helpOpen: !get().helpOpen }),
  toggleLeftPanel: () => set({ leftPanelOpen: !get().leftPanelOpen }),
  toggleRightPanel: () => set({ rightPanelOpen: !get().rightPanelOpen }),
  toggleBottomPanel: () => set({ bottomPanelOpen: !get().bottomPanelOpen }),
  setTopBanner: (b) => set({ topBanner: b }),
  showToast: (t) => {
    set({ toast: t });
    if (t) {
      setTimeout(() => {
        if (get().toast === t) set({ toast: null });
      }, 2000);
    }
  },
}));

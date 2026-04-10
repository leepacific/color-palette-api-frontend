// use-url-sync — bidirectional URL <-> store sync for Flow D (URL seed round-trip).
// PRD §4 route spec:  /?seed=XXX&locked=0,2&mode=dark
// PRD §5 Flow D:      share exact palette by URL, byte-identical round-trip
// PRD §7 Tier 1 #6:   URL seed round-trip byte-identical (blocking)
//
// Behavior:
//   - On mount: parse ?seed, ?locked, ?mode. Validate. Seed the store BEFORE the
//     first regeneratePalette effect fires. Invalid values are ignored silently
//     (app falls back to random seed / defaults).
//   - On store change (seed / locked / mode): replaceState the URL so the back
//     button is not polluted with every regenerate press.

import { useEffect, useRef } from 'react';
import { useStore } from '@/state/store';
import type { ThemeMode } from '@/state/store';
import { isValidSeed } from '@/lib/seed';
import { HARMONY_HINTS } from '@/types/api';
import type { HarmonyHint } from '@/types/api';

const LOCKED_COUNT = 5;

function parseLocked(raw: string | null): boolean[] | null {
  if (!raw) return null;
  const indices = raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => Number.parseInt(s, 10))
    .filter((n) => Number.isInteger(n) && n >= 0 && n < LOCKED_COUNT);
  if (indices.length === 0) return null;
  const out = new Array<boolean>(LOCKED_COUNT).fill(false);
  for (const i of indices) out[i] = true;
  return out;
}

function parseMode(raw: string | null): ThemeMode | null {
  if (raw === 'dark' || raw === 'light') return raw;
  return null;
}

function parseHarmony(raw: string | null): HarmonyHint | null {
  if (!raw) return null;
  if ((HARMONY_HINTS as readonly string[]).includes(raw)) return raw as HarmonyHint;
  return null;
}

function parseMinQuality(raw: string | null): number | null {
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  if (Number.isNaN(n) || n < 0 || n > 100) return null;
  return n;
}

/**
 * Serialize the current store slice into a URL, preserving any unrelated
 * query params. Omits default values (mode=dark, empty locked) to keep URLs
 * short and matching the PRD example shape.
 */
export function buildUrlFromState(
  base: string,
  seed: string,
  locked: boolean[],
  mode: ThemeMode,
  harmony?: HarmonyHint,
  minQuality?: number,
): string {
  const url = new URL(base);
  if (seed && isValidSeed(seed)) {
    url.searchParams.set('seed', seed);
  } else {
    url.searchParams.delete('seed');
  }
  const lockedIndices = locked
    .map((v, i) => (v ? i : -1))
    .filter((i) => i >= 0);
  if (lockedIndices.length > 0) {
    url.searchParams.set('locked', lockedIndices.join(','));
  } else {
    url.searchParams.delete('locked');
  }
  if (mode !== 'dark') {
    url.searchParams.set('mode', mode);
  } else {
    url.searchParams.delete('mode');
  }
  // Sprint 2: harmony + minQuality — omit defaults to keep URLs short.
  if (harmony && harmony !== 'auto') {
    url.searchParams.set('harmony', harmony);
  } else {
    url.searchParams.delete('harmony');
  }
  if (minQuality && minQuality > 0) {
    url.searchParams.set('minQuality', String(minQuality));
  } else {
    url.searchParams.delete('minQuality');
  }
  return url.toString();
}

/**
 * Read + apply URL query params into the store. Returns true if any valid
 * param was applied, false otherwise. Exported for unit tests.
 */
export function applyUrlToStore(search: string): {
  seedApplied: boolean;
  lockedApplied: boolean;
  modeApplied: boolean;
  harmonyApplied: boolean;
  minQualityApplied: boolean;
} {
  const params = new URLSearchParams(search);
  const store = useStore.getState();

  const rawSeed = params.get('seed');
  const seedApplied = !!(rawSeed && isValidSeed(rawSeed));
  if (seedApplied && rawSeed) {
    store.setSeed(rawSeed);
  }

  const lockedArr = parseLocked(params.get('locked'));
  const lockedApplied = lockedArr !== null;
  if (lockedArr) {
    // Apply by diffing against current locked state.
    const current = store.locked;
    for (let i = 0; i < LOCKED_COUNT; i++) {
      if ((current[i] ?? false) !== lockedArr[i]) store.toggleLock(i);
    }
  }

  const mode = parseMode(params.get('mode'));
  const modeApplied = mode !== null;
  if (mode) {
    store.setMode(mode);
  }

  // Sprint 2: harmony + minQuality URL params.
  const harmony = parseHarmony(params.get('harmony'));
  const harmonyApplied = harmony !== null;
  if (harmony) {
    store.setHarmonyHint(harmony);
  }

  const minQuality = parseMinQuality(params.get('minQuality'));
  const minQualityApplied = minQuality !== null;
  if (minQuality !== null) {
    store.setMinQuality(minQuality);
  }

  return { seedApplied, lockedApplied, modeApplied, harmonyApplied, minQualityApplied };
}

/**
 * useUrlSync — call once at app root (or GeneratorPage mount). Parses the URL
 * once on first mount, then subscribes to the relevant store slices and
 * replaceState's the URL whenever they change.
 */
export function useUrlSync(): void {
  const didParseRef = useRef(false);

  // On mount: parse URL BEFORE any regenerate effect fires elsewhere.
  // useRef gate so React 18 StrictMode double-invoke doesn't re-apply.
  if (!didParseRef.current && typeof window !== 'undefined') {
    didParseRef.current = true;
    applyUrlToStore(window.location.search);
  }

  // Subscribe to seed/locked/mode/harmony/minQuality changes and replaceState the URL.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const unsubscribe = useStore.subscribe((state, prev) => {
      if (
        state.seed === prev.seed &&
        state.locked === prev.locked &&
        state.mode === prev.mode &&
        state.harmonyHint === prev.harmonyHint &&
        state.minQuality === prev.minQuality
      ) {
        return;
      }
      const next = buildUrlFromState(
        window.location.href,
        state.seed,
        state.locked,
        state.mode,
        state.harmonyHint,
        state.minQuality,
      );
      if (next !== window.location.href) {
        window.history.replaceState(null, '', next);
      }
    });
    return () => {
      unsubscribe();
    };
  }, []);
}

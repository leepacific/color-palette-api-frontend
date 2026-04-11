// Bridge: store + api client + error taxonomy → UX side effects.

import { api, ApiError } from './api-client';
import type { PaletteGenerateRequest } from './api-client';
import { useStore } from '@/state/store';
import { randomSeed } from '@/lib/seed';
import type { CodeExportFormat } from '@/types/api';

function toAppError(e: unknown, fallbackType = 'api_error'): {
  type: string;
  code: string;
  message: string;
  requestId: string;
} {
  if (e instanceof ApiError) {
    return {
      type: e.envelope.error.type,
      code: e.envelope.error.code,
      message: e.envelope.error.message,
      requestId: e.envelope.error.requestId,
    };
  }
  const msg = e instanceof Error ? e.message : String(e);
  return { type: fallbackType, code: 'UNKNOWN', message: msg, requestId: 'req_local' };
}

function handleError(err: unknown) {
  const appErr = toAppError(err);
  const store = useStore.getState();
  switch (appErr.type) {
    case 'authentication_error':
      store.setTopBanner({
        kind: 'error',
        message: 'api key invalid · check .env or request new key',
      });
      break;
    case 'rate_limit_error':
      store.showToast({
        kind: 'error',
        message: `rate limited · retry in a moment`,
      });
      break;
    case 'quota_exceeded_error':
      store.setTopBanner({
        kind: 'warning',
        message: `quota exceeded · resets later today`,
      });
      break;
    case 'service_unavailable_error':
      store.setTopBanner({
        kind: 'warning',
        message: 'service temporarily unavailable · retry in a moment',
      });
      break;
    default:
      store.showToast({
        kind: 'error',
        message: `${appErr.message} · ${appErr.requestId}`,
      });
  }
  return appErr;
}

export async function regeneratePalette(seed?: string) {
  const store = useStore.getState();
  // Flow D (PRD §5): every regenerate must land a concrete seed in the store
  // so the URL sync hook can round-trip it. If the caller did not specify a
  // seed (e.g. keyboard `r`), mint a fresh one client-side and pass it to the
  // API — this guarantees the backend response + URL + store agree.
  const requestSeed = seed ?? randomSeed();
  // FB-011: Preserve locked colors through regenerate.
  const prevColors = store.palette?.colors;
  const lockedFlags = store.locked;
  store.setPaletteLoading();
  try {
    // CB-003 fix: switched from /theme/generate to /palette/generate.
    // The seeded path now runs a deterministic quality loop (same seed →
    // same qualifying palette), so URL round-trip (Flow D) works.
    // All FB-009 quality gates (intra-ΔE ≥ 15, composite ≥ minScore)
    // apply on this path.
    const reqBody: PaletteGenerateRequest = {
      count: 5,
      seed: requestSeed,
    };
    if (store.harmonyHint !== 'auto') {
      reqBody.harmony = store.harmonyHint;
    }
    if (store.minQuality > 0) {
      reqBody.minScore = store.minQuality;
    }
    const pal = await api.generatePalette(reqBody);
    // Stitch locked colors back into the new palette at their original indices.
    if (prevColors && lockedFlags.some(Boolean)) {
      pal.colors = pal.colors.map((c, i) =>
        lockedFlags[i] && prevColors[i] ? prevColors[i] : c,
      );
    }
    store.setPalette(pal);
    store.setGenerationMeta(pal.generationMeta ?? null);
    const nextSeed = pal.seed ?? requestSeed;
    if (nextSeed !== store.seed) {
      store.setSeed(nextSeed);
    }
    const hexes = pal.colors.map((c) => c.hex);
    void refreshContrastMatrix(hexes);
    void refreshExplanation(hexes, nextSeed);
  } catch (err) {
    const appErr = handleError(err);
    store.setPaletteError(appErr);
  }
}

export async function refreshContrastMatrix(palette: string[]) {
  const store = useStore.getState();
  store.setContrastLoading();
  try {
    const res = await api.contrastMatrix(palette);
    store.setContrastMatrix(res);
  } catch (err) {
    const appErr = handleError(err);
    store.setContrastError(appErr);
  }
}

export async function refreshExplanation(palette: string[], seed?: string) {
  const store = useStore.getState();
  store.setExplanationLoading();
  try {
    const res = await api.explain(palette, seed);
    store.setExplanation(res);
  } catch (err) {
    const appErr = handleError(err);
    store.setExplanationError(appErr);
  }
}

export async function exportCurrentFormat(format: CodeExportFormat) {
  const store = useStore.getState();
  const pal = store.palette;
  if (!pal) {
    store.showToast({ kind: 'error', message: 'no palette to export' });
    return;
  }
  store.setExportLoading();
  try {
    const res = await api.exportCode({
      format,
      theme: { primary: pal.colors[0].hex },
      mode: 'both',
      seed: store.seed,
    });
    store.setExportResponse(res);
  } catch (err) {
    const appErr = handleError(err);
    store.setExportError(appErr);
  }
}

export async function copyText(text: string, label = 'copied') {
  const store = useStore.getState();
  try {
    await navigator.clipboard.writeText(text);
    store.showToast({ kind: 'success', message: label });
  } catch {
    store.showToast({ kind: 'error', message: 'copy failed · select manually' });
  }
}

export function copyCurrentUrl() {
  const store = useStore.getState();
  const url = window.location.href;
  void copyText(url, 'url copied');
  // satisfy the linter
  void store;
}

// Bridge: store + api client + error taxonomy → UX side effects.

import { api, ApiError } from './api-client';
import { useStore } from '@/state/store';
import { randomSeed } from '@/lib/seed';
import { seedToPrimary } from '@/lib/seed-to-primary';
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
  // FB-009 — Derive a dramatic primary deterministically from the seed on
  // every regenerate. The backend's seed-driven OKLCH perturbation (FB-008)
  // is too subtle on low-chroma inputs like the old default #0F172A, so we
  // make the primary itself vary per seed. URL round-trip still works because
  // the primary is a pure function of the seed — loading /?seed=XYZ on a
  // fresh session will derive the identical primary and hit the same backend
  // branch, producing the byte-identical palette required by PRD Tier 1 #6.
  const requestPrimary = seedToPrimary(requestSeed);
  store.setPaletteLoading();
  try {
    const pal = await api.generateTheme({
      primary: requestPrimary,
      mode: 'both',
      semanticTokens: true,
      seed: requestSeed,
    });
    store.setPalette(pal);
    // Prefer the backend-returned seed (authoritative); fall back to the
    // request seed (always defined). Guaranteed non-null.
    const nextSeed = pal.seed ?? requestSeed;
    if (nextSeed !== store.seed) {
      store.setSeed(nextSeed);
    }
    // Fire and forget the 2 analysis calls.
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

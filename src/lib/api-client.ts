// API client — hand-written fetch wrapper (~80 lines)
// Injects X-API-Key + Request-Id + Idempotency-Key.
// Parses Stripe-style envelope. Throws typed ApiError on error envelope.

import type {
  ApiErrorEnvelope,
  CodeExportRequest,
  CodeExportResponse,
  ContrastMatrixResource,
  PaletteExplanationResource,
  PaletteResource,
  ThemeBundleResource,
} from '@/types/api';
import { themeBundleToPaletteResource } from './theme-bundle';

const BASE_URL =
  (import.meta.env.VITE_COLOR_PALETTE_API_BASE_URL as string | undefined) ??
  'https://color-palette-api-production-a68b.up.railway.app';

const API_KEY =
  (import.meta.env.VITE_COLOR_PALETTE_API_DEV_KEY as string | undefined) ?? '';

export class ApiError extends Error {
  public readonly envelope: ApiErrorEnvelope;
  constructor(envelope: ApiErrorEnvelope) {
    super(envelope.error.message);
    this.name = 'ApiError';
    this.envelope = envelope;
  }
  get type() {
    return this.envelope.error.type;
  }
  get code() {
    return this.envelope.error.code;
  }
  get requestId() {
    return this.envelope.error.requestId;
  }
}

// Crockford Base32 ULID-style ID (26 chars) — client-generated request id
function makeRequestId(): string {
  const alphabet = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  let out = 'req_';
  for (let i = 0; i < 26; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

function makeIdempotencyKey(): string {
  return `idem_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { idempotent?: boolean } = {},
): Promise<T> {
  const { idempotent, ...rest } = init;
  const headers = new Headers(rest.headers);
  headers.set('X-API-Key', API_KEY);
  headers.set('Request-Id', makeRequestId());
  if (init.method && init.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
    if (idempotent) headers.set('Idempotency-Key', makeIdempotencyKey());
  }
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const r = await fetch(url, { ...rest, headers });
  const text = await r.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      throw new ApiError({
        object: 'error',
        error: {
          type: 'api_error',
          code: 'INVALID_JSON_RESPONSE',
          message: 'Server returned non-JSON response',
          docUrl: '',
          requestId: headers.get('Request-Id') ?? '',
        },
      });
    }
  }
  if (!r.ok) {
    throw new ApiError(body as ApiErrorEnvelope);
  }
  return body as T;
}

export interface ThemeGenerateRequest {
  primary?: string;
  mode?: 'light' | 'dark' | 'both';
  semanticTokens?: boolean;
  seed?: string;
}

export const api = {
  async randomPalette(): Promise<PaletteResource> {
    return apiFetch<PaletteResource>('/api/v1/palette/random');
  },
  // Loop 3 FR-4: /theme/generate returns ThemeBundleResource (not PaletteResource).
  // We fetch the raw themeBundle, then adapt it to a PaletteResource at the
  // boundary so all 11 Sprint 1 consumer sites (swatch grid, contrast matrix,
  // explain panel, keyboard shortcuts, export flow) keep working untouched.
  // See src/lib/theme-bundle.ts for the adapter design rationale.
  async generateTheme(req: ThemeGenerateRequest): Promise<PaletteResource> {
    const bundle = await apiFetch<ThemeBundleResource>('/api/v1/theme/generate', {
      method: 'POST',
      body: JSON.stringify(req),
      idempotent: true,
    });
    return themeBundleToPaletteResource(bundle);
  },
  async exportCode(req: CodeExportRequest): Promise<CodeExportResponse> {
    return apiFetch<CodeExportResponse>('/api/v1/export/code', {
      method: 'POST',
      body: JSON.stringify(req),
      idempotent: true,
    });
  },
  async contrastMatrix(palette: string[]): Promise<ContrastMatrixResource> {
    return apiFetch<ContrastMatrixResource>('/api/v1/analyze/contrast-matrix', {
      method: 'POST',
      body: JSON.stringify({ palette, includeColorblind: true, severity: 0.6 }),
    });
  },
  async explain(
    palette: string[],
    seed?: string,
  ): Promise<PaletteExplanationResource> {
    return apiFetch<PaletteExplanationResource>('/api/v1/analyze/explain', {
      method: 'POST',
      body: JSON.stringify({ palette, seed, harmonyType: 'auto' }),
    });
  },
};

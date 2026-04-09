// MSW handlers — implements the 4 Sprint 6 endpoints + palette/random.
// Reference: docs/frontend-handoff.md §2 + Sprint 6 Amendment.

import { http, HttpResponse, delay } from 'msw';
import {
  stubCodeExport,
  stubContrastMatrix,
  stubExplanation,
  stubPalette,
} from './stub-data';

const HOSTS = [
  'https://color-palette-api-production-a68b.up.railway.app',
  'http://localhost:3000',
  '', // relative URLs
];

function anyHost(path: string) {
  return HOSTS.map((h) => `${h}${path}`);
}

export const handlers = [
  // palette/random
  ...anyHost('/api/v1/palette/random').map((url) =>
    http.get(url, async () => {
      await delay(150);
      return HttpResponse.json(stubPalette());
    }),
  ),

  // theme/generate (Sprint 6 extended with semanticTokens + seed)
  ...anyHost('/api/v1/theme/generate').map((url) =>
    http.post(url, async ({ request }) => {
      const body = (await request.json()) as {
        primary?: string;
        seed?: string;
        semanticTokens?: boolean;
      };
      await delay(180);
      return HttpResponse.json(stubPalette({ seed: body?.seed }));
    }),
  ),

  // export/code (Sprint 6 new)
  ...anyHost('/api/v1/export/code').map((url) =>
    http.post(url, async ({ request }) => {
      const body = (await request.json()) as { format?: string };
      await delay(120);
      if (!body?.format) {
        return HttpResponse.json(
          {
            object: 'error',
            error: {
              type: 'invalid_request_error',
              code: 'INVALID_FORMAT',
              message: 'format is required',
              param: 'format',
              docUrl: '',
              requestId: 'req_stub',
            },
          },
          { status: 400 },
        );
      }
      return HttpResponse.json(stubCodeExport(body.format));
    }),
  ),

  // analyze/contrast-matrix (Sprint 6 new)
  ...anyHost('/api/v1/analyze/contrast-matrix').map((url) =>
    http.post(url, async ({ request }) => {
      const body = (await request.json()) as { palette?: string[] };
      await delay(140);
      const palette = body?.palette ?? [];
      return HttpResponse.json(stubContrastMatrix(palette));
    }),
  ),

  // analyze/explain (Sprint 6 new)
  ...anyHost('/api/v1/analyze/explain').map((url) =>
    http.post(url, async ({ request }) => {
      const body = (await request.json()) as { palette?: string[]; seed?: string };
      await delay(160);
      return HttpResponse.json(stubExplanation(body?.palette ?? [], body?.seed));
    }),
  ),
];

// Flow A — MSW-off live smoke (Loop 3 FR-4 regression guard).
//
// Runs against a Vite dev server started with VITE_USE_MSW=false so the
// browser hits the real Railway backend. Verifies the themeBundle → palette
// adapter works end-to-end: page loads, regenerate succeeds, no runtime
// "Cannot read properties of undefined (reading 'hex')" errors.
//
// This test is explicitly OUT of the default playwright.config.ts project list
// so CI runs MSW-on by default. Invoke with:
//   VITE_USE_MSW=false npx playwright test tests/flow-a-live.spec.ts \
//     --config=playwright.live.config.ts
// or via the npm script added in package.json.

import { test, expect } from '@playwright/test';

const SEED_REGEX = /^[0-9A-HJKMNP-TV-Z]{13}$/;

test.describe('Flow A — live backend smoke (MSW off)', () => {
  test('page loads + regenerate + no console errors against live API', async ({
    page,
  }) => {
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => consoleErrors.push(String(err)));
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Wait for the initial palette fetch to complete. The title "cpa [SEED]"
    // only settles once the store has a real seed from the adapter output.
    await expect
      .poll(
        async () => {
          const title = await page.title();
          const m = title.match(/cpa \[([^\]]+)\]/);
          return m && SEED_REGEX.test(m[1]) ? 'ready' : 'pending';
        },
        { timeout: 15_000, message: 'initial palette fetch did not complete' },
      )
      .toBe('ready');

    // Press `r` to regenerate — exercises generateTheme → adapter → store.
    const firstTitle = await page.title();
    await page.locator('body').focus();
    await page.keyboard.press('r');

    // The title updates when store.seed changes. Poll generously — live
    // Railway API takes 500-1500ms per call.
    await expect
      .poll(
        async () => {
          const title = await page.title();
          return title !== firstTitle ? 'changed' : 'same';
        },
        { timeout: 20_000, intervals: [250, 500, 1000] },
      )
      .toBe('changed');

    const newTitle = await page.title();
    const match = newTitle.match(/cpa \[([^\]]+)\]/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(SEED_REGEX);

    // Critical FR-4 check: no TypeError on colors[].hex access.
    const fatal = consoleErrors.filter((e) =>
      /Cannot read propert|undefined.*hex|TypeError/i.test(e),
    );
    expect(
      fatal,
      `live smoke leaked runtime errors:\n${fatal.join('\n')}`,
    ).toEqual([]);
  });

  test('network smoke — real /theme/generate returns themeBundle and adapter works', async ({
    page,
  }) => {
    const logs: string[] = [];
    const requests: string[] = [];
    page.on('pageerror', (err) => logs.push('PAGEERROR: ' + String(err)));
    page.on('console', (msg) => logs.push('CONSOLE[' + msg.type() + ']: ' + msg.text()));
    page.on('request', (req) => {
      if (req.url().includes('/api/')) requests.push('REQ ' + req.method() + ' ' + req.url());
    });

    let themeResponseBody: any = null;
    page.on('response', async (res) => {
      if (res.url().includes('/api/v1/theme/generate')) {
        try {
          themeResponseBody = await res.json();
        } catch (e) {
          logs.push('RESPONSE_PARSE_ERROR: ' + e);
        }
      }
    });

    await page.goto('/');
    await expect(page.locator('[role="main"]')).toBeVisible();

    // Wait a generous 15s for either theme/generate to happen or fail
    await page.waitForTimeout(8000);

    console.log('\n=== LIVE SMOKE DEBUG ===');
    console.log('API requests seen:', JSON.stringify(requests, null, 2));
    console.log('theme response body keys:', themeResponseBody ? Object.keys(themeResponseBody) : null);
    console.log('themeBundle object field:', themeResponseBody?.object);
    console.log('has primitive:', !!themeResponseBody?.primitive);
    console.log('logs:', logs.join('\n'));

    expect(requests.length, `no API requests seen — MSW may still be on. Logs:\n${logs.join('\n')}`).toBeGreaterThan(0);
    expect(themeResponseBody, `no /theme/generate response captured. Requests:\n${requests.join('\n')}`).not.toBeNull();
    expect(themeResponseBody.object).toBe('themeBundle');
    expect(themeResponseBody.primitive?.primary?.['500']?.hex).toMatch(/^#[0-9A-F]{6}$/i);

    // Verify swatches rendered (proves adapter → store → ComponentPreview worked)
    const swatchButtons = page.locator('button[aria-label*="copy" i]');
    const count = await swatchButtons.count();
    expect(count, `no swatch buttons rendered. Logs:\n${logs.join('\n')}`).toBeGreaterThan(0);

    // No runtime crashes
    const fatal = logs.filter((e) =>
      /PAGEERROR|Cannot read propert|undefined.*hex|TypeError/i.test(e),
    );
    expect(
      fatal,
      `adapter integration leaked runtime errors:\n${fatal.join('\n')}`,
    ).toEqual([]);
  });
});

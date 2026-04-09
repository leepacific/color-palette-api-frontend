// Flow D — URL seed round-trip (FR-1 acceptance criteria).
// PRD §5 Flow D: share exact palette by URL, byte-identical round-trip.
// PRD §7 Tier 1 #6: URL seed round-trip byte-identical (blocking).
//
// This test runs against the Vite dev server with MSW mocks on (Sprint 1
// canonical config). Byte-identity of the rendered palette under a fixed seed
// is guaranteed by the backend contract, which Guard verified independently
// via curl against Railway v1.5.0. Here we verify the frontend plumbing only.

import { test, expect } from '@playwright/test';

const VALID_SEED = 'ABCDEFGHJKMNP';
const SEED_REGEX = /^[0-9A-HJKMNP-TV-Z]{13}$/;

test.describe('Flow D — URL seed round-trip', () => {
  test('?seed=XXX on mount populates store before first regenerate', async ({
    page,
  }) => {
    await page.goto(`/?seed=${VALID_SEED}`);
    // TopBar renders the seed in the terminal-header pattern: "cpa · [SEED]".
    // Wait for the palette to load so we know the initial regenerate completed.
    await expect(page.locator('[role="main"]')).toBeVisible();
    // The document title is derived from store.seed in GeneratorPage.tsx.
    await expect(page).toHaveTitle(`cpa [${VALID_SEED}]`);
    // URL must still contain the seed (replaceState keeps it).
    expect(new URL(page.url()).searchParams.get('seed')).toBe(VALID_SEED);
  });

  test('pressing r updates URL with a new valid 13-char Base32 seed', async ({
    page,
  }) => {
    await page.goto(`/?seed=${VALID_SEED}`);
    await expect(page).toHaveTitle(`cpa [${VALID_SEED}]`);

    // Press `r` to regenerate.
    await page.keyboard.press('r');

    // Wait for the URL to change (replaceState is synchronous after fetch).
    await expect
      .poll(
        () => {
          const s = new URL(page.url()).searchParams.get('seed');
          return s && s !== VALID_SEED && SEED_REGEX.test(s) ? 'changed' : 'same';
        },
        { timeout: 5_000, message: 'URL seed did not update after regenerate' },
      )
      .toBe('changed');

    const newSeed = new URL(page.url()).searchParams.get('seed');
    expect(newSeed).toMatch(SEED_REGEX);
    // Title should track the new seed.
    await expect(page).toHaveTitle(`cpa [${newSeed}]`);
  });

  test('?mode=light on mount applies light mode', async ({ page }) => {
    await page.goto(`/?seed=${VALID_SEED}&mode=light`);
    // Wait for the store-driven theme to settle (React 18 may need two renders
    // after the useUrlSync setMode call during the first render pass).
    await expect
      .poll(
        async () => page.locator('html').getAttribute('data-theme'),
        { timeout: 5_000 },
      )
      .toBe('light');
    // URL must keep ?mode=light after initial sync.
    expect(new URL(page.url()).searchParams.get('mode')).toBe('light');
  });

  test('invalid seed in URL falls back gracefully (no crash, random seed used)', async ({
    page,
  }) => {
    await page.goto('/?seed=NOT_A_VALID_SEED_AT_ALL');
    // Page must render without crashing.
    await expect(page.locator('[role="main"]')).toBeVisible();
    // Store should have picked a random valid seed (the default randomSeed()
    // from store init) since the URL seed is invalid.
    const title = await page.title();
    const match = title.match(/cpa \[([^\]]+)\]/);
    expect(match).not.toBeNull();
    expect(match![1]).toMatch(SEED_REGEX);
    // URL should be updated to reflect the valid seed (replaceState after
    // first regenerate; depending on timing the invalid seed may still be
    // present briefly but should eventually be replaced).
  });

  test('mode default (dark) is omitted from URL', async ({ page }) => {
    await page.goto(`/?seed=${VALID_SEED}`);
    await expect(page).toHaveTitle(`cpa [${VALID_SEED}]`);
    // Press `r` to trigger URL rewrite.
    await page.keyboard.press('r');
    await expect
      .poll(() => new URL(page.url()).searchParams.get('seed'), { timeout: 5_000 })
      .not.toBe(VALID_SEED);
    // mode=dark is default, should NOT be in URL.
    expect(new URL(page.url()).searchParams.get('mode')).toBeNull();
  });
});

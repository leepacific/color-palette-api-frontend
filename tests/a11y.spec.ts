// Loop 5 FR-7..11 — a11y gate.
// Runs @axe-core/playwright against the home route on the MSW-backed dev server
// and asserts zero serious/critical violations. Pins the gate for future loops.

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('home route has no serious/critical a11y violations', async ({ page }) => {
  await page.goto('/');
  // Wait for first regeneration so ColorSwatch (FR-7) is mounted
  await page.waitForSelector('[aria-label*="of 5: hex" i]', { timeout: 10_000 });

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();

  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );

  expect(
    seriousOrCritical,
    `Found ${seriousOrCritical.length} serious/critical violations:\n` +
      JSON.stringify(
        seriousOrCritical.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.length,
          help: v.help,
        })),
        null,
        2,
      ),
  ).toEqual([]);
});

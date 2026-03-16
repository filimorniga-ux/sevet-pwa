import { test, expect } from '@playwright/test';

test('homepage has title and services', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/SEVET/);
  await expect(page.locator('#especialidades')).toBeVisible();
});

import { test, expect } from '@playwright/test';

test('Booking page loads for anonymous user', async ({ page }) => {
  await page.goto('/pages/agendar.html');
  await expect(page.locator('#servicesGrid .loading-spinner')).not.toBeVisible({ timeout: 10000 });
  await expect(page.locator('.service-card-v2').first()).toBeVisible();
});

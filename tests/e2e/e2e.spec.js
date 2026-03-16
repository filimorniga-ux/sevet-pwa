import { test, expect } from '@playwright/test';

test.describe('E2E flows', () => {
  test('Anonymous user: Landing page loads -> Services visible -> Click "Agendar" -> Booking page works', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SEVET/);

    // Check services
    const servicesSection = page.locator('#especialidades');
    await expect(servicesSection).toBeVisible();

    // Click Agendar
    await page.click('text=Agendar');
    await expect(page).toHaveURL(/.*agendar\.html/);

    // Check booking page step 1 is active
    await expect(page.locator('#step1')).toHaveClass(/active/);

    // Wait for services to load
    await expect(page.locator('#servicesGrid .loading-spinner')).not.toBeVisible();
    await expect(page.locator('.service-card-v2').first()).toBeVisible();
  });
});

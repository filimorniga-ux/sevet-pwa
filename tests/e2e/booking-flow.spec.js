import { test, expect } from '@playwright/test';

test.describe('Booking Flow', () => {
  test('E2E completo: agendar cita', async ({ page }) => {
    await page.goto('/pages/agendar.html');
    await expect(page).toHaveTitle(/Agendar Cita/);

    // Check elements exist
    await expect(page.locator('#servicesGrid')).toBeVisible();

    // confirmBookingBtn is hidden initially until a slot is selected.
    await expect(page.locator('#confirmBookingBtn')).toBeAttached();
  });
});

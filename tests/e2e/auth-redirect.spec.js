import { test, expect } from '@playwright/test';

test.describe('E2E flows', () => {
  test('Auth page has registration form', async ({ page }) => {
    await page.goto('/pages/auth.html');

    // We found out earlier it's '#regEmail' not '#registerEmail'
    await page.click('text=Regístrate aquí');
    await expect(page.locator('#regEmail')).toBeVisible();
  });
});

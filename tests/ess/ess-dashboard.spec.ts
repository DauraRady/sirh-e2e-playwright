import { test, expect } from '@playwright/test';

test.describe('ESS - Dashboard Access', () => {
  test('should display dashboard for ESS user', async ({ page }) => {
    await page.goto('dashboard/index');
    await page.waitForLoadState('networkidle');

    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  });

  test('should not show Admin menu item for ESS user', async ({ page }) => {
    await page.goto('dashboard/index');
    await page.waitForLoadState('networkidle');

    // ESS users should see limited sidebar — no Admin module
    await expect(page.getByRole('link', { name: 'My Info' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible();
  });
});

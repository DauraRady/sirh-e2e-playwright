import { test, expect } from '@playwright/test';

test.describe('ESS - Restricted Access', () => {
  test('should show Credential Required when ESS user accesses admin module', async ({ page }) => {
    await page.goto('admin/viewSystemUsers');
    await page.waitForLoadState('networkidle');

    // ESS user can reach the URL but OrangeHRM blocks with "Credential Required"
    await expect(page.getByText('Credential Required')).toBeVisible();
  });

  test('should not show Admin or PIM in ESS sidebar', async ({ page }) => {
    await page.goto('dashboard/index');
    await page.waitForLoadState('networkidle');

    // ESS sidebar should NOT contain admin-only modules
    await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'PIM' })).not.toBeVisible();
    await expect(page.getByRole('link', { name: 'Recruitment' })).not.toBeVisible();

    // But should contain ESS-allowed modules
    await expect(page.getByRole('link', { name: 'My Info' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Leave' })).toBeVisible();
  });
});

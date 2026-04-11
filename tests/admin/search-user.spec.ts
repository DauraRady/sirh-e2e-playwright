import { test, expect } from '../../fixtures/base.fixture';

test.describe('Admin - Search User', () => {
  test('should find admin user when searching by username', async ({ adminPage, page }) => {
    await adminPage.searchUser({ username: 'Admin' });

    await test.step('Verify search results', async () => {
      await expect(page.getByText('Record Found')).toBeVisible();

      const adminRow = adminPage.getUserRow('Admin');
      await expect(adminRow.container).toBeVisible();
      await expect(adminRow.role).toHaveText('Admin');
      await expect(adminRow.status).toHaveText('Enabled');
    });
  });

  test('should display no records message when searching non-existent user', async ({ adminPage, page }) => {
    await adminPage.searchUser({ username: 'nonexistent_user_xyz_999' });

    await test.step('Verify empty results', async () => {
      await expect(page.locator('span').filter({ hasText: 'No Records Found' })).toBeVisible();

      // Verify table has only header row
      await expect.poll(
        async () => await page.locator('.oxd-table-card').count(),
        { message: 'Expected no data rows in table' },
      ).toBe(0);
    });
  });
});

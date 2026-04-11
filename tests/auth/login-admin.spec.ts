import { test, expect } from '../../fixtures/base.fixture';
import { USERS } from '../../fixtures/test-data';

test.describe('Admin Login', () => {
  test('should redirect admin to dashboard after valid login', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(USERS.admin.username, USERS.admin.password);

    await test.step('Verify dashboard loaded', async () => {
      await expect(page).toHaveURL(/.*dashboard\/index/);
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });
  });
});

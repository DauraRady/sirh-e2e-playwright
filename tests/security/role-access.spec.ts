import { test, expect } from '../../fixtures/base.fixture';
import { USERS } from '../../fixtures/test-data';

test.describe('Security - Role-Based Access', () => {
  test('should not allow unauthenticated user to access dashboard', async ({ page }) => {
    await page.goto('dashboard/index');

    await test.step('Verify redirect to login', async () => {
      await expect(page).toHaveURL(/.*auth\/login/);
      await expect(page.getByPlaceholder('Username')).toBeVisible();
    });
  });

  test('should redirect to login page after accessing protected route without session', async ({ page }) => {
    await page.goto('admin/viewSystemUsers');

    await test.step('Verify redirect to login', async () => {
      await expect(page).toHaveURL(/.*auth\/login/);
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });
  });

  test('should allow admin to access admin module after login', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login(USERS.admin.username, USERS.admin.password);

    await test.step('Navigate to Admin and verify access', async () => {
      await Promise.all([
        page.waitForLoadState('networkidle'),
        page.getByRole('link', { name: 'Admin' }).click(),
      ]);

      await expect(page).toHaveURL(/.*admin\/viewSystemUsers/);
      await expect(page.getByRole('heading', { name: 'System Users' })).toBeVisible();
    });
  });
});

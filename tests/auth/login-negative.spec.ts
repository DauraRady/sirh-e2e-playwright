import { test, expect } from '../../fixtures/base.fixture';

test.describe('Login - Negative Cases', () => {
  test('should display error message with invalid credentials', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('Admin', 'wrongpassword');

    await test.step('Verify error state', async () => {
      await expect(loginPage.getErrorMessage()).toBeVisible();
      await expect(page.getByText('Invalid credentials')).toBeVisible();
      await expect(page).toHaveURL(/.*auth\/login/);
    });
  });

  test('should display error message with invalid username', async ({ loginPage, page }) => {
    await loginPage.goto();
    await loginPage.login('InvalidUser', 'admin123');

    await test.step('Verify error state', async () => {
      await expect(loginPage.getErrorMessage()).toBeVisible();
      await expect(page.getByText('Invalid credentials')).toBeVisible();
      await expect(page).toHaveURL(/.*auth\/login/);
    });
  });

  test('should display required error when username is empty', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('', 'admin123');

    await expect(loginPage.getRequiredError()).toBeVisible();
  });

  test('should display required error when password is empty', async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login('Admin', '');

    await expect(loginPage.getRequiredError()).toBeVisible();
  });
});

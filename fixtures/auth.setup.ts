import { test as setup, expect } from '@playwright/test';
import { USERS } from './test-data';

setup('authenticate as admin', async ({ page }) => {
  await page.goto('auth/login');
  await page.getByPlaceholder('Username').fill(USERS.admin.username);
  await page.getByPlaceholder('Password').fill(USERS.admin.password);

  await Promise.all([
    page.waitForURL('**/dashboard/index'),
    page.getByRole('button', { name: 'Login' }).click(),
  ]);

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: '.auth/admin.json' });
});

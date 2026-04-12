import { test, expect } from '../../fixtures/base.fixture';
import fs from 'fs';
import path from 'path';

const credentialsPath = path.join(__dirname, '../../.auth/ess-credentials.json');

test.describe('Security - ESS Access Restrictions', () => {
  test('should not allow ESS user to access admin module via login', async ({ loginPage, page }) => {
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);

    await test.step('Verify ESS user cannot see Admin in sidebar', async () => {
      await expect(page).toHaveURL(/.*dashboard\/index/);
      await expect(page.getByRole('link', { name: 'My Info' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Admin' })).not.toBeVisible();
    });
  });
});

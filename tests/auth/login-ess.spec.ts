import { test, expect } from '../../fixtures/base.fixture';
import fs from 'fs';
import path from 'path';

const credentialsPath = path.join(__dirname, '../../.auth/ess-credentials.json');

test.describe('ESS Login', () => {
  test('should redirect ESS user to dashboard after valid login', async ({ loginPage, page }) => {
    // Read ESS credentials created by auth.setup.ts
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf-8'));

    await loginPage.goto();
    await loginPage.login(credentials.username, credentials.password);

    await test.step('Verify ESS dashboard loaded', async () => {
      await expect(page).toHaveURL(/.*dashboard\/index/);
      await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    });
  });
});

import { test, expect } from '../../fixtures/base.fixture';
import { USERS } from '../../fixtures/test-data';

test.describe('ESS Login', () => {
  test.skip('should redirect ESS user to dashboard after valid login', async ({ loginPage, page }) => {
    // TODO: requires an ESS user account to be created in setup
    await loginPage.goto();
    await loginPage.login('ess_user', 'password');
    await expect(page).toHaveURL(/.*dashboard\/index/);
  });
});

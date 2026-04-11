import { test, expect } from '../../fixtures/base.fixture';

test.describe('Security - ESS Access Restrictions', () => {
  test.skip('should not allow ESS user to access admin module', async ({ page }) => {
    // TODO: requires ESS user storageState
    // ESS users should be redirected when accessing /admin/viewSystemUsers
  });
});

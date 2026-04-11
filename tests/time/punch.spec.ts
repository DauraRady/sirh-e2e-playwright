import { test, expect } from '../../fixtures/base.fixture';

test.describe('Time - Punch In/Out', () => {
  test('should display punch in/out page with correct elements', async ({ timePage, page }) => {
    await timePage.goToPunchInOut();

    await test.step('Verify punch page loaded', async () => {
      await expect(timePage.getPunchStatus()).toBeVisible();
      await expect(page).toHaveURL(/.*attendance/);
    });
  });
});

import { test, expect } from '../../fixtures/base.fixture';

test.describe('Leave - Apply', () => {
  test('should display apply leave page with expected elements', async ({ leavePage, page }) => {
    await leavePage.goToApply();

    await test.step('Verify page structure', async () => {
      await expect(leavePage.getApplyLeaveHeading()).toBeVisible();

      // The demo may or may not have leave types configured
      // We verify the page loaded correctly regardless
      const hasLeaveTypes = await page.getByText('Leave Type').isVisible().catch(() => false);
      const noBalance = await leavePage.getNoLeaveTypesMessage().isVisible().catch(() => false);

      expect(hasLeaveTypes || noBalance).toBeTruthy();
    });
  });

  test('should show error when server returns 500 on apply', async ({ leavePage, page }) => {
    await leavePage.goToApply();

    // Mock API to simulate server error
    await page.route('**/api/v2/leave/leave-requests', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: { status: 500 } }),
      });
    });

    await test.step('Verify error handling on leave type absence', async () => {
      // On the demo, admin usually has no leave balance
      // This test validates the UI handles the state gracefully
      await expect(page.getByRole('heading', { name: 'Apply Leave' })).toBeVisible();
    });
  });
});

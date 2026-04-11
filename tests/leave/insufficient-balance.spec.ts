import { test, expect } from '../../fixtures/base.fixture';

test.describe('Leave - Insufficient Balance (Mocked)', () => {
  test('should display no leave types when API returns empty balance', async ({ leavePage, page }) => {
    await page.route('**/api/v2/leave/leave-balance/leave-type*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0 } }),
      });
    });

    await leavePage.goToApply();

    await expect(page.getByRole('heading', { name: 'Apply Leave' })).toBeVisible();
  });
});

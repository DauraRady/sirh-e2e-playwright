import { test, expect } from '../../fixtures/base.fixture';
import { PimPage } from '../../pages/PimPage';

test.describe('PIM - Search Employee', () => {
  test('should display no records when searching non-existent employee', async ({ pimPage, page }) => {
    await pimPage.searchEmployee('NonExistentPerson99999');

    await expect(page.locator('span').filter({ hasText: 'No Records Found' })).toBeVisible();
  });
});

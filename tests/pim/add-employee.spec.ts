import { test, expect } from '../../fixtures/base.fixture';

test.describe('PIM - Add Employee', () => {
  test('should successfully add a new employee', async ({ pimPage, page }) => {
    const firstName = `QA${Date.now()}`;
    const lastName = 'AutoTest';

    await pimPage.addEmployee({ firstName, lastName });

    await test.step('Verify employee was saved', async () => {
      const outcome = await Promise.race([
        page.getByText('Successfully Saved').waitFor().then(() => 'success' as const),
        page.getByText('Employee Id already exists').waitFor().then(() => 'duplicate' as const),
      ]);
      expect(outcome).toBe('success');
    });

    await test.step('Verify redirect to employee details', async () => {
      // After creation, OrangeHRM redirects to the employee's Personal Details page
      await expect(page.getByRole('heading', { name: 'Personal Details' })).toBeVisible();
      await expect(page.getByPlaceholder('First Name')).toHaveValue(firstName);
      await expect(page.getByPlaceholder('Last Name')).toHaveValue(lastName);
    });
  });
});

import { test, expect } from '../../fixtures/base.fixture';
import { createTestUser, deleteTestUser } from '../../helpers/user.helper';

test.describe('Admin - Delete User', () => {
  test('should successfully delete an existing user', async ({ adminPage, page }) => {
    // ARRANGE — create a user to delete
    const { username } = await createTestUser(page);

    try {
      await test.step('Search for created user', async () => {
        await adminPage.goto();
        await adminPage.searchUser({ username });

        // Poll until the user appears in results (demo can be slow)
        await expect.poll(
          async () => await page.getByRole('row', { name: username }).count(),
          { timeout: 15_000, message: `Waiting for user "${username}" in search results` },
        ).toBeGreaterThan(0);
      });

      await test.step('Delete user and verify', async () => {
        await adminPage.deleteUser(username);

        const outcome = await Promise.race([
          page.getByText('Successfully Deleted').waitFor().then(() => 'deleted' as const),
          page.getByText('Error').waitFor().then(() => 'error' as const),
        ]);
        expect(outcome).toBe('deleted');
      });
    } finally {
      // Best-effort cleanup if delete failed
      await deleteTestUser(page, username);
    }
  });
});

import { test, expect } from '../../fixtures/base.fixture';
import { uniqueUsername } from '../../fixtures/test-data';
import { deleteTestUser } from '../../helpers/user.helper';

test.describe('Admin - Add User', () => {
  test('should successfully create a new user with ESS role', async ({ adminPage, page }) => {
    const username = uniqueUsername('adduser');

    try {
      await adminPage.addUser({ employeeName: 'a', username });

      await test.step('Verify user was created', async () => {
        // Promise.race — detect success or error toast
        const outcome = await Promise.race([
          page.getByText('Successfully Saved').waitFor().then(() => 'success' as const),
          page.getByText('Already exists').waitFor().then(() => 'duplicate' as const),
        ]);
        expect(outcome).toBe('success');
      });
    } finally {
      await deleteTestUser(page, username);
    }
  });
});

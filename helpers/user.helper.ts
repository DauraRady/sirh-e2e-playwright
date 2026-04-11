import { Page } from '@playwright/test';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { uniqueUsername, DEFAULT_PASSWORD } from '../fixtures/test-data';

/**
 * Creates a temporary user via UI and returns an AsyncDisposable.
 * Usage with `await using`:
 *
 *   await using user = await withTempUser(page);
 *   // test with user.username / user.password
 *   // cleanup runs automatically when scope exits
 */
export async function withTempUser(
  page: Page,
  options: { role?: string; employeeName?: string } = {},
) {
  const adminPage = new AdminUsersPage(page);
  await adminPage.goto();

  const username = uniqueUsername('tmp');
  const password = DEFAULT_PASSWORD;
  const role = options.role || 'ESS';
  const employeeName = options.employeeName || 'a';

  await adminPage.addUser({ role, employeeName, username, password });

  return {
    username,
    password,
    [Symbol.asyncDispose]: async () => {
      try {
        await adminPage.goto();
        await adminPage.searchUser({ username });
        await adminPage.deleteUser(username);
      } catch {
        // Best-effort cleanup — demo may have reset the data
      }
    },
  };
}

/**
 * Simple create + delete helpers for tests that need manual control.
 */
export async function createTestUser(
  page: Page,
  options: { role?: string; employeeName?: string } = {},
): Promise<{ username: string; password: string }> {
  const adminPage = new AdminUsersPage(page);
  await adminPage.goto();

  const username = uniqueUsername('tmp');
  const password = DEFAULT_PASSWORD;

  await adminPage.addUser({
    role: options.role || 'ESS',
    employeeName: options.employeeName || 'a',
    username,
    password,
  });

  return { username, password };
}

export async function deleteTestUser(page: Page, username: string): Promise<void> {
  try {
    const adminPage = new AdminUsersPage(page);
    await adminPage.goto();
    await adminPage.searchUser({ username });
    await adminPage.deleteUser(username);
  } catch {
    // Best-effort cleanup
  }
}

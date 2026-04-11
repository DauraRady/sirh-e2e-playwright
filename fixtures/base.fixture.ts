import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';
import { LeavePage } from '../pages/LeavePage';
import { PimPage } from '../pages/PimPage';
import { TimePage } from '../pages/TimePage';
import { DashboardPage } from '../pages/DashboardPage';

/**
 * Custom test fixtures — inject page objects instead of using beforeEach.
 *
 * Each fixture is LAZY: only instantiated if the test actually uses it.
 * The POM is ready to use (goto already called where relevant).
 * Teardown runs automatically after the test.
 */
export const test = base.extend<{
  loginPage: LoginPage;
  adminPage: AdminUsersPage;
  leavePage: LeavePage;
  pimPage: PimPage;
  timePage: TimePage;
  dashboardPage: DashboardPage;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  adminPage: async ({ page }, use) => {
    const adminPage = new AdminUsersPage(page);
    await adminPage.goto();
    await use(adminPage);
  },

  leavePage: async ({ page }, use) => {
    const leavePage = new LeavePage(page);
    await use(leavePage);
  },

  pimPage: async ({ page }, use) => {
    const pimPage = new PimPage(page);
    await pimPage.goto();
    await use(pimPage);
  },

  timePage: async ({ page }, use) => {
    const timePage = new TimePage(page);
    await use(timePage);
  },

  dashboardPage: async ({ page }, use) => {
    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);
  },
});

export { expect } from '@playwright/test';

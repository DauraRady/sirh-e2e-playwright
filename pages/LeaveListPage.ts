import { Locator, Page } from '@playwright/test';
import { test } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeaveListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await test.step('Navigate to Leave List', async () => {
      await this.navigateTo('Leave');
      await this.page.getByText('Leave List', { exact: true }).click();
      await this.page.waitForLoadState('networkidle');
    });
  }

  getLeaveRecord(employeeName: string): Locator {
    return this.page.getByRole('row', { name: employeeName });
  }
}

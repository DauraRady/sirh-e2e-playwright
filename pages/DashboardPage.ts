import { Page } from '@playwright/test';
import { test } from '@playwright/test';
import { BasePage } from './BasePage';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await test.step('Navigate to dashboard', async () => {
      await this.page.goto('dashboard/index');
      await this.page.waitForLoadState('networkidle');
    });
  }
}

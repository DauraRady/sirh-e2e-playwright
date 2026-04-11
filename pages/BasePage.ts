import { Page } from '@playwright/test';
import { test } from '@playwright/test';

export class BasePage {
  constructor(protected page: Page) {}

  async navigateTo(menuItem: string): Promise<void> {
    await test.step(`Navigate to "${menuItem}" module`, async () => {
      if (this.page.url() === 'about:blank' || !this.page.url().includes('orangehrmlive.com')) {
        await this.page.goto('dashboard/index');
        await this.page.waitForLoadState('networkidle');
      }
      await Promise.all([
        this.page.waitForLoadState('networkidle'),
        this.page.getByRole('link', { name: menuItem }).click(),
      ]);
    });
  }

  async waitForToast(message: string): Promise<void> {
    await test.step(`Wait for toast "${message}"`, async () => {
      await this.page.locator('#oxd-toaster_1').getByText(message).waitFor({ state: 'visible' });
    });
  }
}

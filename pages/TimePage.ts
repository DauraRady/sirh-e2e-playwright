import { Locator, Page } from '@playwright/test';
import { test } from '@playwright/test';
import { BasePage } from './BasePage';

export class TimePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigateTo('Time');
  }

  async goToPunchInOut(): Promise<void> {
    await test.step('Navigate to Punch In/Out', async () => {
      await this.goto();
      // "Attendance" is a topbar dropdown, not a direct link
      await this.page.getByText('Attendance').click();
      await this.page.getByRole('menuitem', { name: 'Punch In/Out' }).click();
      await this.page.waitForLoadState('networkidle');
    });
  }

  async punchIn(note?: string): Promise<void> {
    await test.step('Punch In', async () => {
      if (note) {
        await this.page.getByPlaceholder('Note').fill(note);
      }
      await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
        this.page.getByRole('button', { name: 'In' }).click(),
      ]);
    });
  }

  async punchOut(note?: string): Promise<void> {
    await test.step('Punch Out', async () => {
      if (note) {
        await this.page.getByPlaceholder('Note').fill(note);
      }
      await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
        this.page.getByRole('button', { name: 'Out' }).click(),
      ]);
    });
  }

  getPunchStatus(): Locator {
    return this.page.getByRole('heading', { name: /Punch/ });
  }
}

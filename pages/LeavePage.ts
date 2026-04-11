import { Locator, Page } from '@playwright/test';
import { test } from '@playwright/test';
import { BasePage } from './BasePage';

export class LeavePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigateTo('Leave');
  }

  async goToApply(): Promise<void> {
    await test.step('Navigate to Apply Leave', async () => {
      await this.goto();
      await this.page.getByText('Apply', { exact: true }).first().click();
      await this.page.waitForLoadState('networkidle');
    });
  }

  async goToLeaveList(): Promise<void> {
    await test.step('Navigate to Leave List', async () => {
      await this.goto();
      await this.page.getByText('Leave List', { exact: true }).click();
      await this.page.waitForLoadState('networkidle');
    });
  }

  async applyForLeave({ type, from, to }: { type: string; from: string; to: string }): Promise<void> {
    await test.step(`Apply for ${type} leave from ${from} to ${to}`, async () => {
      await test.step('Select leave type', async () => {
        await this.page.getByText('-- Select --').click();
        await this.page.getByRole('option', { name: type }).click();
      });

      await test.step('Fill dates', async () => {
        const dateInputs = this.page.getByPlaceholder('yyyy-dd-mm');
        await dateInputs.first().fill(from);
        await dateInputs.first().press('Tab');
        if (from !== to) {
          await dateInputs.nth(1).fill(to);
          await dateInputs.nth(1).press('Tab');
        }
      });

      await test.step('Submit leave request', async () => {
        await Promise.all([
          this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
          this.page.getByRole('button', { name: 'Apply' }).click(),
        ]);
      });
    });
  }

  getApplyLeaveHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Apply Leave' });
  }

  getNoLeaveTypesMessage(): Locator {
    return this.page.getByText('No Leave Types with Leave Balance');
  }
}

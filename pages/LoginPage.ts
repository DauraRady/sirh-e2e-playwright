import { Locator, Page } from '@playwright/test';
import { test } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await test.step('Navigate to login page', async () => {
      await this.page.goto('auth/login');
      await this.page.waitForLoadState('networkidle');
    });
  }

  async login(username: string, password: string): Promise<void> {
    await test.step(`Login as "${username}"`, async () => {
      await this.page.getByPlaceholder('Username').fill(username);
      await this.page.getByPlaceholder('Password').fill(password);
      await this.page.getByRole('button', { name: 'Login' }).click();
      await this.page.waitForLoadState('networkidle');
    });
  }

  getErrorMessage(): Locator {
    return this.page.getByRole('alert');
  }

  getRequiredError(): Locator {
    return this.page.getByText('Required');
  }
}

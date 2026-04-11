import { Locator, Page } from '@playwright/test';
import { test } from '@playwright/test';
import { BasePage } from './BasePage';
import { UserConfig, uniqueUsername, DEFAULT_PASSWORD } from '../fixtures/test-data';

export class AdminUsersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigateTo('Admin');
  }

  private get usernameInput(): Locator {
    // oxd-grid-item isole la cellule "Username" sans inclure "Employee Name"
    return this.page.locator('.oxd-grid-item').filter({ hasText: 'Username' }).getByRole('textbox');
  }

  async addUser({
    role = 'ESS',
    employeeName,
    username = uniqueUsername(),
    password = DEFAULT_PASSWORD,
  }: UserConfig): Promise<string> {
    return await test.step(`Add user "${username}" with role ${role}`, async () => {
      await this.page.getByRole('button', { name: ' Add' }).click();
      await this.page.waitForLoadState('networkidle');

      await test.step('Select user role', async () => {
        await this.page.locator('.oxd-select-text').first().click();
        await this.page.getByRole('option', { name: role }).click();
      });

      await test.step('Select employee', async () => {
        const [autocompleteResponse] = await Promise.all([
          this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
          this.page.getByPlaceholder('Type for hints...').fill(employeeName),
        ]);
        await this.page.getByRole('option').first().click();
      });

      await test.step('Fill username', async () => {
        await this.usernameInput.fill(username);
      });

      await test.step('Select status', async () => {
        await this.page.locator('.oxd-select-text').nth(1).click();
        await this.page.getByRole('option', { name: 'Enabled' }).click();
      });

      await test.step('Fill password', async () => {
        const passwordInputs = this.page.locator('input[type="password"]');
        await passwordInputs.first().fill(password);
        await passwordInputs.nth(1).fill(password);
      });

      await test.step('Submit form', async () => {
        await Promise.all([
          this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
          this.page.getByRole('button', { name: 'Save' }).click(),
        ]);
      });

      return username;
    });
  }

  async searchUser(filters: {
    username?: string;
    role?: string;
    status?: string;
  }): Promise<void> {
    await test.step(`Search user ${JSON.stringify(filters)}`, async () => {
      if (filters.username) {
        await this.usernameInput.fill(filters.username);
      }

      if (filters.role) {
        await this.page.locator('.oxd-select-text').first().click();
        await this.page.getByRole('option', { name: filters.role }).click();
      }

      if (filters.status) {
        await this.page.locator('.oxd-select-text').nth(1).click();
        await this.page.getByRole('option', { name: filters.status }).click();
      }

      await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
        this.page.getByRole('button', { name: 'Search' }).click(),
      ]);
    });
  }

  async deleteUser(username: string): Promise<void> {
    await test.step(`Delete user "${username}"`, async () => {
      const row = this.page.getByRole('row', { name: username });
      await row.getByRole('button').first().click();
      await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
        this.page.getByRole('button', { name: 'Yes, Delete' }).click(),
      ]);
    });
  }

  getUserRow(username: string) {
    const row = this.page.getByRole('row', { name: username });
    return {
      get container() { return row; },
      get username() { return row.getByRole('cell').nth(1); },
      get role() { return row.getByRole('cell').nth(2); },
      get employeeName() { return row.getByRole('cell').nth(3); },
      get status() { return row.getByRole('cell').nth(4); },
      get deleteBtn() { return row.getByRole('button').first(); },
      get editBtn() { return row.getByRole('button').nth(1); },
    };
  }
}

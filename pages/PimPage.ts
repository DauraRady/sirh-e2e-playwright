import { Locator, Page } from '@playwright/test';
import { test } from '@playwright/test';
import { BasePage } from './BasePage';

export class PimPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigateTo('PIM');
  }

  async addEmployee({ firstName, lastName }: { firstName: string; lastName: string }): Promise<void> {
    await test.step(`Add employee "${firstName} ${lastName}"`, async () => {
      await this.page.getByRole('button', { name: 'Add' }).click();
      await this.page.waitForLoadState('networkidle');

      await this.page.getByPlaceholder('First Name').fill(firstName);
      await this.page.getByPlaceholder('Last Name').fill(lastName);

      await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
        this.page.getByRole('button', { name: 'Save' }).click(),
      ]);
    });
  }

  async searchEmployee(name: string): Promise<void> {
    await test.step(`Search employee "${name}"`, async () => {
      // PIM page has 2 "Type for hints..." fields — target the first one (Employee Name)
      const employeeNameInput = this.page.getByPlaceholder('Type for hints...').first();
      const [autocompleteResponse] = await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
        employeeNameInput.fill(name),
      ]);

      await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
        this.page.getByRole('button', { name: 'Search' }).click(),
      ]);
    });
  }

  getEmployeeRow(name: string): Locator {
    return this.page.getByRole('row', { name });
  }
}

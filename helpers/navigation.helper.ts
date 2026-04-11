import { Page } from '@playwright/test';
import { test } from '@playwright/test';

export async function navigateToModule(page: Page, moduleName: string): Promise<void> {
  await test.step(`Navigate to ${moduleName}`, async () => {
    if (page.url() === 'about:blank' || !page.url().includes('orangehrmlive.com')) {
      await page.goto('dashboard/index');
      await page.waitForLoadState('networkidle');
    }
    await Promise.all([
      page.waitForLoadState('networkidle'),
      page.getByRole('link', { name: moduleName }).click(),
    ]);
  });
}

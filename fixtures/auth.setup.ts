import { test as setup, expect } from '@playwright/test';
import { USERS, ESS_PASSWORD } from './test-data';
import fs from 'fs';
import path from 'path';

const ESS_CREDENTIALS_PATH = path.join(__dirname, '..', '.auth', 'ess-credentials.json');

setup('authenticate as admin', async ({ page }) => {
  await page.goto('auth/login');
  await page.getByPlaceholder('Username').fill(USERS.admin.username);
  await page.getByPlaceholder('Password').fill(USERS.admin.password);

  await Promise.all([
    page.waitForURL('**/dashboard/index'),
    page.getByRole('button', { name: 'Login' }).click(),
  ]);

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: '.auth/admin.json' });
});

setup('create ESS user and authenticate', async ({ page }) => {
  // Step 1: Login as admin
  await page.goto('auth/login');
  await page.getByPlaceholder('Username').fill(USERS.admin.username);
  await page.getByPlaceholder('Password').fill(USERS.admin.password);

  await Promise.all([
    page.waitForURL('**/dashboard/index'),
    page.getByRole('button', { name: 'Login' }).click(),
  ]);

  // Step 2: Create an employee in PIM
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('link', { name: 'PIM' }).click(),
  ]);

  await page.getByRole('button', { name: 'Add' }).click();
  await page.waitForLoadState('networkidle');

  const firstName = `EssQA${Date.now()}`;
  const lastName = 'Tester';
  await page.getByPlaceholder('First Name').fill(firstName);
  await page.getByPlaceholder('Last Name').fill(lastName);

  await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
    page.getByRole('button', { name: 'Save' }).click(),
  ]);

  await expect(page.getByText('Successfully Saved')).toBeVisible();
  const employeeName = `${firstName} ${lastName}`;

  // Step 3: Create an ESS user in Admin
  await Promise.all([
    page.waitForLoadState('networkidle'),
    page.getByRole('link', { name: 'Admin' }).click(),
  ]);

  await page.getByRole('button', { name: ' Add' }).click();
  await page.waitForLoadState('networkidle');

  // Role = ESS
  await page.locator('.oxd-select-text').first().click();
  await page.getByRole('option', { name: 'ESS' }).click();

  // Employee Name — type the first name and select from autocomplete
  const [autocompleteResp] = await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
    page.getByPlaceholder('Type for hints...').fill(firstName),
  ]);
  await page.getByRole('option').first().click();

  // Username
  const essUsername = `ess_${Date.now()}`;
  const usernameInput = page.locator('.oxd-grid-item').filter({ hasText: 'Username' }).getByRole('textbox');
  await usernameInput.fill(essUsername);

  // Status
  await page.locator('.oxd-select-text').nth(1).click();
  await page.getByRole('option', { name: 'Enabled' }).click();

  // Password
  const passwordInputs = page.locator('input[type="password"]');
  await passwordInputs.first().fill(ESS_PASSWORD);
  await passwordInputs.nth(1).fill(ESS_PASSWORD);

  await Promise.all([
    page.waitForResponse(r => r.url().includes('/api/v2/') && r.status() === 200),
    page.getByRole('button', { name: 'Save' }).click(),
  ]);

  await expect(page.getByText('Successfully Saved')).toBeVisible();

  // Save ESS credentials to a file so tests can read them
  fs.mkdirSync(path.dirname(ESS_CREDENTIALS_PATH), { recursive: true });
  fs.writeFileSync(ESS_CREDENTIALS_PATH, JSON.stringify({
    username: essUsername,
    password: ESS_PASSWORD,
    employeeName,
  }));

  // Step 4: Logout admin
  await page.locator('.oxd-userdropdown').click();
  await page.getByRole('menuitem', { name: 'Logout' }).click();
  await page.waitForURL('**/auth/login');

  // Step 5: Login as ESS user and save storageState
  await page.getByPlaceholder('Username').fill(essUsername);
  await page.getByPlaceholder('Password').fill(ESS_PASSWORD);

  await Promise.all([
    page.waitForURL('**/dashboard/index'),
    page.getByRole('button', { name: 'Login' }).click(),
  ]);

  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await page.context().storageState({ path: '.auth/ess.json' });
});

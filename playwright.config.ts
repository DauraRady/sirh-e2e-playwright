import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const CI = !!process.env.CI;

export default defineConfig({
  testDir: '.',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  workers: CI ? 1 : undefined,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: CI
    ? [['html', { open: 'never' }], ['github'], ['list'], ['allure-playwright']]
    : [['html', { open: 'always' }], ['list'], ['allure-playwright']],

  use: {
    baseURL: 'https://opensource-demo.orangehrmlive.com/web/index.php/',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    timezoneId: 'UTC',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /fixtures\/.*\.setup\.ts/,
    },
    {
      name: 'auth-tests',
      dependencies: ['setup'],
      testMatch: /tests\/auth\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'admin-tests',
      dependencies: ['setup'],
      testMatch: /tests\/admin\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
    },
    {
      name: 'leave-tests',
      dependencies: ['setup'],
      testMatch: /tests\/leave\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
    },
    {
      name: 'pim-tests',
      dependencies: ['setup'],
      testMatch: /tests\/pim\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
    },
    {
      name: 'time-tests',
      dependencies: ['setup'],
      testMatch: /tests\/time\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '.auth/admin.json'),
      },
    },
    {
      name: 'ess-tests',
      dependencies: ['setup'],
      testMatch: /tests\/ess\/.*/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: path.join(__dirname, '.auth/ess.json'),
      },
    },
    {
      name: 'security-tests',
      dependencies: ['setup'],
      testMatch: /tests\/security\/.*/,
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});

export const USERS = {
  admin: {
    username: process.env.ADMIN_USERNAME || 'Admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
} as const;

// ESS user — created dynamically in auth.setup.ts
// Username and password are generated per run to avoid collisions
export const ESS_PASSWORD = 'EssTest@123';

export function essUsername(): string {
  return `ess_${Date.now()}`;
}

export function uniqueUsername(prefix = 'qa'): string {
  return `${prefix}_${Date.now()}`;
}

export interface UserConfig {
  role?: string;
  employeeName: string;
  username?: string;
  password?: string;
}

export const DEFAULT_PASSWORD = 'Test@12345';

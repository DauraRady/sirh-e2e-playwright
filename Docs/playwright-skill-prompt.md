# Skill Playwright — Manuel de procedure

> Ce prompt est a copier dans le CLAUDE.md de chaque projet Playwright.
> Il sert de guide obligatoire pour Claude lors de la generation de tests.

---

## IDENTITE

Tu es un expert QA Automation specialise en Playwright + TypeScript.
Tu appliques une strategie Risk-Based Testing (RBT) : on ne teste pas tout,
on cible les risques metier critiques avec des tests deterministes.

---

## ARCHITECTURE OBLIGATOIRE

```
projet/
├── playwright.config.ts         # Config avec baseURL, timeouts, traces
├── .env / .env.example          # Credentials gitignored
├── fixtures/
│   ├── auth.setup.ts            # StorageState par role
│   ├── base.fixture.ts          # test.extend() avec POM injectes
│   └── test-data.ts             # Donnees + uniqueUsername()
├── pages/                       # Page Object Model
│   ├── BasePage.ts              # navigateTo(), waitForToast()
│   └── [Module]Page.ts          # Un POM par module metier
├── helpers/                     # Setup/teardown, row builders
├── tests/[module]/              # Tests par module metier
└── docs/                        # Documentation
```

---

## REGLES OBLIGATOIRES

### Config playwright.config.ts

```typescript
// TOUJOURS definir ces options :
timeout: 60_000,
expect: { timeout: 10_000 },
use: {
  actionTimeout: 15_000,
  navigationTimeout: 30_000,
  trace: 'retain-on-failure',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  locale: 'en-US',
  timezoneId: 'UTC',
  baseURL: '.../',  // ← TOUJOURS terminer par /
}
```

### Fixtures — test.extend() obligatoire

```typescript
// ❌ INTERDIT
let page: AdminPage;
test.beforeEach(async ({ page }) => { adminPage = new AdminPage(page); });

// ✅ OBLIGATOIRE
export const test = base.extend<{ adminPage: AdminUsersPage }>({
  adminPage: async ({ page }, use) => {
    const adminPage = new AdminUsersPage(page);
    await adminPage.goto();
    await use(adminPage);
  },
});
```

### POM — Regles

1. **Pas d'assertions** dans les POM — jamais.
2. **test.step()** dans chaque methode publique.
3. **Promise.all** pour chaque click qui declenche une requete API :
   ```typescript
   await Promise.all([
     this.page.waitForResponse(r => r.url().includes('/api/') && r.status() === 200),
     this.page.getByRole('button', { name: 'Save' }).click(),
   ]);
   ```
4. **Destructuring + defaults** pour les parametres :
   ```typescript
   async addUser({ role = 'ESS', employeeName, username = uniqueUsername() }: UserConfig)
   ```
5. **Retourner des Locators** pour les verifications (pas boolean).
6. **Retourner les donnees generees** (username cree, etc.).

### Locators — Ordre de priorite

```
1. getByRole('button', { name: 'Save' })     ← PRIORITE 1
2. getByLabel('Username')                      ← PRIORITE 2
3. getByPlaceholder('Username')                ← PRIORITE 3
4. getByText('Success')                        ← PRIORITE 4
5. getByTestId('submit')                       ← PRIORITE 5
6. locator('.oxd-select-text').first()          ← DERNIER RECOURS avec commentaire
```

**INTERDITS :**
```typescript
page.locator('form i').nth(1)        // Position fragile
page.getByRole('textbox').nth(2)     // Index DOM sans contexte
page.locator('//div[3]/span')        // XPath fragile
```

### Assertions — Regles

```typescript
// TOUJOURS au moins une assertion metier par test
// UTILISER expect.soft() pour les verifications multiples non-bloquantes
// UTILISER expect.poll() pour les donnees dynamiques
// JAMAIS de test sans assertion

await expect(page).toHaveURL(/.*dashboard.*/);                    // Navigation
await expect(page.getByText('Successfully Saved')).toBeVisible(); // Toast
await expect.soft(row.role).toHaveText('Admin');                  // Multi-check
await expect.poll(() => page.getByRole('row').count()).toBeGreaterThan(1); // Donnees
```

### Waits — Regles absolues

```typescript
// ❌ INTERDIT
await page.waitForTimeout(3000);
await page.waitForLoadState('networkidle'); // comme seule attente

// ✅ OBLIGATOIRE
await page.waitForURL('**/dashboard/index');
await expect(element).toBeVisible();
await Promise.all([page.waitForResponse(predicate), action]);
await expect.poll(() => getValue()).toBe(expected);
```

### Nommage des tests

```typescript
// ✅ Format : should [resultat] when [condition]
test('should redirect admin to dashboard after valid login')
test('should display error message with invalid credentials')
test('should reject leave request when balance is insufficient')

// ❌ INTERDIT
test('test login')
test('Admin Add User')
test('click button and fill form')
```

---

## PATTERNS JAVASCRIPT OBLIGATOIRES

### 1. Promise.all — Anti race condition
```typescript
const [response] = await Promise.all([
  page.waitForResponse(predicate),
  triggerAction,
]);
```

### 2. try/finally — Cleanup garanti
```typescript
const username = await createUser();
try {
  // test
} finally {
  await deleteUser(username);
}
```

### 3. await using — Cleanup automatique (prefere a try/finally)
```typescript
await using user = await withTempUser(page);
// cleanup automatique a la fin du scope
```

### 4. Promise.race — Detecter le premier resultat
```typescript
const outcome = await Promise.race([
  page.getByText('Success').waitFor().then(() => 'success'),
  page.getByText('Error').waitFor().then(() => 'error'),
]);
```

### 5. Row builder — Locators de table lisibles
```typescript
function userRow(page: Page, name: string) {
  const row = page.getByRole('row', { name });
  return {
    get username() { return row.getByRole('cell').nth(1); },
    get role() { return row.getByRole('cell').nth(2); },
    get deleteBtn() { return row.getByRole('button').first(); },
  };
}
```

### 6. Destructuring + defaults — Parametres nommes
```typescript
async addUser({ role = 'ESS', employeeName, username = uniqueUsername() }: Config)
```

---

## PATTERNS PLAYWRIGHT OBLIGATOIRES

### 1. test.step() — Traces lisibles
```typescript
async addUser(config: UserConfig) {
  return await test.step(`Add user ${config.username}`, async () => {
    // sous-etapes
  });
}
```

### 2. expect() — Assertions bloquantes (PAS expect.soft)
```typescript
// ✅ Utiliser expect() normal — le test FAIL si l'assertion echoue
await expect(row.role).toHaveText('Admin');
await expect(row.status).toHaveText('Enabled');

// ⚠️ expect.soft() ne fait PAS echouer le test — eviter sauf diagnostic
```

### 3. expect.poll() — Polling deterministe
```typescript
await expect.poll(() => rows.count(), { timeout: 15_000 }).toBeGreaterThan(0);
```

### 4. page.route() — Mock API pour edge cases
```typescript
await page.route('**/api/v2/endpoint', route =>
  route.fulfill({ status: 500 })
);
```

### 5. storageState — Reutiliser la session
```typescript
// Setup : sauvegarder
await page.context().storageState({ path: '.auth/admin.json' });
// Test : reutiliser via config projet
use: { storageState: '.auth/admin.json' }
```

---

## ANTI-PATTERNS INTERDITS

| Anti-pattern | Pourquoi c'est mauvais | Alternative |
|---|---|---|
| `waitForTimeout(N)` | Non-deterministe, lent | `expect.poll()`, `waitForResponse` |
| `beforeEach` pour POM | Non-reutilisable, pas type-safe | `test.extend()` |
| Assertion dans POM | Melange responsabilites | Retourner Locator |
| `.nth()` sans contexte | Fragile si le DOM change | Row builder, `.filter()` |
| `networkidle` seul | Pas une garantie de donnees | `expect.poll()` |
| Click puis waitForResponse | Race condition | `Promise.all` |
| Donnees en dur | Collision sur demo partagee | `uniqueUsername()` |
| Test sans cleanup | Pollution de la base | `try/finally`, `await using` |
| Test sans assertion | Ne teste rien | Au minimum 1 assertion metier |
| Boolean dans POM | Message d'erreur inutile | Retourner Locator |

---

## CHECKLIST AVANT CHAQUE PR

```
CONFIG
[ ] baseURL termine par /
[ ] actionTimeout + navigationTimeout definis
[ ] trace + screenshot + video on failure
[ ] locale + timezoneId pour le determinisme

FIXTURES
[ ] test.extend() pour l'injection des POM
[ ] storageState pour les sessions authentifiees
[ ] uniqueUsername() pour les donnees de test

POM
[ ] Aucune assertion
[ ] test.step() dans chaque methode publique
[ ] Promise.all pour click + waitForResponse
[ ] Destructuring + defaults pour les parametres
[ ] Retourne Locator ou donnees generees

TESTS
[ ] Au moins 1 assertion metier par test
[ ] Nommage "should [resultat] when [condition]"
[ ] Cleanup avec try/finally ou await using
[ ] expect.soft() pour les verifications multiples
[ ] expect.poll() pour les donnees dynamiques
[ ] Pas de waitForTimeout
[ ] Passe en --workers=1 et --grep individuel

MOCKING
[ ] Happy paths = E2E reel (pas de mock)
[ ] Edge cases = page.route() (erreurs, etats specifiques)
```

---

## REPORTING

```typescript
// Config multi-reporter obligatoire
reporter: CI
  ? [['html', { open: 'never' }], ['github'], ['list'], ['allure-playwright']]
  : [['html', { open: 'on-failure' }], ['list'], ['allure-playwright']],
```

```bash
# Generer le dashboard Allure
npx allure generate allure-results -o allure-report --clean
npx allure open allure-report
```

---

## COMMANDES UTILES

```bash
npx playwright test                              # Tous les tests
npx playwright test tests/auth/                  # Un dossier
npx playwright test --grep "should redirect"     # Par nom
npx playwright test --project=admin-tests        # Par projet
npx playwright test --headed --debug             # Debug visuel
npx playwright test --workers=1                  # Sequentiel
npx playwright show-report                       # Rapport HTML
npx playwright test --trace on                   # Forcer les traces
npx playwright codegen https://example.com       # Generer du code
```

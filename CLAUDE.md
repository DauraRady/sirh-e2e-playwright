# Instructions Projet — OrangeHRM Playwright TS

## Contexte

Repo de tests E2E Playwright TypeScript ciblant la démo publique OrangeHRM :
`https://opensource-demo.orangehrmlive.com`

Credentials démo : `Admin` / `admin123`

Ce projet applique une stratégie **Risk-Based Testing** (RBT). On ne cherche pas à tout tester — on cible les risques métier critiques avec des tests déterministes et maintenables.

---

## Architecture cible

```
orangehrm-tests/
├── CLAUDE.md                    # Ce fichier
├── playwright.config.ts         # Config avec baseURL activé
├── .env                         # Credentials (gitignored)
├── .env.example                 # Template des variables
│
├── pages/                       # Page Object Model
│   ├── BasePage.ts              # Méthodes communes (navigation, wait)
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── AdminUsersPage.ts
│   ├── LeavePage.ts
│   ├── LeaveListPage.ts
│   ├── PimPage.ts
│   └── TimePage.ts
│
├── fixtures/                    # Fixtures Playwright custom
│   ├── auth.fixture.ts          # Login + storageState par rôle
│   └── test-data.ts             # Données de test centralisées
│
├── helpers/                     # Utilitaires réutilisables
│   ├── navigation.helper.ts     # Navigation sidebar
│   └── user.helper.ts           # CRUD utilisateur pour setup/teardown
│
├── tests/                       # Tests organisés par module métier
│   ├── auth/
│   │   ├── login-admin.spec.ts
│   │   ├── login-ess.spec.ts
│   │   └── login-negative.spec.ts
│   ├── leave/
│   │   ├── apply-leave.spec.ts
│   │   └── approve-leave.spec.ts
│   ├── admin/
│   │   ├── add-user.spec.ts
│   │   ├── search-user.spec.ts
│   │   └── delete-user.spec.ts
│   ├── pim/
│   │   └── add-employee.spec.ts
│   └── security/
│       └── role-access.spec.ts
│
└── docs/
    └── qa-risk-analysis-orangehrm.md  # Audit de référence
```

---

## Conventions obligatoires

### Locators — Ordre de priorité

```typescript
// ✅ PRIORITÉ 1 — Rôle ARIA
page.getByRole('button', { name: 'Save' })
page.getByRole('link', { name: 'Admin' })
page.getByRole('heading', { name: 'Dashboard' })

// ✅ PRIORITÉ 2 — Label
page.getByLabel('Username')

// ✅ PRIORITÉ 3 — Placeholder
page.getByPlaceholder('Username')

// ✅ PRIORITÉ 4 — Texte visible
page.getByText('Successfully Saved')

// ✅ PRIORITÉ 5 — Test ID (si disponible)
page.getByTestId('login-submit')

// ⚠️ DERNIER RECOURS — CSS ciblé avec contexte
page.locator('.oxd-select-text').first()

// ❌ INTERDIT
page.locator('form i').nth(1)           // Position fragile
page.getByRole('textbox').nth(2)        // Index DOM
page.locator('//div[3]/span')           // XPath fragile
```

### Waits — Règles absolues

```typescript
// ❌ INTERDIT — wait fixe
await page.waitForTimeout(3000);

// ✅ Attendre la navigation
await page.waitForURL('**/dashboard/index');

// ✅ Attendre une réponse API
await page.waitForResponse(resp =>
  resp.url().includes('/api/v2/') && resp.status() === 200
);

// ✅ Attendre un élément visible (auto-retry Playwright)
await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

// ✅ Attendre la fin du chargement réseau
await page.waitForLoadState('networkidle');
```

### Assertions — Règles

```typescript
// ✅ BON — Assertion métier claire
await expect(page.getByText('Successfully Saved')).toBeVisible();
await expect(page).toHaveURL(/.*dashboard.*/);
await expect(page.getByRole('cell', { name: 'John' })).toBeVisible();

// ❌ MAUVAIS — Assertion cosmétique
await expect(page.locator('.oxd-topbar')).toHaveCSS('background-color', '...');

// ❌ INTERDIT — Test sans assertion
test('do something', async ({ page }) => {
  await page.click('button');
  // ... et c'est tout ? NON.
});
```

### Nommage des tests

```typescript
// ✅ BON — Intention métier
test('should redirect admin to dashboard after valid login', ...);
test('should display error message with invalid credentials', ...);
test('should reject leave request when balance is insufficient', ...);

// ❌ MAUVAIS — Description technique
test('test login', ...);
test('click button and fill form', ...);
test('Admin Add User', ...);
```

### Structure d'un test

```typescript
test('should [résultat attendu] when [condition]', async ({ page }) => {
  // ARRANGE — Préconditions
  // (login déjà fait via fixture, données prêtes)

  // ACT — Action utilisateur
  await leavePage.applyForLeave('Annual', '2026-06-01', '2026-06-03');

  // ASSERT — Vérification métier
  await expect(page.getByText('Successfully Saved')).toBeVisible();
});
```

---

## Page Object Model — Contrats

### Règles POM

1. **Un POM encapsule la navigation et les interactions** — pas les assertions
2. **Les assertions restent dans les tests** — jamais dans les pages
3. **Les méthodes retournent `void` ou `Promise<void>`** — pas de `boolean`
4. **Chaque méthode = une action utilisateur** — pas un clic technique
5. **Les sélecteurs sont privés** — exposer des méthodes, pas des locators

### BasePage.ts — Contrat

```typescript
export class BasePage {
  constructor(protected page: Page) {}

  async navigateTo(menuItem: string): Promise<void>
  // Clique sur le menu latéral OrangeHRM
  // Attend la navigation complète (waitForURL ou waitForLoadState)

  async waitForToast(message: string): Promise<void>
  // Attend le toast OrangeHRM avec le message donné
  // Utilise getByText avec auto-retry
}
```

### LoginPage.ts — Contrat

```typescript
export class LoginPage {
  async goto(): Promise<void>
  // page.goto('/auth/login')

  async login(username: string, password: string): Promise<void>
  // Fill username + password + click Login
  // waitForURL dashboard OU waitForResponse API login

  async getErrorMessage(): Promise<Locator>
  // Retourne le locator du message d'erreur (pour assertion dans le test)
}
```

### LeavePage.ts — Contrat

```typescript
export class LeavePage {
  async goto(): Promise<void>
  // Naviguer vers Leave > Apply

  async applyForLeave(type: string, from: string, to: string): Promise<void>
  // Sélectionner type de congé
  // Remplir dates from/to
  // Cliquer Apply
  // Attendre la réponse API

  async getLeaveBalance(type: string): Promise<Locator>
  // Retourne le locator du solde pour un type donné
}
```

### AdminUsersPage.ts — Contrat

```typescript
export class AdminUsersPage {
  async goto(): Promise<void>
  // Naviguer vers Admin > User Management

  async addUser(role: string, employeeName: string, username: string, password: string): Promise<void>
  // Remplir le formulaire complet
  // Cliquer Save
  // Attendre la réponse API

  async searchUser(filters: { username?: string, role?: string, status?: string }): Promise<void>
  // Appliquer les filtres + cliquer Search

  async deleteUser(username: string): Promise<void>
  // Trouver la row + cliquer delete + confirmer
  // Attendre le toast de confirmation

  async isUserInResults(username: string): Promise<Locator>
  // Retourne le locator de la row pour assertion
}
```

---

## Fixtures — Auth par rôle

### Stratégie d'authentification

Utiliser `storageState` pour éviter de re-login via l'UI à chaque test.

```typescript
// fixtures/auth.fixture.ts
// Créer un setup project dans playwright.config.ts qui :
// 1. Login Admin → sauvegarde storageState dans .auth/admin.json
// 2. Login ESS → sauvegarde storageState dans .auth/ess.json
// 3. Les tests utilisent le storageState du rôle qu'ils testent

// Exemple dans playwright.config.ts :
// projects: [
//   { name: 'setup', testMatch: /.*\.setup\.ts/ },
//   { name: 'admin-tests', dependencies: ['setup'], use: { storageState: '.auth/admin.json' } },
//   { name: 'ess-tests', dependencies: ['setup'], use: { storageState: '.auth/ess.json' } },
//   { name: 'auth-tests' },  // Pas de storageState — teste le login lui-même
// ]
```

### Données de test

```typescript
// fixtures/test-data.ts
export const USERS = {
  admin: { username: 'Admin', password: 'admin123' },
  // ESS user : identifier un compte ESS existant dans la démo
  // ou le créer dans le setup
} as const;

// Générer des noms uniques pour éviter les collisions
export function uniqueUsername(prefix = 'qa'): string {
  return `${prefix}_${Date.now()}`;
}
```

---

## playwright.config.ts — Modifications requises

```typescript
// Changements à appliquer :
// 1. Activer baseURL
use: {
  baseURL: 'https://opensource-demo.orangehrmlive.com/web/index.php',
  trace: 'on-first-retry',
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
},

// 2. Ajouter les projets avec auth
// Voir section Fixtures ci-dessus

// 3. Garder fullyParallel: true mais les tests doivent être isolés

// 4. Timeout global raisonnable
timeout: 30_000,
expect: { timeout: 10_000 },
```

---

## Priorités d'implémentation

### Sprint 1 — Fondations + Login (P0)

1. Mettre à jour `playwright.config.ts` (baseURL, screenshot, video)
2. Créer `pages/BasePage.ts`
3. Créer `pages/LoginPage.ts`
4. Créer `fixtures/test-data.ts`
5. Créer `tests/auth/login-admin.spec.ts` — login valide Admin
6. Créer `tests/auth/login-negative.spec.ts` — login invalide (mauvais mdp, champs vides)
7. Supprimer `tests/test_adminmgt.spec.ts` (l'ancien fichier)
8. Valider : `npx playwright test tests/auth/`

### Sprint 2 — Leave + Sécurité (P0/P1)

1. Créer le setup auth avec `storageState` (admin.json)
2. Créer `pages/LeavePage.ts`
3. Créer `tests/leave/apply-leave.spec.ts` — happy path
4. Créer `tests/leave/apply-leave.spec.ts` — cas négatif (solde KO)
5. Créer `tests/security/role-access.spec.ts` — ESS ne voit pas Admin
6. Valider : `npx playwright test`

### Sprint 3 — Admin CRUD + PIM (P1)

1. Créer `pages/AdminUsersPage.ts`
2. Créer `helpers/user.helper.ts` — setup/teardown utilisateur
3. Créer `tests/admin/add-user.spec.ts` — avec assertions + nom unique
4. Créer `tests/admin/delete-user.spec.ts` — isolé avec son propre setup
5. Créer `pages/PimPage.ts`
6. Créer `tests/pim/add-employee.spec.ts`
7. Valider : `npx playwright test`

### Sprint 4 — Punch + Stabilisation (P2)

1. Créer `pages/TimePage.ts`
2. Créer `tests/time/punch.spec.ts`
3. Mettre à jour le README pour refléter la réalité
4. Run complet CI + fix flaky
5. Valider : pipeline vert sur GitHub Actions

---

## Anti-patterns interdits

### Dans le code

```typescript
// ❌ JAMAIS de waitForTimeout
await page.waitForTimeout(2000);

// ❌ JAMAIS de nth() sans contexte sémantique
page.getByRole('textbox').nth(3);

// ❌ JAMAIS de sélecteur d'icône par position
page.locator('form i').nth(1);

// ❌ JAMAIS d'assertion dans un Page Object
// Les assertions = dans les tests UNIQUEMENT

// ❌ JAMAIS de logique métier dans les tests
// Les tests = ARRANGE / ACT / ASSERT, rien d'autre

// ❌ JAMAIS de données en dur qui dépendent de l'état de la démo
// Générer des noms uniques, nettoyer après

// ❌ JAMAIS de test qui dépend d'un autre test
// Chaque test doit pouvoir tourner seul avec --grep

// ❌ JAMAIS de credentials en dur dans les tests
// Utiliser fixtures/test-data.ts ou .env

// ❌ JAMAIS de retry comme stratégie de stabilisation
// Si un test a besoin de retry pour passer, il est cassé
```

### Dans l'architecture

```
❌ Pas de fichier test avec 500 lignes
❌ Pas de test.describe() avec 10 tests dedans
❌ Pas de beforeEach qui fait 20 lignes de setup UI
❌ Pas de helper qui fait du login + navigation + assertion
❌ Pas de Page Object qui retourne true/false
```

---

## Contraintes de l'environnement cible

La démo OrangeHRM est publique et partagée. Cela implique :

1. **Les données sont réinitialisées périodiquement** — ne jamais compter sur la persistance
2. **D'autres utilisateurs peuvent modifier les données en même temps** — noms uniques obligatoires
3. **Pas d'API documentée pour le setup/teardown** — on fait le setup via l'UI dans les fixtures
4. **L'app peut être lente** — timeouts généreux + waits réseau
5. **Pas de data-testid** — on utilise les rôles ARIA et le texte visible

---

## Checklist avant chaque commit

- [ ] Chaque test a au moins une assertion métier
- [ ] Aucun `waitForTimeout` dans le code
- [ ] Aucun `.nth()` sans justification claire en commentaire
- [ ] Les tests passent en `--workers=1` (séquentiel)
- [ ] Les tests passent avec `--grep` individuel (isolation)
- [ ] Le nommage exprime l'intention métier
- [ ] Les Page Objects ne contiennent aucune assertion
- [ ] Les données de test sont uniques ou nettoyées

---

## Commandes utiles

```bash
# Lancer tous les tests
npx playwright test

# Lancer un fichier spécifique
npx playwright test tests/auth/login-admin.spec.ts

# Lancer un test par nom
npx playwright test --grep "should redirect admin"

# Mode debug (headed + pause)
npx playwright test --headed --debug

# Voir le rapport HTML
npx playwright show-report

# Lancer uniquement Chromium
npx playwright test --project=chromium

# Générer le code (codegen)
npx playwright codegen https://opensource-demo.orangehrmlive.com
```

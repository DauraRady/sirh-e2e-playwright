# Cours Complet — Playwright + TypeScript + Patterns JS

## Table des matieres

1. [Architecture d'un projet Playwright](#1-architecture)
2. [Patterns JavaScript essentiels](#2-patterns-javascript)
3. [Patterns Playwright avances](#3-patterns-playwright)
4. [Page Object Model — la bonne facon](#4-pom)
5. [Fixtures — pourquoi beforeEach est un anti-pattern](#5-fixtures)
6. [Locators — hierarchie et pieges](#6-locators)
7. [Assertions — strategies deterministes](#7-assertions)
8. [Mocking API avec page.route()](#8-mocking)
9. [CI/CD — configuration pour la stabilite](#9-cicd)
10. [Erreurs commises et lecons](#10-erreurs)
11. [Checklist avant chaque PR](#11-checklist)

---

## 1. Architecture

### Pourquoi cette structure ?

```
projet/
├── playwright.config.ts      # CERVEAU — projets, timeouts, traces
├── .env / .env.example        # Credentials JAMAIS dans le code
│
├── fixtures/                  # INJECTION DE DEPENDANCES
│   ├── auth.setup.ts          # StorageState — login une seule fois
│   ├── base.fixture.ts        # test.extend() — injecte les POM
│   └── test-data.ts           # Donnees + helpers de generation
│
├── pages/                     # PAGE OBJECT MODEL
│   ├── BasePage.ts            # Methodes communes (navigateTo, waitForToast)
│   ├── LoginPage.ts           # Encapsule le formulaire login
│   ├── AdminUsersPage.ts      # Encapsule le CRUD utilisateurs
│   └── ...                    # Un POM par module metier
│
├── helpers/                   # UTILITAIRES TRANSVERSES
│   ├── user.helper.ts         # Creer/supprimer un user (setup/teardown)
│   └── navigation.helper.ts   # Navigation sidebar
│
├── tests/                     # TESTS ORGANISES PAR RISQUE METIER
│   ├── auth/                  # P0 — Login
│   ├── admin/                 # P1 — CRUD utilisateurs
│   ├── leave/                 # P0 — Conges
│   ├── pim/                   # P1 — Employes
│   ├── security/              # P0 — Controle d'acces
│   └── time/                  # P2 — Pointage
│
└── docs/                      # DOCUMENTATION
```

### Principe fondamental : Separation des responsabilites

```
┌─────────────┐     ┌──────────────┐     ┌──────────────┐
│   TESTS     │────>│     POM      │────>│   FIXTURES   │
│             │     │              │     │              │
│ Assertions  │     │ Actions UI   │     │ Setup/inject │
│ test.step() │     │ Locators     │     │ storageState │
│ expect.*    │     │ Navigation   │     │ test.extend  │
└─────────────┘     └──────────────┘     └──────────────┘
      │                                        │
      │            ┌──────────────┐            │
      └───────────>│   HELPERS    │<───────────┘
                   │              │
                   │ Cleanup      │
                   │ Data gen     │
                   └──────────────┘
```

**Regle d'or :**
- Les **tests** contiennent les assertions et la logique metier
- Les **POM** encapsulent les interactions UI (pas d'assertions dedans)
- Les **fixtures** injectent les dependances (POM, contexte auth)
- Les **helpers** font le setup/teardown transverse

---

## 2. Patterns JavaScript

### 2.1 `Promise.all` — Eviter les race conditions

**Le probleme :**
```typescript
// ❌ RACE CONDITION
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForResponse(resp => resp.url().includes('/api/v2/'));
// ↑ Si la reponse arrive AVANT que waitForResponse soit enregistre
//   → le test attend indefiniment → timeout → FAIL en CI
```

**Pourquoi ca arrive :**
```
Timeline FRAGILE :
  click()  ─────────────> done
                               waitForResponse() ──────> timeout!
  serveur  ───> reponse ↗  (rate!)

Timeline SURE avec Promise.all :
  waitForResponse() ──────────────────────> reponse capturee!
  click()  ─────────────> done
  serveur  ──────────────────> reponse ↗
```

**La solution :**
```typescript
// ✅ DETERMINISTE — on ecoute AVANT de cliquer
const [response] = await Promise.all([
  page.waitForResponse(resp =>
    resp.url().includes('/api/v2/') && resp.status() === 200
  ),
  page.getByRole('button', { name: 'Save' }).click(),
]);

// On peut meme verifier la reponse
expect(response.status()).toBe(200);
```

**Quand l'utiliser :**
| Action | Attente | Promise.all ? |
|--------|---------|---------------|
| Click Save | Reponse API | OUI |
| Click Login | Navigation URL | OUI |
| Click menu | Chargement page | OUI |
| Fill un champ | Rien | NON |
| Click checkbox | Rien | NON |

### 2.2 `try/finally` — Cleanup garanti

**Le probleme :**
```typescript
// ❌ SI LE TEST CRASH, LE USER RESTE DANS LA BASE
test('should delete user', async ({ page }) => {
  await createTestUser(page, 'qa_temp');
  await doSomething(); // ← crash ici
  await deleteTestUser(page, 'qa_temp'); // ← jamais execute!
});
// Resultat : la base se pollue, les tests suivants echouent
```

**La solution :**
```typescript
// ✅ CLEANUP GARANTI meme si le test crash
test('should delete user', async ({ page }) => {
  const username = await createTestUser(page);
  try {
    await doSomething();
    await expect(page.getByText('Success')).toBeVisible();
  } finally {
    // Execute TOUJOURS, crash ou pas
    await deleteTestUser(page, username);
  }
});
```

### 2.3 `await using` + `AsyncDisposable` — try/finally automatique

**C'est quoi ?**
`Symbol.asyncDispose` est un pattern ES2024 (supporte par TypeScript 5.2+).
Ca permet de dire : "quand cette variable sort du scope, execute ce cleanup".
C'est un try/finally invisible.

```typescript
// Helper qui retourne un objet "disposable"
async function withTempUser(page: Page) {
  const adminPage = new AdminUsersPage(page);
  const username = uniqueUsername();
  await adminPage.goto();
  await adminPage.addUser({ employeeName: 'a', username });

  return {
    username,
    password: 'Test@12345',
    // ↓ Ce code s'execute automatiquement a la fin du scope
    [Symbol.asyncDispose]: async () => {
      await adminPage.goto();
      await adminPage.searchUser({ username });
      await adminPage.deleteUser(username);
    },
  };
}

// Dans le test — PAS DE try/finally!
test('should verify user exists', async ({ page }) => {
  await using user = await withTempUser(page);
  // ... test avec user.username ...
}); // ← cleanup automatique ici
```

**Comparaison :**
| Pattern | Verbeux ? | Oubli possible ? | Lisibilite |
|---------|-----------|-------------------|------------|
| Manuel (delete apres) | Non | OUI — oubli frequent | Moyenne |
| try/finally | Oui | Non | Correcte |
| await using | Non | Non | Excellente |

### 2.4 `Promise.race` — Premier arrive, premier servi

**Le cas d'usage :**
Apres un clic sur "Save", l'app peut afficher :
- Un toast "Successfully Saved" (succes)
- Un toast "Already exists" (erreur)
- Un toast "Required" (validation)

On ne sait pas lequel va apparaitre.

```typescript
// ✅ On attend LE PREMIER qui apparait
const outcome = await Promise.race([
  page.getByText('Successfully Saved').waitFor()
    .then(() => 'success' as const),
  page.getByText('Already exists').waitFor()
    .then(() => 'duplicate' as const),
  page.getByText('Required').waitFor()
    .then(() => 'validation_error' as const),
]);

expect(outcome).toBe('success');
```

**Quand l'utiliser :**
- Formulaires ou le resultat est incertain (demo partagee!)
- Tests de detection d'erreur
- Timeout custom sur une operation specifique

### 2.5 Destructuring + defaults — API propre pour les POM

```typescript
// ❌ ILLISIBLE — c'est quoi le 3eme parametre deja ?
await adminPage.addUser('ESS', 'a', 'qa_123', 'Test@12345');

// ✅ LISIBLE — chaque parametre est nomme
interface UserConfig {
  role?: string;
  employeeName: string;
  username?: string;
  password?: string;
}

async addUser({
  role = 'ESS',
  employeeName,
  username = uniqueUsername(),
  password = 'Test@12345',
}: UserConfig): Promise<string> {
  // ...
  return username; // Retourne le username genere
}

// Usage — on ne passe que ce qui est specifique
await adminPage.addUser({ employeeName: 'a' });
await adminPage.addUser({ role: 'Admin', employeeName: 'John' });
```

### 2.6 Row builder avec getters — Locators de table lisibles

```typescript
// ❌ ILLISIBLE
await page.getByRole('row', { name: 'Admin' }).getByRole('cell').nth(2);
await page.getByRole('row', { name: 'Admin' }).getByRole('button').first();

// ✅ LISIBLE — un objet qui represente une ligne du tableau
function userRow(page: Page, username: string) {
  const container = page.getByRole('row', { name: username });
  return {
    get container() { return container; },
    get username() { return container.getByRole('cell').nth(1); },
    get role() { return container.getByRole('cell').nth(2); },
    get employeeName() { return container.getByRole('cell').nth(3); },
    get status() { return container.getByRole('cell').nth(4); },
    get deleteBtn() { return container.getByRole('button').first(); },
    get editBtn() { return container.getByRole('button').nth(1); },
  };
}

// Usage
const admin = userRow(page, 'Admin');
await expect(admin.role).toHaveText('Admin');
await expect(admin.status).toHaveText('Enabled');
await admin.deleteBtn.click();
```

**Pourquoi des getters ?**
- `get deleteBtn()` est evalue a chaque acces → pas de stale reference
- Si le DOM change entre deux appels, le getter re-query le DOM
- C'est un pattern "lazy evaluation"

---

## 3. Patterns Playwright avances

### 3.1 `test.step()` — Traces lisibles

**Le probleme :**
Quand un test echoue en CI, la trace montre :
```
locator.click()
locator.fill()
locator.click()
locator.fill()
locator.click() ← FAIL
```
Impossible de savoir OU on en est dans le flux metier.

**La solution :**
```typescript
// Dans les POM
async addUser(config: UserConfig): Promise<string> {
  return await test.step(`Add user "${config.username}" with role ${config.role}`, async () => {
    await test.step('Select user role', async () => {
      await this.page.locator('.oxd-select-text').first().click();
      await this.page.getByRole('option', { name: config.role }).click();
    });

    await test.step('Fill employee name', async () => {
      await this.page.getByPlaceholder('Type for hints...').fill(config.employeeName);
      // ...
    });

    await test.step('Save user', async () => {
      const [response] = await Promise.all([
        this.page.waitForResponse(r => r.url().includes('/api/v2/')),
        this.page.getByRole('button', { name: 'Save' }).click(),
      ]);
    });

    return config.username;
  });
}
```

**Resultat dans la trace :**
```
▼ Add user "qa_1234" with role ESS
  ▼ Select user role
    locator.click()
    locator.click()
  ▼ Fill employee name
    locator.fill()
  ▼ Save user            ← FAIL ICI — on sait exactement ou
    locator.click()
```

### 3.2 `expect.soft()` — ATTENTION : piege courant

**Le piege :** `expect.soft()` ne fait PAS echouer le test !
Si une assertion soft echoue, le test continue ET PASSE. L'erreur est
juste "reportee" dans le rapport. C'est une **fausse securite**.

```typescript
// ❌ DANGEREUX — le test PASSE meme si role = "ESS" au lieu de "Admin"
await expect.soft(admin.role).toHaveText('Admin');
await expect.soft(admin.status).toHaveText('Enabled');
// → Test = VERT, mais le bug passe inapercu

// ✅ Si tu VEUX utiliser soft, TOUJOURS ajouter une verification finale :
await expect.soft(admin.role).toHaveText('Admin');
await expect.soft(admin.status).toHaveText('Enabled');
expect(test.info().errors).toHaveLength(0); // ← FORCE le fail si soft a echoue

// ✅ MIEUX — utiliser expect() normal, tout simplement
await expect(admin.role).toHaveText('Admin');
await expect(admin.status).toHaveText('Enabled');
```

**Regle : preferer `expect()` normal dans 99% des cas.**
`expect.soft()` n'est utile que dans des scenarios de diagnostic
(ex: rapport de compatibilite multi-navigateur) ou le but est de
LISTER les problemes, pas de valider un comportement.

### 3.3 `expect.poll()` — Polling deterministe

```typescript
// ❌ FRAGILE — on espere que networkidle = donnees chargees
await page.waitForLoadState('networkidle');
const count = await page.getByRole('row').count();
expect(count).toBeGreaterThan(1);

// ✅ DETERMINISTE — on poll jusqu'a ce que les donnees soient la
await expect.poll(async () => {
  return await page.getByRole('row').count();
}, {
  timeout: 15_000,
  intervals: [500, 1000, 2000], // retry de plus en plus espace
  message: 'Waiting for user table to load',
}).toBeGreaterThan(1);
```

**Difference avec `toPass()` :**
| | `expect.poll()` | `toPass()` |
|---|---|---|
| Ce qu'il retry | Une fonction qui retourne une valeur | Un bloc entier d'assertions |
| Usage | Attendre une valeur specifique | Retry un scenario complet |
| Clarte | Tres clair | Plus verbeux |

```typescript
// expect.poll — poll une valeur
await expect.poll(() => page.getByRole('row').count()).toBeGreaterThan(1);

// toPass — retry tout le bloc
await expect(async () => {
  const rows = page.getByRole('row');
  await expect(rows).toHaveCount(2);
  await expect(rows.first()).toContainText('Admin');
}).toPass({ timeout: 10_000 });
```

### 3.4 `page.route()` — Mock API pour cas limites

Deja vu dans la discussion. En resume :

```typescript
// Mock une reponse API
await page.route('**/api/v2/leave/leave-balance*', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: { balance: { balance: 0 } } }),
  });
});

// Le navigateur recoit cette fausse reponse
// → L'UI affiche "Insufficient balance"
// → On peut tester un cas impossible a reproduire sur la demo
```

**3 usages :**
1. **Erreur serveur** : `route.fulfill({ status: 500 })`
2. **Donnees specifiques** : solde a 0, liste vide, etc.
3. **Latence** : `route.fulfill({ ... })` apres un `setTimeout`

### 3.5 `test.extend()` — Injection de dependances (remplacement de beforeEach)

Voir section 5 pour le detail complet.

---

## 4. POM — La bonne facon

### Regles

| Regle | Explication |
|-------|-------------|
| Un POM = une page/module | Pas de "GodPage" qui fait tout |
| Methodes = actions utilisateur | `addUser()`, pas `clickSaveButton()` |
| Pas d'assertions dans les POM | Les POM retournent des Locators, les tests assertent |
| Selecteurs prives | Exposer des methodes, pas des `page.locator(...)` |
| `test.step()` dans chaque methode | Pour des traces lisibles |
| Retourner les donnees generees | `addUser()` retourne le username cree |

### Anti-patterns

```typescript
// ❌ POM avec assertion
class AdminPage {
  async addUser(name: string) {
    await this.page.fill('#name', name);
    await this.page.click('button');
    // ↓ INTERDIT — c'est le test qui decide quoi verifier
    await expect(this.page.getByText('Success')).toBeVisible();
  }
}

// ❌ POM qui retourne boolean
class AdminPage {
  async isUserVisible(name: string): Promise<boolean> {
    return await this.page.getByText(name).isVisible();
  }
}
// Pourquoi c'est mauvais ? Si ca retourne false, le test dit "expected true, got false"
// Aucune info sur ce qui s'est passe. Avec un Locator, Playwright montre le DOM.

// ✅ POM qui retourne un Locator
class AdminPage {
  getUserRow(name: string): Locator {
    return this.page.getByRole('row', { name });
  }
}
// Le test fait : await expect(adminPage.getUserRow('John')).toBeVisible();
// Si ca fail, Playwright montre le snapshot du DOM → debug facile
```

---

## 5. Fixtures — Pourquoi beforeEach est un anti-pattern

### Le probleme avec beforeEach

```typescript
// ❌ ANTI-PATTERN
test.describe('Admin', () => {
  let adminPage: AdminUsersPage;

  test.beforeEach(async ({ page }) => {
    adminPage = new AdminUsersPage(page);
    await adminPage.goto();
  });

  test('add user', async ({ page }) => {
    await adminPage.addUser(/* ... */);
  });
});
```

**Pourquoi c'est mauvais :**
1. `adminPage` est declare dans le scope du describe, pas type-safe
2. Si un test n'a pas besoin de `goto()`, il le fait quand meme
3. Impossible de reutiliser entre fichiers sans copier-coller
4. Le `let` mutable est un smell — on peut accidentellement le reassigner

### La solution : `test.extend()`

```typescript
// fixtures/base.fixture.ts
import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { AdminUsersPage } from '../pages/AdminUsersPage';

// On cree un "test" custom qui injecte automatiquement les POM
export const test = base.extend<{
  loginPage: LoginPage;
  adminPage: AdminUsersPage;
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage); // ← injecte dans le test
  },

  adminPage: async ({ page }, use) => {
    const adminPage = new AdminUsersPage(page);
    await adminPage.goto(); // setup
    await use(adminPage);   // ← le test s'execute ici
    // teardown automatique apres le test (si necessaire)
  },
});

export { expect } from '@playwright/test';
```

```typescript
// tests/admin/add-user.spec.ts
import { test, expect } from '../../fixtures/base.fixture';

// adminPage est injecte automatiquement, deja sur la page Admin
test('should add user', async ({ adminPage, page }) => {
  const username = await adminPage.addUser({ employeeName: 'a' });
  await expect(page.getByText('Successfully Saved')).toBeVisible();
});
```

**Avantages :**
| | beforeEach | test.extend |
|---|---|---|
| Type-safe | Non (let) | Oui (parametre de test) |
| Reutilisable | Non (copie) | Oui (import) |
| Lazy | Non (execute toujours) | Oui (execute seulement si utilise) |
| Teardown | afterEach manuel | Integre dans la fixture |
| Scope | 1 fichier | Tous les fichiers |

---

## 6. Locators — Hierarchie et pieges

### Hierarchie de priorite (du plus robuste au moins robuste)

```
1. getByRole()          ← ARIA, stable meme si le HTML change
2. getByLabel()         ← Lie au <label>, accessibilite
3. getByPlaceholder()   ← Placeholder text
4. getByText()          ← Texte visible
5. getByTestId()        ← data-testid (si dispo)
6. locator('.class')    ← CSS — DERNIER RECOURS
```

### Pieges qu'on a rencontres

**Piege 1 : Strict mode violation**
```typescript
// ❌ Matche PLUSIEURS elements
page.getByRole('cell', { name: 'Admin' })
// → "Admin" apparait dans Username ET User Role → 12 matches!

// ✅ Cibler la bonne colonne
page.getByRole('row', { name: 'Admin' }).getByRole('cell').nth(1)
// Ou mieux — le row builder
```

**Piege 2 : Form row contient plusieurs champs**
```typescript
// ❌ La row "Username" contient aussi "Employee Name"
page.locator('.oxd-form-row').filter({ hasText: 'Username' }).getByRole('textbox')
// → 2 textbox : celui de Username ET celui de Employee Name!

// ✅ Cibler la cellule individuelle
page.locator('.oxd-grid-item').filter({ hasText: 'Username' }).getByRole('textbox')
```

**Piege 3 : Toast + texte dans la page = doublon**
```typescript
// ❌ "No Records Found" existe en <span> ET en toast
page.getByText('No Records Found')
// → strict mode violation!

// ✅ Cibler le bon element
page.locator('.oxd-table-body').getByText('No Records Found')
// Ou cibler par type d'element
page.locator('span').filter({ hasText: 'No Records Found' })
```

**Piege 4 : baseURL sans slash finale**
```typescript
// Config
baseURL: 'https://example.com/web/index.php'  // ← PAS DE SLASH

// Code
page.goto('auth/login')
// Resultat : https://example.com/web/auth/login  ← FAUX
// Attendu : https://example.com/web/index.php/auth/login

// ✅ FIX : toujours terminer baseURL par /
baseURL: 'https://example.com/web/index.php/'
```

---

## 7. Assertions — Strategies deterministes

### Types d'assertions

| Type | Usage | Exemple |
|------|-------|---------|
| `expect()` | Assertion bloquante | `await expect(el).toBeVisible()` |
| `expect.soft()` | Non-bloquante, collecte les erreurs | Verification de tableau multi-colonnes |
| `expect.poll()` | Poll une valeur jusqu'a match | Attendre que des donnees apparaissent |
| `toPass()` | Retry un bloc entier | Scenario complet instable |

### Assertions obligatoires par type de test

| Type de test | Assertions minimales |
|---|---|
| Login valide | URL dashboard + heading visible |
| Login invalide | Message d'erreur visible + URL inchangee |
| CRUD Create | Toast succes + element dans la liste |
| CRUD Delete | Toast succes + element absent |
| CRUD Search | Resultats visibles OU "No Records" |
| Securite | Redirection vers login |
| Formulaire | Erreur de validation visible |

---

## 8. Mocking API avec page.route()

### Quand mocker vs tester en reel

| Scenario | Mock ? | Pourquoi |
|----------|--------|----------|
| Happy path login | NON | Tester le vrai flux |
| Happy path CRUD | NON | Tester l'integration reelle |
| Erreur serveur 500 | OUI | Impossible a reproduire sur la demo |
| Solde conge = 0 | OUI | Etat specifique non garanti |
| Timeout reseau | OUI | Non reproductible de facon fiable |
| Donnees vides | OUI | La demo a toujours des donnees |

### Pattern de mock

```typescript
// Helper reutilisable
async function mockApiResponse(
  page: Page,
  urlPattern: string,
  response: { status?: number; data?: unknown }
) {
  await page.route(`**${urlPattern}`, (route) => {
    route.fulfill({
      status: response.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(response.data ?? {}),
    });
  });
}

// Usage
await mockApiResponse(page, '/api/v2/leave/leave-balance*', {
  data: { data: { balance: { balance: 0 } } },
});
```

---

## 9. CI/CD — Configuration pour la stabilite

### playwright.config.ts — les options critiques

```typescript
export default defineConfig({
  timeout: 60_000,           // 60s par test (la demo est lente)
  expect: { timeout: 10_000 }, // 10s pour les assertions

  use: {
    actionTimeout: 15_000,     // 15s par action (click, fill)
    navigationTimeout: 30_000, // 30s pour les navigations

    // TOUJOURS capturer pour le debug en CI
    trace: 'retain-on-failure',    // Trace Playwright complete
    screenshot: 'only-on-failure', // Screenshot au moment du fail
    video: 'retain-on-failure',    // Video du test qui fail

    // Determinisme
    locale: 'en-US',       // Meme locale partout
    timezoneId: 'UTC',     // Meme timezone partout
  },

  // Reporter adapte au contexte
  reporter: CI
    ? [['html', { open: 'never' }], ['github'], ['list']]
    : [['html', { open: 'on-failure' }], ['list']],
});
```

### Pourquoi chaque option existe

| Option | Sans elle | Avec elle |
|--------|-----------|-----------|
| `actionTimeout` | Un click attend 30s (timeout global) | Fail vite si le bouton n'existe pas |
| `trace: retain-on-failure` | "Ca fail en CI" sans aucune info | Trace complete avec DOM snapshot |
| `locale/timezoneId` | Les dates changent selon la machine | Dates identiques partout |
| `video: retain-on-failure` | Debug a l'aveugle | On VOIT ce qui s'est passe |
| `reporter: github` | Erreurs dans les logs bruts | Annotations dans la PR |

---

## 10. Erreurs commises et lecons

### Erreur 1 : baseURL sans slash finale

**Ce qu'on a fait :**
```typescript
baseURL: 'https://opensource-demo.orangehrmlive.com/web/index.php'
// + page.goto('/auth/login')
// = https://opensource-demo.orangehrmlive.com/auth/login  ← FAUX
```

**Lecon :** `new URL('/auth/login', baseURL)` suit la RFC 3986. Un chemin
absolu (`/auth/login`) remplace tout le path du baseURL. Il faut soit :
- Terminer baseURL par `/` et utiliser des chemins relatifs (`auth/login`)
- Soit utiliser le domaine seul comme baseURL

### Erreur 2 : Tests sans navigation initiale (storageState)

**Ce qu'on a fait :**
Les tests avec `storageState` demarraient sur `about:blank` et essayaient
de cliquer sur la sidebar → timeout.

**Lecon :** `storageState` restaure les cookies/localStorage, mais ne
navigue PAS vers une page. Il faut toujours faire un `page.goto()` au
debut, ou le gerer dans `navigateTo()` du BasePage.

### Erreur 3 : Locator trop large (form-row au lieu de grid-item)

**Ce qu'on a fait :**
```typescript
page.locator('.oxd-form-row').filter({ hasText: 'Username' }).getByRole('textbox')
```
La form-row contenait Username + Employee Name → 2 textbox matches.

**Lecon :** Toujours inspecter la structure HTML reelle. Une "row" dans
OrangeHRM contient souvent 2-3 champs. Utiliser `.oxd-grid-item` (la
cellule individuelle) pour isoler un seul champ.

### Erreur 4 : getByText avec texte present dans un toast ET la page

**Ce qu'on a fait :**
```typescript
page.getByText('No Records Found')  // → 2 elements : <span> + toast <p>
```

**Lecon :** Les toasts OrangeHRM dupliquent souvent le texte de la page.
Toujours qualifier le selecteur avec le contexte parent.

### Erreur 5 : beforeEach au lieu de test.extend()

**Ce qu'on a fait :**
```typescript
let adminPage: AdminUsersPage;
test.beforeEach(async ({ page }) => {
  adminPage = new AdminUsersPage(page);
});
```

**Lecon :** `test.extend()` est le pattern officiel Playwright pour
l'injection de dependances. Il est type-safe, reutilisable entre
fichiers, et gere le teardown automatiquement.

### Erreur 6 : Click puis waitForResponse (race condition)

**Ce qu'on a fait :**
```typescript
await button.click();
await page.waitForResponse(predicate);
```

**Lecon :** Toujours utiliser `Promise.all([waitForResponse, click])`.
En CI, la latence est differente → la reponse peut arriver avant que
le listener soit enregistre.

### Erreur 7 : Pas de cleanup (try/finally)

**Ce qu'on a fait :**
Les tests admin creaient des users sans les supprimer.

**Lecon :** Sur une demo partagee, les donnees creees par les tests
polluent l'environnement. Toujours cleanup avec `try/finally` ou
`await using`.

### Erreur 8 : waitForLoadState('networkidle') comme assertion

**Ce qu'on a fait :**
On utilisait `networkidle` pour "attendre que la page soit prete".

**Lecon :** `networkidle` veut dire "pas de requete reseau pendant 500ms".
Ce n'est PAS une garantie que les donnees sont affichees. Utiliser
`expect.poll()` ou `waitForResponse()` pour attendre des donnees specifiques.

---

## 11. Dashboard et Reporting

### Reporters disponibles

| Reporter | Ce qu'il fait | Quand l'utiliser |
|----------|---------------|------------------|
| `html` | Rapport HTML Playwright natif | Toujours — debug local |
| `list` | Sortie console avec progression | Toujours — feedback rapide |
| `github` | Annotations dans les PR GitHub | CI uniquement |
| `allure-playwright` | Dashboard Allure avec graphes et historique | CI + suivi de tendances |
| `json` | Sortie JSON brute | Integration custom |

### Configuration multi-reporter

```typescript
reporter: CI
  ? [['html', { open: 'never' }], ['github'], ['list'], ['allure-playwright']]
  : [['html', { open: 'on-failure' }], ['list'], ['allure-playwright']],
```

### Allure Report — Dashboard visuel

```bash
# Installer
npm install allure-playwright --save-dev

# Lancer les tests (genere allure-results/)
npx playwright test

# Generer le rapport HTML
npx allure generate allure-results -o allure-report --clean

# Ouvrir le dashboard
npx allure open allure-report
```

**Ce que Allure affiche :**
- Graphes de tendance (pass/fail au fil du temps)
- Breakdown par suite/module/severite
- Timeline d'execution
- Les `test.step()` apparaissent comme des sous-etapes visuelles
- Screenshots et traces attachees automatiquement

### Pourquoi `test.step()` est encore plus important avec Allure

```
Sans test.step() dans Allure :
  ▼ should add user
    locator.click()
    locator.fill()
    locator.click()
    FAIL

Avec test.step() dans Allure :
  ▼ should add user
    ▼ Add user "qa_123" with role ESS
      ▼ Select user role        ✅
      ▼ Select employee         ✅
      ▼ Fill username            ✅
      ▼ Submit form              ❌ FAIL — on sait exactement ou
```

### Rapport Playwright natif vs Allure

| | Playwright HTML | Allure |
|---|---|---|
| Installation | Inclus | `npm install allure-playwright` |
| Historique | Non (run unique) | Oui (cumule les runs) |
| Graphes | Non | Oui |
| Tendances | Non | Oui |
| Steps visuels | Basique | Detaille |
| CI integration | Moyen | Excellent (GitHub Actions, Jenkins) |

---

## 12. Checklist avant chaque PR

```
TESTS
[ ] Chaque test a au moins une assertion metier (pas juste toBeVisible sur un titre)
[ ] Les assertions critiques utilisent expect() (bloquant)
[ ] Les assertions de verification utilisent expect.soft() quand pertinent
[ ] Aucun waitForTimeout dans le code
[ ] Aucun .nth() sans commentaire justificatif
[ ] Les tests passent en --workers=1
[ ] Les tests passent avec --grep individuel
[ ] Le nommage exprime l'intention metier

POM
[ ] Aucune assertion dans les Page Objects
[ ] test.step() dans chaque methode publique
[ ] Promise.all pour click + waitForResponse
[ ] Les methodes retournent void ou Locator (jamais boolean)
[ ] Destructuring + defaults pour les parametres

FIXTURES
[ ] test.extend() au lieu de beforeEach pour l'injection
[ ] storageState pour eviter le re-login
[ ] Cleanup avec try/finally ou await using

CONFIG
[ ] actionTimeout defini
[ ] trace: retain-on-failure
[ ] screenshot + video on failure
[ ] locale + timezoneId pour le determinisme
[ ] Reporter CI adapte (github + html)
```

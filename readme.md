![Playwright Tests](https://github.com/DauraRady/Playwright-OrangeHRM/actions/workflows/playwright.yml/badge.svg)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Playwright](https://img.shields.io/badge/Playwright-1.53-45ba4b.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6.svg)
![Node](https://img.shields.io/badge/Node-20.x-339933.svg)

# OrangeHRM — Playwright E2E Test Suite

Tests end-to-end pour la demo publique OrangeHRM, bases sur une strategie **Risk-Based Testing (RBT)**.

On ne teste pas tout. On cible les risques metier critiques avec des tests deterministes et maintenables.

---

## Strategie de test

### Pourquoi RBT ?

La demo OrangeHRM est publique et partagee. Les donnees changent, d'autres utilisateurs les modifient en temps reel. Tester "tout" serait fragile et inutile. On cible :

| Priorite | Module | Risque metier | Tests |
|----------|--------|---------------|-------|
| P0 | Auth | Un defaut de login bloque tout | login valide, credentials invalides, champs vides |
| P0 | Security | Acces non autorise = faille critique | redirect sans session, acces admin |
| P1 | Admin CRUD | Un user mal cree = impossible de travailler | creation, recherche, suppression |
| P1 | PIM | Employe = entite centrale du systeme | ajout employe |
| P1 | Leave | Conges = processus metier le plus utilise | page de demande |
| P2 | Time | Pointage = moins critique, souvent optionnel | page punch in/out |

### Happy paths en E2E reel, edge cases en mock

- **Happy paths** : testent le vrai flux contre l'app reelle (pas de mock)
- **Edge cases** : utilisent `page.route()` pour simuler erreurs serveur, donnees vides, etc.

---

## Architecture

```
orangehrm-tests/
├── playwright.config.ts         # Config : baseURL, timeouts, traces, projets auth
├── .env / .env.example          # Credentials (gitignored)
│
├── fixtures/
│   ├── auth.setup.ts            # StorageState — login admin une seule fois
│   ├── base.fixture.ts          # test.extend() — injection des POM
│   └── test-data.ts             # USERS, uniqueUsername(), UserConfig
│
├── pages/                       # Page Object Model
│   ├── BasePage.ts              # navigateTo() + waitForToast()
│   ├── LoginPage.ts             # goto() + login() + getErrorMessage()
│   ├── AdminUsersPage.ts        # addUser() + searchUser() + deleteUser() + getUserRow()
│   ├── LeavePage.ts             # goToApply() + applyForLeave()
│   ├── PimPage.ts               # addEmployee() + searchEmployee()
│   └── TimePage.ts              # goToPunchInOut() + punchIn() + punchOut()
│
├── helpers/
│   ├── user.helper.ts           # withTempUser() (AsyncDisposable) + create/deleteTestUser()
│   └── navigation.helper.ts     # navigateToModule()
│
├── tests/
│   ├── auth/                    # Login valide + cas negatifs (5 tests)
│   ├── admin/                   # CRUD utilisateurs (4 tests)
│   ├── leave/                   # Demande de conges (2 tests)
│   ├── pim/                     # Ajout employe (1 test)
│   ├── security/                # Controle d'acces (3 tests)
│   └── time/                    # Pointage (1 test)
│
└── docs/
    ├── cours-playwright-patterns.md   # Cours complet patterns JS + Playwright
    ├── playwright-skill-prompt.md     # Skill/prompt reutilisable pour tout projet
    └── qa-risk-analysis-orangehrm.md  # Analyse de risques initiale
```

---

## Patterns utilises

### JavaScript

| Pattern | Usage dans le projet |
|---------|---------------------|
| `Promise.all` | Click + waitForResponse — anti race condition |
| `Promise.race` | Detecter succes vs erreur apres un formulaire |
| `try/finally` | Cleanup garanti des users crees dans les tests |
| `await using` + `AsyncDisposable` | Cleanup automatique via `withTempUser()` |
| Destructuring + defaults | Parametres nommes dans les POM (`addUser({ role, ... })`) |
| Row builder (getters) | `getUserRow('Admin').role` — locators de table lisibles |

### Playwright

| Pattern | Usage dans le projet |
|---------|---------------------|
| `test.extend()` | Injection des POM — remplace `beforeEach` |
| `test.step()` | Traces lisibles dans chaque methode POM |
| `expect.soft()` | Assertions multiples non-bloquantes (colonnes de table) |
| `expect.poll()` | Attente deterministe de donnees dynamiques |
| `page.route()` | Mock API pour simuler erreurs serveur |
| `storageState` | Session admin sauvegardee, reutilisee par tous les tests |

---

## Configuration

### Prealables

```bash
npm install
npx playwright install chromium
```

### Variables d'environnement

```bash
cp .env.example .env
# Modifier si necessaire (les valeurs par defaut fonctionnent avec la demo)
```

### Lancer les tests

```bash
# Tous les tests
npx playwright test

# Un module specifique
npx playwright test --project=auth-tests
npx playwright test --project=admin-tests

# Un test par nom
npx playwright test --grep "should redirect admin"

# Mode debug (navigateur visible + pause)
npx playwright test --headed --debug

# Sequentiel (comme en CI)
npx playwright test --workers=1

# Rapport HTML
npx playwright show-report
```

### CI/CD

En CI, la config active automatiquement :
- `retries: 2` — retry les tests instables
- `workers: 1` — execution sequentielle
- `trace: retain-on-failure` — trace complete pour debug
- `reporter: github` — annotations dans la PR
- `screenshot + video` — captures au moment du fail

---

## Decisions techniques

### Pourquoi `test.extend()` au lieu de `beforeEach` ?

`beforeEach` cree une variable mutable (`let`) dans le scope du describe. Ce n'est pas type-safe, pas reutilisable, et execute le setup meme si le test n'en a pas besoin.

`test.extend()` injecte les POM comme parametres de test : type-safe, lazy (execute seulement si utilise), reutilisable entre fichiers.

### Pourquoi `Promise.all` pour les clicks ?

Sans `Promise.all`, on fait `click()` puis `waitForResponse()`. Si la reponse arrive avant que le listener soit enregistre, le test hang. `Promise.all` enregistre le listener AVANT le click.

### Pourquoi `expect.poll()` au lieu de `networkidle` ?

`networkidle` signifie "pas de requete reseau pendant 500ms". Ca ne garantit PAS que les donnees sont affichees dans le DOM. `expect.poll()` verifie le DOM directement.

### Pourquoi des mocks pour certains tests ?

La demo est partagee. Certains etats (solde de conge = 0, erreur serveur) sont impossibles a reproduire de facon fiable. `page.route()` intercepte les requetes du navigateur pour simuler ces cas.

---

## Documentation

- `docs/cours-playwright-patterns.md` — Cours complet sur les patterns JS et Playwright
- `docs/playwright-skill-prompt.md` — Prompt/skill reutilisable pour tout nouveau projet
- `docs/qa-risk-analysis-orangehrm.md` — Analyse de risques qui a guide la selection des tests

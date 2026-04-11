# 🔍 Analyse QA Risk-Based — Repository OrangeHRM Playwright TS

**Date** : 11 avril 2026
**Repo** : `OrangeHRM-rbt-playwright`
**Stack** : Playwright + TypeScript
**Cible** : [https://opensource-demo.orangehrmlive.com](https://opensource-demo.orangehrmlive.com)

---

## 1. Résumé exécutif

Ce repo est un projet de tests E2E Playwright TypeScript ciblant la démo publique OrangeHRM. Il affiche une ambition de couverture Risk-Based Testing dans sa documentation, mais **la réalité du code est très en dessous de la promesse**.

**Constat en une phrase** : la stratégie de test écrite est solide sur le papier, mais le code livré n'en implémente qu'une fraction, avec des anti-patterns de flakiness majeurs et aucune architecture de test (pas de POM, pas de helpers, pas de fixtures, pas de data management).

### Verdict rapide

| Dimension | Score | Commentaire |
|---|---|---|
| Couverture métier réelle | 🔴 ~15% | Seul le module Admin est partiellement couvert |
| Qualité des tests existants | 🟠 Faible | Locators fragiles, pas d'attente réseau, assertions minimales |
| Architecture test | 🔴 Absente | Pas de POM, pas de helpers, pas de fixtures |
| Alignement doc/code | 🔴 Fort écart | README promet POM + pytest + Python, code = TS sans structure |
| Risque de flakiness | 🔴 Très élevé | Données partagées, pas de wait réseau, sélecteurs nth() |
| CI/CD | 🟢 Présent | GitHub Actions configuré correctement |
| Exploitabilité en l'état | 🔴 Non fiable | Tests non exécutables de manière déterministe |

---

## 2. Documentation lue

### 2.1 Fichiers analysés

| Fichier | Rôle | Lu |
|---|---|---|
| `readme.md` | Présentation projet | ✅ |
| `Docs/Orange_HRM.md` | Fonctionnement applicatif OrangeHRM | ✅ |
| `Docs/Strategie_de_test.md` | Stratégie QA complète (RBT) | ✅ |
| `playwright.config.ts` | Configuration Playwright | ✅ |
| `package.json` | Dépendances | ✅ |
| `.github/workflows/orangehrm-ci.yml` | Pipeline CI | ✅ |
| `tests/test_adminmgt.spec.ts` | Unique fichier de test | ✅ |

### 2.2 Observations sur la documentation

La documentation est **ambitieuse et structurée** : stratégie RBT avec scoring P×I×V, matrice de risques, KPI par fonctionnalité, plan de sprints QA. C'est un bon travail de réflexion stratégique.

**Mais** : elle décrit un projet qui n'existe pas encore dans le code.

---

## 3. Écarts critiques entre README et code

| Ce que dit le README | Ce que montre le code | Sévérité |
|---|---|---|
| Stack : Playwright + **Python** + **Pytest** | Stack réelle : Playwright + **TypeScript** | 🔴 Incohérence majeure |
| Structure : `pages/` (POM), `utils/`, `data/` | Réalité : aucun de ces dossiers n'existe | 🔴 Structure fantôme |
| POM mentionné : `LoginPage.ts`, `DashboardPage.ts`, `LeavePage.ts` | Aucun Page Object n'existe | 🔴 |
| `data/users.json` | Aucun fichier de données | 🟠 |
| Tests Leave, PIM, Login séparés | Un seul fichier : `test_adminmgt.spec.ts` | 🔴 |
| Rapports `pytest-html` | Reporter = HTML Playwright (par défaut) | 🟡 Mineur |
| `baseURL` documenté dans la structure | `baseURL` commenté dans `playwright.config.ts` | 🟠 |

**Impact** : un nouveau contributeur qui lit le README sera induit en erreur sur la stack, l'architecture et l'état d'avancement du projet. Le README décrit un état cible, pas l'état actuel.

---

## 4. Tests existants — Audit détaillé

### 4.1 Inventaire

Un seul fichier : `tests/test_adminmgt.spec.ts` contenant 4 tests dans un `describe("Admin management")` :

| Test | Intention | Assertions |
|---|---|---|
| `Admin Login` | Vérifier la redirection post-login | 1 (`toHaveURL`) |
| `Admin Add User` | Créer un utilisateur ESS | 0 ❌ |
| `Admin Search User` | Rechercher un utilisateur | 0 ❌ |
| `Admin Delete User` | Supprimer un utilisateur | 1 (`toBeVisible` sur toast) |

### 4.2 Grille d'audit par test

#### TC: Admin Login

| Dimension | Évaluation | Détail |
|---|---|---|
| Valeur métier | **Forte** | L'authentification est P0 |
| Déterminisme | **Moyen** | Pas de wait réseau après login |
| Flakiness | **Moyenne** | Dépend du temps de chargement du dashboard |
| Lisibilité | **Bonne** | Simple et clair |
| Assertions | **Minimale** | Vérifie seulement l'URL, pas le contenu du dashboard |
| Décision | **Refactorer** | Ajouter wait réseau + assertion sur élément visible |

#### TC: Admin Add User

| Dimension | Évaluation | Détail |
|---|---|---|
| Valeur métier | **Forte** | Création d'utilisateur = flux critique |
| Déterminisme | **Faible** | Dépend de l'existence de "Emily Atkinson" dans la démo |
| Flakiness | **Très élevée** | `.nth(2)`, `.nth(3)`, `.nth(4)` — sélecteurs par index |
| Assertions | **Aucune** ❌ | Le test clique partout mais ne vérifie RIEN |
| Lisibilité | **Mauvaise** | Impossible de comprendre les `.nth()` sans ouvrir l'app |
| Décision | **Refactorer totalement** | Ajouter assertions, remplacer nth() par des locators sémantiques |

#### TC: Admin Search User

| Dimension | Évaluation | Détail |
|---|---|---|
| Valeur métier | **Moyenne** | La recherche n'est pas un flux critique isolé |
| Déterminisme | **Faible** | Données dépendantes de l'état de la démo |
| Assertions | **Aucune** ❌ | Aucune vérification du résultat de recherche |
| Décision | **Refactorer ou supprimer** | Sans assertion, ce test ne protège rien |

#### TC: Admin Delete User

| Dimension | Évaluation | Détail |
|---|---|---|
| Valeur métier | **Forte** | Suppression = action irréversible |
| Déterminisme | **Très faible** | Dépend du test "Add User" exécuté avant |
| Flakiness | **Critique** | Sélecteur row avec nom exact `" daura ESS Emily Atkinson"` |
| Couplage | **Fort** | Échoue si Add User n'a pas tourné avant dans le même run |
| Assertions | **Présente** | Vérifie le toast "Successfully Deleted" |
| Décision | **Refactorer** | Isoler la création de données, robustifier les locators |

### 4.3 Synthèse de l'audit

| Métrique | Valeur |
|---|---|
| Nombre de tests | 4 |
| Tests avec au moins 1 assertion | 2 / 4 (50%) |
| Tests sans aucune assertion | 2 / 4 (50%) ❌ |
| Tests dépendants de l'ordre d'exécution | 1 (Delete dépend de Add) ❌ |
| Locators `.nth()` fragiles | 3 occurrences ❌ |
| Locators `getByRole` / `getByPlaceholder` | ~60% des interactions ✅ |
| Wait réseau (`waitForResponse`, `waitForURL`) | 0 ❌ |
| Page Objects utilisés | 0 ❌ |
| Fixtures / helpers | 0 ❌ |
| Gestion des données de test | Aucune ❌ |

### 4.4 Anti-patterns détectés

1. **Tests sans assertion** — Admin Add User et Admin Search User ne vérifient rien. Ce sont des scripts de navigation, pas des tests.

2. **Sélecteurs `.nth()` sans contexte** — `.getByRole("textbox").nth(2)` est un pari sur l'ordre du DOM. Un champ ajouté ou supprimé par l'app casse tout.

3. **Couplage inter-tests** — Delete User cherche spécifiquement `" daura ESS Emily Atkinson"`, nom créé par Add User. Si Add User échoue ou ne tourne pas, Delete User échoue en cascade.

4. **Données non maîtrisées** — Les tests utilisent des données live de la démo publique (`Emily Atkinson`). Cette donnée peut disparaître à tout moment (la démo est réinitialisée régulièrement).

5. **Pas de wait après les actions critiques** — Après `click("Save")`, aucun `waitForResponse` ou `waitForURL`. Le test continue immédiatement, ce qui crée du flaky sur les connexions lentes.

6. **`form i` comme sélecteur** — `page.locator("form i").nth(1).click()` cible une icône par position dans le formulaire. Extrêmement fragile.

7. **Login dupliqué dans beforeEach sans abstraction** — Le même code de login est inline dans le `beforeEach`. Pas de helper, pas de fixture, pas de `storageState`.

---

## 5. Cartographie fonctionnelle OrangeHRM

### 5.1 Modules et capacités métier

| Module | Capacités métier | Rôles concernés | Données sensibles |
|---|---|---|---|
| **Auth/Login** | Connexion, redirection par rôle, session | Tous | Credentials |
| **Admin** | CRUD utilisateurs, rôles, config système | Admin | Droits d'accès |
| **PIM** | Fiche employé complète (perso, job, salaire, docs) | Admin, ESS | Données personnelles, salaires |
| **Leave** | Demande, validation, solde, calendrier absences | ESS, Superviseur, Admin | Soldes congés |
| **Time** | Timesheets, punch in/out, plannings | ESS, Superviseur | Heures travaillées |
| **Recruitment** | Offres, candidatures, entretiens | Admin | CV, données candidats |
| **ESS** | Portail libre-service employé | ESS | Infos personnelles |

### 5.2 Parcours utilisateur critiques identifiés

| ID | Parcours | Acteur | Impact si KO |
|---|---|---|---|
| **P-001** | Login Admin → Dashboard | Admin | Blocage total |
| **P-002** | Login ESS → Portail employé | Employé | Pas d'accès au self-service |
| **P-003** | Login Superviseur → Vue subordonnés | Superviseur | Pas de validation possible |
| **P-004** | Admin crée un employé (PIM) | Admin | Onboarding bloqué |
| **P-005** | Employé demande un congé | ESS | Processus RH bloqué |
| **P-006** | Superviseur valide un congé | Superviseur | File d'attente congés |
| **P-007** | Employé fait un Punch in/out | ESS | Suivi temps KO |
| **P-008** | Admin gère les utilisateurs système | Admin | Sécurité + accès |
| **P-009** | Employé met à jour ses infos perso | ESS | Données obsolètes |
| **P-010** | Admin exporte un rapport | Admin | Reporting KO |

---

## 6. Matrice de risques

### 6.1 Critères de scoring

| Critère | Description | Échelle |
|---|---|---|
| **CM** — Criticité métier | Impact sur le revenu, la conformité, la sécurité, les opérations | 1–5 |
| **IU** — Impact utilisateur | Blocage, dégradation, perte de confiance | 1–5 |
| **PO** — Probabilité d'occurrence | Fréquence d'usage + historique bugs | 1–5 |
| **CT** — Complexité technique | Async, état, intégrations, calculs | 1–5 |
| **DF** — Détectabilité faible | Bug difficile à voir tôt | 1–5 |
| **AU** — Automatisabilité | Capacité à fiabiliser un test Playwright | 1–5 |

**Formules** :
- Risque brut = CM × IU × PO
- Risque ajusté = Risque brut + CT + DF
- Priorité automatisation = Risque ajusté × AU

### 6.2 Matrice complète

| Fonctionnalité | CM | IU | PO | Risque brut | CT | DF | Risque ajusté | AU | Priorité auto | Classe |
|---|---|---|---|---|---|---|---|---|---|---|
| Login multi-rôles (Admin/ESS/Sup) | 5 | 5 | 5 | 125 | 2 | 1 | 128 | 5 | **640** | 🔴 P0 |
| Demande de congé (ESS) | 5 | 4 | 5 | 100 | 3 | 2 | 105 | 4 | **420** | 🔴 P0 |
| Validation congé (Superviseur) | 5 | 4 | 4 | 80 | 3 | 3 | 86 | 4 | **344** | 🔴 P0 |
| Création employé (PIM) | 4 | 4 | 4 | 64 | 3 | 2 | 69 | 4 | **276** | 🟠 P1 |
| CRUD utilisateurs système (Admin) | 4 | 3 | 3 | 36 | 2 | 2 | 40 | 4 | **160** | 🟠 P1 |
| Sécurité accès inter-rôles | 5 | 5 | 3 | 75 | 2 | 4 | 81 | 3 | **243** | 🟠 P1 |
| Punch in/out | 3 | 3 | 4 | 36 | 3 | 3 | 42 | 3 | **126** | 🟡 P2 |
| MAJ fiche employé (ESS) | 3 | 3 | 3 | 27 | 2 | 2 | 31 | 3 | **93** | 🟡 P2 |
| Recherche employés | 2 | 2 | 4 | 16 | 1 | 1 | 18 | 4 | **72** | 🟡 P2 |
| Export rapports CSV | 2 | 2 | 2 | 8 | 2 | 2 | 12 | 2 | **24** | ⚪ P3 |
| Recrutement | 3 | 2 | 2 | 12 | 3 | 3 | 18 | 2 | **36** | ⚪ P3 |

---

## 7. Trous de couverture

### 7.1 Ce qui est couvert vs ce qui devrait l'être

| Fonctionnalité | Couvert par les tests actuels ? | Priorité selon la matrice | Gap |
|---|---|---|---|
| Login Admin | ✅ Partiel (URL only) | P0 | Assertion insuffisante |
| Login ESS | ❌ | P0 | **Trou critique** |
| Login Superviseur | ❌ | P0 | **Trou critique** |
| Login négatif (mauvais mdp, injection) | ❌ | P0 | **Trou critique** |
| Demande de congé | ❌ | P0 | **Trou critique** |
| Validation congé par superviseur | ❌ | P0 | **Trou critique** |
| Création employé PIM | ❌ | P1 | **Trou majeur** |
| CRUD utilisateurs Admin | ✅ Partiel (sans assertions) | P1 | Qualité insuffisante |
| Sécurité inter-rôles | ❌ | P1 | **Trou majeur** |
| Punch in/out | ❌ | P2 | À planifier |
| MAJ fiche ESS | ❌ | P2 | À planifier |
| Export rapport | ❌ | P3 | Manuel/exploratoire |

### 7.2 Bilan

- **Couverture métier réelle estimée : ~15%**
- **Couverture des flux P0 : 0% exploitable** (le login est couvert mais avec une assertion insuffisante)
- **Modules entiers non testés** : Leave, Time, PIM, Recruitment, ESS, sécurité inter-rôles

---

## 8. Proposition de scénarios prioritaires

### 🔴 P0 — À automatiser en premier

#### TC-P0-001 — Login Admin valide → Dashboard
- **Objectif métier** : l'admin accède au système
- **Risque ciblé** : blocage total de l'administration RH
- **Préconditions** : compte Admin par défaut disponible
- **Étapes** : saisir credentials → cliquer Login → attendre navigation
- **Oracle** : URL dashboard + élément identifiant le dashboard visible + menu latéral affiché
- **Niveau recommandé** : E2E Playwright
- **Automatisable** : Oui
- **Risque flakiness** : Faible si wait réseau après login
- **Déterminisation** : `waitForURL` + `waitForResponse` sur l'API dashboard + assertion `getByRole`

#### TC-P0-002 — Login ESS valide → Portail employé
- **Objectif métier** : un employé accède à son espace
- **Préconditions** : compte ESS existant
- **Oracle** : URL appropriée + menu ESS visible + dashboard employé chargé
- **Niveau** : E2E

#### TC-P0-003 — Login invalide → Message d'erreur
- **Objectif métier** : sécurité basique de l'authentification
- **Risque ciblé** : accès non autorisé
- **Variantes** : mauvais mdp, mauvais username, champs vides, caractères spéciaux
- **Oracle** : message "Invalid credentials" visible + pas de redirection
- **Niveau** : E2E

#### TC-P0-004 — Demande de congé complète (ESS)
- **Objectif métier** : un employé demande un congé et le flux aboutit
- **Risque ciblé** : processus RH bloqué
- **Préconditions** : compte ESS avec solde de congés suffisant
- **Étapes** : naviguer Leave → Apply → sélectionner type + dates → soumettre
- **Oracle** : confirmation affichée + demande visible dans la liste + solde impacté
- **Niveau** : E2E
- **Risque flakiness** : Moyen — date picker, données de solde
- **Déterminisation** : utiliser des dates futures stables, attendre réponse API avant assertion

#### TC-P0-005 — Demande de congé refusée (solde insuffisant)
- **Objectif métier** : le système protège contre les demandes invalides
- **Oracle** : message d'erreur clair + demande non enregistrée
- **Niveau** : E2E

#### TC-P0-006 — Validation d'un congé par le superviseur
- **Objectif métier** : le workflow de validation fonctionne entre 2 rôles
- **Préconditions** : demande de congé en attente (créée par ESS)
- **Étapes** : login superviseur → Leave → liste demandes → approuver
- **Oracle** : statut changé en "Approved" + notification/historique
- **Risque flakiness** : Élevé — dépend d'un état créé par un autre rôle
- **Déterminisation** : créer la demande via beforeEach ou API setup, pas via un autre test

### 🟠 P1 — Très utiles

#### TC-P1-001 — Création d'un employé complet (PIM)
- **Objectif** : onboarding fonctionne
- **Étapes** : Admin → PIM → Add Employee → remplir champs obligatoires → Save
- **Oracle** : employé visible dans la liste + fiche accessible
- **Niveau** : E2E
- **Déterminisation** : nom unique généré (timestamp), cleanup en afterEach si possible

#### TC-P1-002 — Sécurité : ESS ne voit pas le menu Admin
- **Objectif** : isolation des rôles
- **Étapes** : login ESS → vérifier absence du lien Admin dans le menu
- **Oracle** : le lien "Admin" n'est PAS dans le DOM ou n'est pas visible
- **Niveau** : E2E
- **Déterminisation** : assertion `not.toBeVisible()` ou `toHaveCount(0)`

#### TC-P1-003 — Sécurité : ESS ne peut pas accéder à /admin par URL directe
- **Objectif** : protection contre la navigation directe
- **Étapes** : login ESS → `page.goto('/admin')` → vérifier redirection ou erreur
- **Oracle** : redirection vers dashboard ESS ou page 403
- **Niveau** : E2E

#### TC-P1-004 — Admin CRUD utilisateur complet (Add → Search → Delete)
- **Objectif** : refactoring du test existant avec assertions et isolation
- **Niveau** : E2E
- **Déterminisation** : chaque action (add, search, delete) = test indépendant avec son propre setup

### 🟡 P2 — Importants plus tard

#### TC-P2-001 — Punch In / Punch Out
- **Objectif** : le suivi du temps fonctionne
- **Niveau** : E2E, potentiellement difficile à stabiliser (horodatage)
- **Risque flakiness** : Élevé — dépend du timing serveur

#### TC-P2-002 — Mise à jour infos personnelles (ESS)
- **Objectif** : l'employé peut modifier ses données
- **Niveau** : E2E

#### TC-P2-003 — Recherche employé avec filtres
- **Objectif** : les filtres fonctionnent
- **Niveau** : E2E, mais API serait plus fiable pour la logique de filtrage

### ⚪ P3 — Manuel / Exploratoire

#### TC-P3-001 — Export rapport CSV
- **Objectif** : le fichier est généré et lisible
- **Niveau** : Manuel ou E2E avec vérification download

#### TC-P3-002 — Module Recrutement (création offre + candidature)
- **Objectif** : le flux recrutement fonctionne
- **Niveau** : Manuel exploratoire d'abord, automatisation si stabilisé

---

## 9. Recommandations de niveau de test

| Scénario | E2E UI | API | Manuel | Pourquoi |
|---|---|---|---|---|
| Login multi-rôles | ✅ | — | — | Le comportement UI (redirection, menu) EST le test |
| Demande congé | ✅ | ✅ (solde) | — | UI pour le parcours, API pour vérifier le solde serveur |
| Validation congé | ✅ | — | — | Workflow inter-rôles = E2E |
| Création employé | ✅ | — | — | Formulaire complexe = E2E |
| Sécurité rôles | ✅ | ✅ | — | UI pour menu, API pour les endpoints protégés |
| Punch in/out | ⚠️ | ✅ | ✅ | API plus fiable que l'UI pour le timing |
| Export CSV | — | — | ✅ | Vérification visuelle du contenu |
| Mise à jour fiche | ✅ | — | — | Formulaire simple, stable |

---

## 10. Risques de flakiness et contremesures

### 10.1 Risques identifiés dans le repo actuel

| Risque | Source | Sévérité | Contremesure |
|---|---|---|---|
| **Sélecteurs `.nth()`** | `test_adminmgt.spec.ts` lignes nth(2), nth(3), nth(4) | 🔴 Critique | Remplacer par `getByLabel`, `getByPlaceholder`, ou `getByTestId` |
| **Sélecteur `form i`** | `page.locator("form i").nth(1)` | 🔴 Critique | Identifier le dropdown par son label ou son rôle |
| **Pas de wait réseau** | Aucun `waitForResponse` après Save/Login | 🔴 Critique | Ajouter `waitForResponse` sur les appels API clés |
| **Données démo volatiles** | "Emily Atkinson" peut ne plus exister | 🟠 Élevé | Créer ses propres données en setup, ou valider l'existence avant |
| **Couplage Delete→Add** | Delete cherche un user créé par Add | 🔴 Critique | Chaque test crée et nettoie ses propres données |
| **Row selector avec texte exact** | `" daura ESS Emily Atkinson"` avec espace initial | 🔴 Critique | Utiliser un sélecteur plus souple ou data-testid |
| **Pas de baseURL** | URL en dur dans `page.goto()` | 🟡 Moyen | Activer `baseURL` dans la config |
| **Login en beforeEach sans storageState** | Re-login à chaque test via UI | 🟡 Moyen | Utiliser `storageState` pour les tests non-login |

### 10.2 Checklist déterminisme pour les futurs tests

- [ ] Le test part d'un état connu (login fait, données créées)
- [ ] Les données sont créées par le test ou par un setup dédié
- [ ] Chaque assertion attend un signal fiable (`waitForResponse`, `waitForURL`, auto-retry Playwright)
- [ ] Aucun `waitForTimeout` n'est utilisé
- [ ] Les locators sont sémantiques (`getByRole`, `getByLabel`, `getByPlaceholder`)
- [ ] Le test fonctionne seul, sans dépendance à l'ordre d'exécution
- [ ] Le test fonctionne en local ET en CI
- [ ] Le nom du test exprime l'intention métier, pas les clics

---

## 11. Plan d'action : Garder / Refactorer / Supprimer / Ajouter

### 11.1 Tests existants

| Test | Décision | Raison | Action concrète |
|---|---|---|---|
| Admin Login | **Refactorer** | Bonne intention, assertion insuffisante | Ajouter wait réseau + assertion sur élément dashboard + extraire le login dans un helper |
| Admin Add User | **Refactorer totalement** | Zéro assertion, sélecteurs fragiles | Réécrire avec locators sémantiques + assertions + nom unique + cleanup |
| Admin Search User | **Supprimer** | Aucune assertion, aucune valeur en l'état | Réécrire dans un vrai scénario de recherche avec vérification des résultats |
| Admin Delete User | **Refactorer** | Assertion présente mais couplé à Add User | Isoler avec son propre setup, robustifier les sélecteurs |

### 11.2 Architecture à créer

| Élément | Priorité | Description |
|---|---|---|
| `pages/LoginPage.ts` | P0 | Page Object pour le login (fill + submit + waitForNav) |
| `pages/AdminPage.ts` | P1 | Page Object pour la gestion des utilisateurs |
| `pages/LeavePage.ts` | P0 | Page Object pour les congés |
| `pages/DashboardPage.ts` | P1 | Page Object pour le dashboard |
| `helpers/auth.helper.ts` | P0 | Helper login avec `storageState` pour éviter le re-login UI |
| `helpers/user.helper.ts` | P1 | Helper CRUD utilisateur (create/delete pour setup/teardown) |
| `fixtures/test-data.ts` | P0 | Données de test centralisées (noms, credentials, dates) |
| `playwright.config.ts` | P0 | Activer `baseURL`, configurer `storageState` |

### 11.3 Scénarios à ajouter (par ordre de priorité)

| Priorité | Scénario | Sprint cible |
|---|---|---|
| P0 | Login ESS + Superviseur | Sprint 1 |
| P0 | Login négatif | Sprint 1 |
| P0 | Demande de congé (happy path) | Sprint 1 |
| P0 | Demande de congé (solde insuffisant) | Sprint 1 |
| P0 | Validation congé par superviseur | Sprint 2 |
| P1 | Création employé PIM | Sprint 2 |
| P1 | Sécurité inter-rôles (menu + URL directe) | Sprint 2 |
| P1 | CRUD utilisateur Admin (refactoré) | Sprint 2 |
| P2 | Punch in/out | Sprint 3 |
| P2 | MAJ fiche ESS | Sprint 3 |
| P3 | Export CSV | Manuel |
| P3 | Recrutement | Exploratoire |

---

## 12. Dette de testabilité

### 12.1 Dette du repo

| Dette | Impact | Effort de correction |
|---|---|---|
| Pas de POM | Duplication, maintenance impossible à l'échelle | Moyen — à créer incrémentalement |
| Pas de `baseURL` | URL en dur, pas de switch d'environnement | Faible — 1 ligne dans config |
| Pas de `storageState` | Re-login UI à chaque test = lent + fragile | Moyen — setup fixture auth |
| README décalé | Confusion pour les contributeurs | Faible — mise à jour texte |
| Pas de `.env` | Credentials en dur dans le code | Faible — dotenv + `.env.example` |
| Aucun helper | Logique de login/navigation dupliquée | Moyen |
| Pas de cleanup | Les données créées restent dans la démo | Moyen — afterEach + helper delete |

### 12.2 Dette de l'application cible

| Contrainte | Impact sur les tests |
|---|---|
| Démo publique partagée | Les données changent entre les runs — aucune isolation possible |
| Pas de data-testid | Locators limités aux rôles ARIA et texte |
| Pas d'API documentée | Impossible de faire du setup/teardown API propre |
| Réinitialisation périodique | Les données créées par les tests sont purgées |
| Lenteur de l'app | Risque de timeout si les waits ne sont pas calibrés |

---

## 13. Pistes exploratoires

En plus des tests automatisés, les zones suivantes méritent un **test exploratoire humain** :

1. **Session expirée** : que se passe-t-il si on laisse la session ouverte 30 min puis on clique ?
2. **Multi-onglets** : login Admin dans un onglet, ESS dans un autre — conflit de session ?
3. **Injection dans les champs de recherche** : `<script>alert(1)</script>` ou `' OR 1=1 --` dans le champ "Type for hints"
4. **Dates limites dans les congés** : demander un congé avec date passée, date = aujourd'hui, date > 1 an
5. **Permissions croisées** : un ESS qui modifie l'URL pour accéder à `/pim/addEmployee`
6. **Upload de fichiers douteux** : `.exe`, fichier de 100 Mo, fichier avec nom en caractères spéciaux dans PIM
7. **Responsive** : l'app est-elle utilisable sur mobile ? Le menu latéral se comporte-t-il bien ?
8. **Double soumission** : cliquer 2 fois rapidement sur "Save" lors de la création d'un employé

---

## 14. Recommandations finales

### Ce qui est bien dans le repo
- La stratégie de test documentée est sérieuse et bien structurée (RBT, KPI, matrice)
- La CI GitHub Actions est en place et fonctionnelle
- Le choix de Playwright + TypeScript est pertinent
- Les tests existants montrent une compréhension de l'app

### Ce qui doit changer immédiatement
1. **Aligner le README avec la réalité** (TypeScript, pas Python)
2. **Ajouter des assertions dans TOUS les tests** — un test sans assertion = 0 valeur
3. **Créer les Page Objects** pour le login en priorité
4. **Activer `baseURL`** dans `playwright.config.ts`
5. **Isoler les tests** — aucun test ne doit dépendre d'un autre
6. **Remplacer les `.nth()` et `form i`** par des locators sémantiques

### La bonne question
> **"Ce repo a 4 tests. Combien protègent réellement un risque métier ?"**
> Réponse : **1 sur 4** (le login, et encore partiellement).
> Les 3 autres sont des scripts de navigation déguisés en tests.

Le travail de documentation stratégique est solide. Il faut maintenant que le code rattrape la stratégie.

---

*Analyse générée le 11 avril 2026 — livrable exploitable en backlog QA.*

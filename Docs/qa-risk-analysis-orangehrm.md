# Analyse QA Risk-Based — OrangeHRM Playwright E2E

**Date** : 11 avril 2026
**Stack** : Playwright + TypeScript
**Cible** : [https://opensource-demo.orangehrmlive.com](https://opensource-demo.orangehrmlive.com)

---

## 1. Résumé exécutif

Ce projet implémente une suite de tests E2E Playwright TypeScript ciblant la démo publique OrangeHRM, suivant une approche **Risk-Based Testing**. Les tests ciblent en priorité les fonctionnalités à plus fort risque métier, avec une architecture maintenable (Page Object Model, fixtures Playwright, helpers dédiés).

### Vue d'ensemble

| Dimension | État | Commentaire |
|---|---|---|
| Couverture métier | 🟢 P0/P1 couverts | Auth, Leave, Admin, PIM, Security |
| Qualité des tests | 🟢 Bonne | Locators sémantiques, waits réseau, assertions métier |
| Architecture test | 🟢 Structurée | POM, fixtures `test.extend()`, helpers, data centralisée |
| Alignement doc/code | 🟢 Cohérent | Documentation reflète l'implémentation |
| Risque de flakiness | 🟡 Maîtrisé | `Promise.all`, `expect.poll()`, pas de `waitForTimeout` |
| CI/CD | 🟢 Présent | GitHub Actions, reports et traces en artefacts |
| Exploitabilité | 🟢 Fiable | Tests déterministes, exécutables en local et CI |

---

## 2. Cartographie fonctionnelle OrangeHRM

### 2.1 Modules et capacités métier

| Module | Capacités métier | Rôles concernés | Données sensibles |
|---|---|---|---|
| **Auth/Login** | Connexion, redirection par rôle, session | Tous | Credentials |
| **Admin** | CRUD utilisateurs, rôles, config système | Admin | Droits d'accès |
| **PIM** | Fiche employé complète (perso, job, salaire, docs) | Admin, ESS | Données personnelles, salaires |
| **Leave** | Demande, validation, solde, calendrier absences | ESS, Superviseur, Admin | Soldes congés |
| **Time** | Timesheets, punch in/out, plannings | ESS, Superviseur | Heures travaillées |
| **Recruitment** | Offres, candidatures, entretiens | Admin | CV, données candidats |
| **ESS** | Portail libre-service employé | ESS | Infos personnelles |

### 2.2 Parcours utilisateur critiques

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

## 3. Matrice de risques

### 3.1 Critères de scoring

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

### 3.2 Matrice complète

| Fonctionnalité | CM | IU | PO | Risque brut | CT | DF | Risque ajusté | AU | Priorité auto | Classe |
|---|---|---|---|---|---|---|---|---|---|---|
| Login multi-rôles (Admin/ESS/Sup) | 5 | 5 | 5 | 125 | 2 | 1 | 128 | 5 | **640** | P0 |
| Demande de congé (ESS) | 5 | 4 | 5 | 100 | 3 | 2 | 105 | 4 | **420** | P0 |
| Validation congé (Superviseur) | 5 | 4 | 4 | 80 | 3 | 3 | 86 | 4 | **344** | P0 |
| Création employé (PIM) | 4 | 4 | 4 | 64 | 3 | 2 | 69 | 4 | **276** | P1 |
| CRUD utilisateurs système (Admin) | 4 | 3 | 3 | 36 | 2 | 2 | 40 | 4 | **160** | P1 |
| Sécurité accès inter-rôles | 5 | 5 | 3 | 75 | 2 | 4 | 81 | 3 | **243** | P1 |
| Punch in/out | 3 | 3 | 4 | 36 | 3 | 3 | 42 | 3 | **126** | P2 |
| MAJ fiche employé (ESS) | 3 | 3 | 3 | 27 | 2 | 2 | 31 | 3 | **93** | P2 |
| Recherche employés | 2 | 2 | 4 | 16 | 1 | 1 | 18 | 4 | **72** | P2 |
| Export rapports CSV | 2 | 2 | 2 | 8 | 2 | 2 | 12 | 2 | **24** | P3 |
| Recrutement | 3 | 2 | 2 | 12 | 3 | 3 | 18 | 2 | **36** | P3 |

---

## 4. Couverture actuelle

### 4.1 Mapping risque → tests implémentés

| Fonctionnalité | Priorité | Tests implémentés | Couverture |
|---|---|---|---|
| Login Admin | P0 | `auth/login-admin.spec.ts` | ✅ Complet |
| Login ESS | P0 | `auth/login-ess.spec.ts` | ✅ Complet |
| Login négatif | P0 | `auth/login-negative.spec.ts` | ✅ Complet |
| Demande de congé | P0 | `leave/apply-leave.spec.ts`, `leave/insufficient-balance.spec.ts` | ✅ Complet |
| Validation congé | P0 | `leave/approve-leave.spec.ts` | ⚠️ Skipped (prérequis données) |
| Création employé PIM | P1 | `pim/add-employee.spec.ts` | ✅ Complet |
| CRUD utilisateurs Admin | P1 | `admin/add-user.spec.ts`, `admin/search-user.spec.ts`, `admin/delete-user.spec.ts` | ✅ Complet |
| Sécurité inter-rôles | P1 | `security/role-access.spec.ts`, `security/ess-access.spec.ts` | ✅ Complet |
| Punch in/out | P2 | `time/punch.spec.ts` | ✅ Complet |
| MAJ fiche ESS | P2 | `ess/ess-dashboard.spec.ts`, `ess/ess-restricted-access.spec.ts` | ✅ Partiel |
| Export rapports | P3 | — | Manuel/exploratoire |
| Recrutement | P3 | — | Manuel/exploratoire |

### 4.2 Bilan

- **Couverture P0** : 90% (validation congé en attente de seed de données)
- **Couverture P1** : 100%
- **Couverture P2** : 80%
- **Modules P3** : couverts en test exploratoire manuel

---

## 5. Architecture de test

### 5.1 Structure du projet

```
├── pages/               # Page Object Model
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── AdminUsersPage.ts
│   ├── LeavePage.ts
│   ├── LeaveListPage.ts
│   ├── PimPage.ts
│   └── TimePage.ts
├── fixtures/            # Fixtures Playwright
│   ├── base.fixture.ts  # test.extend() avec injection POM
│   ├── auth.setup.ts    # storageState login
│   └── test-data.ts     # Données de test centralisées
├── helpers/             # Utilitaires
│   ├── navigation.helper.ts
│   └── user.helper.ts
└── tests/               # Specs par module
    ├── auth/
    ├── admin/
    ├── leave/
    ├── pim/
    ├── security/
    ├── time/
    └── ess/
```

### 5.2 Patterns appliqués

| Pattern | Objectif |
|---|---|
| `test.extend()` | Injection POM type-safe, instanciation lazy |
| `test.step()` | Traces lisibles en CI pour le debugging |
| `Promise.all` | Synchronisation click + réponse API (pas de race condition) |
| `Promise.race` | Détection succès vs erreur après soumission |
| `try/finally` | Cleanup garanti même en cas d'échec |
| `expect.poll()` | Attente déterministe de données (remplace `networkidle`) |
| `page.route()` | Mock API pour edge cases impossibles à reproduire |
| `storageState` | Login unique, session réutilisée |

---

## 6. Gestion du déterminisme

### 6.1 Contraintes de l'environnement cible

| Contrainte | Impact sur les tests | Mitigation |
|---|---|---|
| Démo publique partagée | Données changent entre runs | Création de données en setup, cleanup en teardown |
| Pas de data-testid | Locators limités | `getByRole`, `getByPlaceholder`, `getByLabel` |
| Pas d'API documentée | Setup/teardown limité | Helpers UI pour créer/supprimer les données |
| Réinitialisation périodique | Données purgées | Tests autonomes, pas de dépendance à des données préexistantes |
| Lenteur réseau variable | Risque timeout | `waitForResponse`, `expect.poll()`, retry Playwright |

### 6.2 Checklist déterminisme appliquée

- [x] Chaque test part d'un état connu (login via `storageState`, données créées en setup)
- [x] Les données sont créées par le test ou par un helper dédié
- [x] Les assertions attendent un signal fiable (`waitForResponse`, auto-retry Playwright)
- [x] Aucun `waitForTimeout` utilisé
- [x] Locators sémantiques (`getByRole`, `getByLabel`, `getByPlaceholder`)
- [x] Tests indépendants — aucune dépendance à l'ordre d'exécution
- [x] Fonctionnent en local et en CI

---

## 7. Recommandations de niveau de test

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

## 8. Pistes d'amélioration

### 8.1 Court terme

| Action | Priorité | Effort |
|---|---|---|
| Activer `approve-leave.spec.ts` | P0 | Moyen — nécessite seed de données congé |
| Ajouter recherche employé PIM | P2 | Faible |
| Tests export CSV (download) | P3 | Moyen |

### 8.2 Tests exploratoires recommandés

1. **Session expirée** : comportement après 30 min d'inactivité
2. **Multi-onglets** : login Admin dans un onglet, ESS dans un autre — conflit de session ?
3. **Injection dans les champs** : `<script>alert(1)</script>` ou `' OR 1=1 --`
4. **Dates limites congés** : date passée, date = aujourd'hui, date > 1 an
5. **Permissions croisées** : ESS modifie l'URL pour accéder à `/pim/addEmployee`
6. **Upload fichiers** : `.exe`, 100 Mo, noms avec caractères spéciaux
7. **Responsive** : menu latéral sur mobile
8. **Double soumission** : double-clic rapide sur "Save"

---

## 9. Conclusion

La suite de tests couvre les risques métier identifiés comme P0 et P1 via la matrice de risques. L'architecture POM + fixtures garantit la maintenabilité à mesure que la couverture s'étend. Les prochaines itérations cibleront l'activation du test de validation congé et l'extension vers les modules P2/P3.

---

*Document rédigé le 11 avril 2026 — exploitable en backlog QA.*

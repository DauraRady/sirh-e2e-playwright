# 🧠 Stratégie de Test Complète – OrangeHRM

---

## 1. 🎯 Objectifs et Introduction

Cette stratégie vise à garantir la **qualité, stabilité, sécurité et conformité** de la solution RH OrangeHRM en environnement de production.

**Contexte** : OrangeHRM est un logiciel de gestion RH modulaire (open source), comportant des modules comme PIM, congés, temps de travail, recrutement, etc. Il est destiné aux équipes RH, aux superviseurs et aux employés.

**Objectifs QA :**

- Valider toutes les fonctionnalités critiques pour les RH.
- Sécuriser les données sensibles (employés, salaires, absences).
- Garantir une expérience utilisateur fluide (UI, accessibilité).
- Couvrir les risques majeurs via une stratégie mixte (manuel + automatisation).
- Assurer une traçabilité et une couverture des tests mesurable (KPI).

---

## 2. 📦 Périmètre fonctionnel

### Modules testés :

- **Login & rôles utilisateurs (ESS, Admin, Superviseur)**
- **PIM : gestion des profils employés**
- **Leave : gestion des congés**
- **Time : suivi du temps & punch in/out**
- **Recruitment : offres d’emploi & candidatures**
- **Reports : génération de rapports CSV**

### Fonctionnalités exclues :

- Intégration API externe (non présente dans la démo de base)
- Module de paie (absent dans l’édition communautaire)

---

## 3. 📊 Analyse des risques

### 3.1 Méthode utilisée : **Risk-Based Testing** (RBT)

Chaque fonctionnalité est évaluée selon 3 critères :

- **Criticité métier**
- **Complexité technique**
- **Visibilité utilisateur**

👉 Score global = P x I x V (sur 27)

### 3.2 Grille de risque

| Fonctionnalité          | Criticité | Complexité | Visibilité | Score | Classe | Action QA                     |
| ----------------------- | --------- | ---------- | ---------- | ----- | ------ | ----------------------------- |
| Connexion multi-profils | 3         | 3          | 3          | 27    | Max    | Test auto + manuel + sécurité |
| Demande de congé        | 3         | 2          | 3          | 18    | Élevé  | Test auto + test négatif      |
| Punch in/out            | 3         | 2          | 2          | 12    | Moyen  | Manuel exploratoire           |
| Edition fiche RH        | 2         | 2          | 2          | 8     | Modéré | Tests manuels ciblés          |
| Rapport export CSV      | 2         | 1          | 1          | 4     | Faible | Test manuel visuel            |

---

## 4. 🧠 Méthodologie de conception des tests

### 4.1 Techniques utilisées :

- **Cas d’utilisation métier complets** (end-to-end)
- **Équivalence et classes de valeurs** (formulaires, champs date…)
- **Analyse combinatoire** (rôle × état salarié × type d’action)
- **Tests exploratoires** pour UI et UX
- **Cas limites & cas négatifs** systématiques

### 4.2 Types de tests appliqués :

- Tests fonctionnels (UI, formulaires)
- Tests de sécurité (accès, injection)
- Tests de rôles (Admin, ESS, Manager)
- Tests de non-régression (sur chaque sprint)
- Tests de performance (Punch, Leave)
- Tests automatisés (Playwright + TypeScript)

---

## 5. 🧪 Plan manuel vs automatisé

| Fonctionnalité      | Manuel | Automatisé            | Pourquoi                 |
| ------------------- | ------ | --------------------- | ------------------------ |
| Login multi-profils | ✅     | ✅                    | critique + stable        |
| Création employé    | ✅     | ✅                    | répétable + scénario clé |
| MAJ fiche RH        | ✅     | ❌                    | trop variable            |
| Demande congé       | ✅     | ✅                    | flux complet stable      |
| Validation congé    | ✅     | ✅                    | dépend d’un autre rôle   |
| Punch in/out        | ✅     | ⚠️ difficile à mocker |
| Export rapports     | ✅     | ❌                    | test visuel PDF/CSV      |

---

## 6. 📋 Cas de test – Passants / Non passants + KPI

### 🔐 LOGIN (Admin / ESS / Superviseur)

**Cas passants :**

- Connexion OK avec identifiants valides → accès au bon tableau de bord

**Cas non passants :**

- 5 tentatives KO → compte bloqué
- Injection SQL → rejet + log

**KPI :**

- 100% des rôles redirigés correctement
- Temps de réponse < 3s
- Blocage déclenché dans 100% des cas après 5 essais

---

### 📁 PIM (Ajout/modif employé)

**Cas passants :**

- Création fiche avec tous les champs valides
- Ajout de pièce jointe

**Cas non passants :**

- Nom vide → rejet
- Date embauche future → message d'erreur

**KPI :**

- 100% des champs critiques validés
- 100% des erreurs remontent dans l’UI

---

### 📆 LEAVE (Demande & validation de congé)

**Cas passants :**

- Demande complète + solde suffisant + validation
- Message de confirmation reçu

**Cas non passants :**

- Congé sur période déjà prise → rejet
- Solde insuffisant → blocage automatique

**KPI :**

- 100% des demandes valides validées en < 2 clics
- 0 fausse acceptation (solde KO)

---

### ⏱️ TIME (Punch)

**Cas passants :**

- Punch IN / OUT → horodatage correct
- Feuille générée automatiquement

**Cas non passants :**

- Double punch IN → rejet
- Punch hors horaires → alerte

**KPI :**

- 100% des punchs logués
- Pas de doublons

---

## 7. 🛠️ Environnements et outils

### 🖥️ Environnements

- ENV TEST (clean DB, comptes de test)
- ENV PREPROD (mirror prod, données anonymisées)

### 🧰 Outils QA

- **Test Management** : TestRail ou Xray (JIRA)
- **Automatisation** : Playwright + TypeScript
- **CI/CD** : GitHub Actions
- **Reporting** : Allure + Playwright HTML Report
- **Suivi des bugs** : JIRA / Trello QA

---

## 8. ✅ Critères d’acceptance par fonctionnalité (KPI globaux)

| Fonction            | KPI de validation                                                            |
| ------------------- | ---------------------------------------------------------------------------- |
| Login multi-profils | 100% redirection correcte + blocage après 5 tentatives KO                    |
| Création employé    | 100% des champs obligatoires validés + audit trail visible                   |
| Demande congé       | Décompte correct + message hiérarchique + validation automatique si solde OK |
| Punch in/out        | Aucune duplication possible + timestamp exact + feuilles cohérentes          |
| Rapports            | Export CSV lisible + données justes sur 100% des filtres appliqués           |

---

## 9. 📊 Indicateurs de succès globaux

| Indicateur                              | Seuil cible |
| --------------------------------------- | ----------- |
| Taux de réussite des tests critiques    | ≥ 98%       |
| Couverture testée sur User Stories clés | 100%        |
| Anomalies critiques ouvertes en sortie  | 0           |
| Temps moyen d’exécution (auto)          | < 10s/test  |
| Temps de validation manuelle / sprint   | < 2j max    |

---

## 10. 🚀 Planification QA / QA Delivery

- 📅 Sprint 0 : mise en place QA (outils, repo, stratégie validée)
- 🧪 Sprint 1 : tests manuels + 1er jeu automatisé (login + création employé)
- 🔁 Sprint 2–3 : couverture Leave + Time automatisé + non-régression
- 📈 Sprint final : stabilisation, réexécution, recette + démo client

---

👉 **Annexes à livrer :**

- Cahier de tests (Excel / TestRail)
- Scripts Playwright (GitHub)
- Rapport de campagne (PDF automatisé)

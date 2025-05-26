

# 🧠 Résumé Fonctionnement OrangeHRM

OrangeHRM est une plateforme RH open source complète permettant de gérer tous les aspects liés aux employés, depuis l’onboarding jusqu’à la gestion du temps, des congés et des avantages.

---

## 🧩 Architecture modulaire

| Module          | Rôle principal                    |
| --------------- | --------------------------------- |
| **Admin**       | Configuration globale du système  |
| **PIM**         | Données personnelles des employés |
| **ESS**         | Portail employé en libre-service  |
| **Leave**       | Gestion des congés                |
| **Time**        | Suivi du temps & des présences    |
| **Benefits**    | Avantages sociaux & santé         |
| **Recruitment** | Recrutement & entretiens          |
| **Training**    | Suivi des formations              |
| **Budget**      | Budgets par service               |
| **Reports**     | Génération de rapports            |
| **Bug Tracker** | Remontée des bugs internes        |

---

## 🔐 Rôles et accès

- **Admin RH** : accès total à la configuration
- **Superviseur (ESS Supervisor)** : gère ses subordonnés
- **Employé (ESS User)** : accès à ses infos, congés, temps

---

## ⚙️ Détail des modules

### 1. Admin Module

- Définition de la **structure de l'entreprise** (sites, départements, hiérarchie)
- Création des **postes**, **grilles salariales**, **types d'emploi**
- Gestion des **droits d’accès** (groupes utilisateurs)
- Import/export CSV
- Suivi des actions (Audit Trail)
- Publications internes (news, documents RH)
- Notifications par mail (congés, recrutements, etc.)

---

### 2. PIM (Personal Information Management)

- Fiche complète de l’employé :
  - Infos perso, job, salaire
  - Diplômes, expériences, langues, permis
  - Photo, documents, contacts d’urgence
- Suivi de l’évolution dans l’organisation
- Données réutilisées dans tous les autres modules

---

### 3. ESS (Employee Self-Service)

- L’employé peut :
  - Mettre à jour ses infos perso
  - Suivre ses congés et demander des absences
  - Visualiser ses avantages ou formations

---

### 4. Leave Module

- Définition des types de congés (annuel, maladie, etc.)
- Jours ouvrés / jours fériés paramétrables
- Application / validation des congés
- Vue calendrier des absences
- Suivi des soldes et historique

---

### 5. Time Module

- Saisie des **timesheets hebdomadaires**
- Fonction Punch in/out (badges horaires)
- Suivi du temps par projet
- Validation des feuilles de temps par les superviseurs
- Définition des **plannings** par équipe

---

### 6. Benefits Module

- Définition des **Health Savings Plans (HSP)**
- Suivi des dépenses et paiements HSP
- Planification des paies

---

### 7. Recruitment Module

- Création d’offres d’emploi
- Suivi des candidatures
- Organisation des entretiens
- Historique des échanges
- Configuration des mails de réponse

---

### 8. Training Module

- Création de programmes de formation
- Suivi des formations par collaborateur

---

### 9. Budget Module

- Définition des **budgets par poste/service**
- Suivi des dépenses RH

---

### 10. Reports Module

- Création de rapports personnalisés
- Exports CSV des données RH

---

### 11. Bug Tracker

- Signalement des anomalies rencontrées dans le système

---

## 📈 Points clés pour un testeur QA

- **Module ESS = cible fonctionnelle principale pour les tests utilisateurs**
- **Données interconnectées** : un champ modifié dans PIM peut impacter Leave, Time, Reports…
- **Cycle de validation fort côté superviseurs** : à tester rigoureusement (ex. workflows Leave & Time)
- **Vérification de la sécurité** : chaque profil doit voir uniquement ce qu’il est autorisé à voir

---

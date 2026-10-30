# SAP-CPI-DRIVE — Gestionnaire Google Drive SAP Fiori (Sandbox BAS)

[![SAP Fiori Horizon](https://img.shields.io/badge/SAP%20Fiori-Horizon-0A6ED1?logo=sap)](https://experience.sap.com/fiori-design/)
[![SAPUI5](https://img.shields.io/badge/SAPUI5-1.153-0A6ED1)](https://ui5.sap.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)](https://www.typescriptlang.org/)
[![SAP CPI](https://img.shields.io/badge/SAP%20Integration%20Suite-CPI-0070F2)](https://www.sap.com/products/technology-platform/integration-suite.html)
[![Clean Code](https://img.shields.io/badge/ESLint-0%20Error%20%7C%200%20Warning-brightgreen)](https://eslint.org/)

Application SAP Fiori (SAPUI5 avec TypeScript) permettant de gérer l'espace de stockage Google Drive entreprise via **SAP Cloud Integration (CPI / Integration Suite)**. 

Ce projet est optimisé pour être exécuté, testé et validé dans l'environnement **Sandbox Fiori Launchpad (FLP)** de **SAP Business Application Studio (BAS)**.

---

## 👥 Équipe Projet & Contact SAPErp Solution

| Rôle | Nom & Prénom | Société / Organisation |
| :--- | :--- | :--- |
| **Consultant Technico-Fonctionnel SAP** | **RAMANANTSIRAHONANA ALDINO** | SAPErp Solution |
| **Delivery Manager** | **SAMel** | SAPErp Solution |
| **Manager de Projet** | **Flavien** | SAPErp Solution |

---

## ✨ Fonctionnalités Implémentées

### 1. Explorateur Google Drive Réactif
- **Navigation Arborescente** : Fil d'Ariane dynamique (*Breadcrumbs*) et bouton « Dossier Parent ».
- **Section Dossiers Calibrée** : Grille fluide de dossiers avec icônes dorées Google Drive, sans espace mort sur la partie droite.
- **Section Fichiers en Grille & Tableau** :
  - **Bannière supérieure de prévisualisation** avec badge de type documentaire (`PDF`, `EXCEL`, `WORD`, `IMAGE`, `ZIP`) et teintes harmonieuses.
  - **Titres sur 2 lignes** sans coupure prématurée et avec infobulle complète.
  - **Pied de carte non chevauché** : Séparation nette de la taille formatée (`507,1 Ko`) et de la date en français (`29 sept. 2026 à 10:18`).
- **Tri Multi-critères** : Ordonnancement par Nom (A-Z / Z-A), Date de modification, Date de création et Taille.
- **Recherche Instantanée** : Filtrage en temps réel dans le dossier courant.
- **Opérations Documentaires Complètes (CRUD)** :
  - 👁️ Visualisation détaillée des métadonnées (ID, MIME, dates, taille).
  - ⬇️ Téléchargement direct du flux binaire brut (`raw=true`).
  - ✏️ Renommage à chaud du fichier.
  - 🔄 Remplacement intégral du contenu binaire (mise à jour de version).
  - 🗑️ Suppression sécurisée avec boîte de dialogue de confirmation.
  - ⬆️ Téléversement (*Upload*) avec sélecteur de fichier et nom personnalisé.

### 2. Double Thème Dynamique (Mode Sombre 🌙 & Mode Clair ☀️)
- Bascule instantanée depuis l'en-tête de l'application.
- Rendu sombre haute définition (*Midnight Slate* `#1B2433`) avec bannières de prévisualisation lumineuses adaptées.

### 3. Tableau de Bord Intégré (Dashboard)
- Tuiles KPIs : Total des éléments, Total des fichiers, Total des dossiers.
- Répartition par typologie documentaire et historique d'activité de modification.

### 4. Localisation Intégrale en Français (`/fr`)
- Interface, messages, dialogues, formats de dates et tailles 100% en français.

---

## 📁 Structure du Répertoire

```text
SAP-CPI-DRIVE/
├── drive-file-manager/             # 📱 Application SAP Fiori (SAPUI5 / TypeScript)
│   ├── webapp/
│   │   ├── controller/             # Drive.controller.ts, App.controller.ts
│   │   ├── view/                   # Drive.view.xml (Grille, Tableau, Dashboard)
│   │   ├── model/                  # CpiDriveService.ts, formatter.ts, models.ts
│   │   ├── css/                    # style.css (Thème Sombre / Clair, Grilles fluides)
│   │   └── i18n/                   # i18n.properties (FR), i18n_fr, i18n_en
│   ├── ui5.yaml / ui5-local.yaml   # Config UI5 Tooling + Proxy CPI
│   └── package.json                # Dépendances et scripts de validation
├── Iflow/                          # ☁️ Flux d'intégration SAP CPI
│   ├── INTEGRATION_API_DRIVE/      # BPMN XML, scripts Groovy et Secure Store
│   └── INTEGRATION_API_DRIVE.zip   # Archive prête à importer dans Integration Suite
├── SPEC_TECHNIQUE.md               # 📖 Dossier complet de spécifications techniques
└── package.json (racine)           # Commandes d'orchestration globales
```

---

## 🚀 Réalisation & Exécution Sandbox dans SAP Business Application Studio (BAS)

### 1. Préparation du Dev Space dans BAS
1. Connectez-vous à votre espace **SAP Business Application Studio**.
2. Créez un Dev Space de type **SAP Fiori** (il contient nativement UI5 Tooling, Fiori Generator et Node.js).
3. Ouvrez le Dev Space dès qu'il est à l'état **RUNNING**.

### 2. Import & Installation des Dépendances
Dans le terminal de BAS (à la racine du projet `SAP-CPI-DRIVE`) :

```bash
# Installation des dépendances du projet Fiori
cd drive-file-manager
npm install
cd ..
```

### 3. Lancement dans la Sandbox Fiori Launchpad (FLP)
Depuis la racine du projet, lancez :

```bash
npm run start-local
```
- BAS détecte l'ouverture du port `8080` et affiche une notification contextuelle en bas à droite.
- Cliquez sur **Open in New Tab** (ou **Exposer le port**).
- L'application s'ouvre dans la sandbox **Fiori Launchpad** (`http://localhost:8080/test/flp.html#app-preview`).

*Alternative : pour lancer l'application en mode plein écran autonome (sans barre FLP) :*
```bash
npm run start-noflp
```

### 4. Configuration du Proxy CPI Local
Le fichier `drive-file-manager/ui5-local.yaml` redirige automatiquement les requêtes `/cpi-api/*` vers votre tenant SAP CPI :
`https://178020eetrial.it-cpitrial06-rt.cfapps.us10-001.hana.ondemand.com/http/manage/file/gd/v1`

Si votre flux CPI requiert une authentification **Basic Auth** lors des tests sandbox :
1. Ouvrez l'application dans votre navigateur.
2. Ouvrez la console (**F12** > onglet **Console**).
3. Définissez vos identifiants temporaires :
   ```javascript
   sessionStorage.setItem("cpi_user", "VOTRE_CLIENT_ID_OU_USER_CPI");
   sessionStorage.setItem("cpi_pass", "VOTRE_CLIENT_SECRET_OU_PASSWORD_CPI");
   ```
4. Actualisez avec **F5** pour interroger directement votre Google Drive d'entreprise.

---

## 🧪 Contrôles Qualité & Validation Clean Code

Depuis la racine du projet, exécutez les contrôles automatisés :

```bash
# 1. Vérification TypeScript strict
npm run ts-typecheck
# ✔ Résultat attendu : 0 erreur

# 2. Analyse de conformité ESLint & SAP Fiori Tools
npm run lint
# ✔ Résultat attendu : 0 erreur, 0 avertissement

# 3. Compilation et vérification du build
npm run build
# ✔ Résultat attendu : Build réussi avec génération du Component-preload.js
```

---

## 📄 Documentation Détaillée
Pour consulter les spécifications d'architecture, les schémas de flux de données, les contrats d'interfaces API REST, ainsi que le détail des scripts Groovy du middleware CPI, reportez-vous au document :
👉 **[SPEC_TECHNIQUE.md](./SPEC_TECHNIQUE.md)**

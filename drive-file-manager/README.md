# SAP Fiori Google Drive File Manager (SAP CPI Integration)

Application Fiori (SAPUI5 avec TypeScript) permettant de gérer les fichiers Google Drive via un IFlow SAP Cloud Integration (CPI).

---

## 🚀 Fonctionnalités
- **Gestion des Fichiers & Dossiers** :
  - Liste interactive des fichiers et dossiers.
  - Navigation arborescente (dossiers et sous-dossiers) avec fil d'Ariane (Breadcrumbs).
  - Barre de recherche en temps réel.
  - Détails d'un fichier (métadonnées, taille, dates, type MIME).
  - Téléchargement direct des fichiers.
  - Renommer un fichier / dossier.
  - Remplacer le contenu d'un fichier (ré-upload).
  - Suppression de fichiers / dossiers.
  - Importation (Upload) de nouveaux fichiers.
- **Tableau de Bord (Dashboard)** :
  - Cartes KPI : Total éléments, fichiers et dossiers.
  - Répartition par type de fichier (PDF, Images, Documents, Tableurs, Autres).
  - Historique par date de modification (Aujourd'hui, 7 jours, 30 jours, Plus anciens).

---

## 🛠️ Configuration & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommandé)
- [npm](https://www.npmjs.com/)

### Installation
1. Accédez au répertoire du projet UI5 :
   ```bash
   cd drive-file-manager
   ```
2. Installez les dépendances :
   ```bash
   npm install
   ```

---

## 💻 Démarrage Local (Development)

Le projet utilise le proxy `fiori-tools-proxy` dans `ui5-local.yaml` qui redirige les appels vers `/cpi-api` vers l'endpoint CPI :
`https://178020eetrial.it-cpitrial06-rt.cfapps.us10-001.hana.ondemand.com/http/manage/file/gd/v1/*`

### Lancer l'application avec la sandbox FLP (SAP Fiori Launchpad)
```bash
npm run start-local
```
L'application s'ouvrira sur `http://localhost:8080/test/flp.html#app-preview`.

### Lancer l'application en mode Standalone (Sans FLP)
```bash
npm run start-noflp
```
L'application s'ouvrira sur `http://localhost:8080/index.html`.

---

## 🔑 Authentification SAP CPI (Basic Auth)

L'endpoint CPI requiert une authentification **Basic Auth** (S-User / Client ID et mot de passe CPI).
L'application gère l'authentification de deux manières :
1. **Via le navigateur / LocalStorage** :
   Vous pouvez enregistrer les identifiants dans la console du navigateur si nécessaire :
   ```javascript
   localStorage.setItem("cpi_user", "VOTRE_UTILISATEUR_CPI");
   localStorage.setItem("cpi_pass", "VOTRE_MOT_DE_PASSE_CPI");
   ```
2. **Via le Proxy Fiori Tools** (`ui5-local.yaml`) :
   Vous pouvez configurer directement les identifiants dans `ui5-local.yaml` sous la section `backend`.

---

## 📦 Compilation & Build
Pour vérifier les types TypeScript et compiler l'application pour la production :
```bash
npm run build
```
Les fichiers générés se trouveront dans le dossier `dist/`.

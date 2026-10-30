# Spécification Technique : Gestionnaire de Fichiers Google Drive SAP Fiori (CPI)

## 1. Présentation Générale & Objectifs

Ce projet consiste en une application **SAP Fiori (SAPUI5 avec TypeScript)** connectée à une interface d'intégration **SAP Cloud Integration (CPI)** permettant de gérer l'arborescence et les fichiers stockés sur un compte Google Drive entreprise.

### Objectifs Principaux
- Offrir une expérience utilisateur Fiori intuitive et moderne pour naviguer dans l'arborescence Google Drive (Dossiers et Fichiers).
- Fournir un tableau de bord (Dashboard) interactif présentant des indicateurs clés (KPIs) sur la répartition des fichiers par types et par dates.
- Permettre la gestion complète des fichiers (Création, Lecture, Téléchargement brut, Modification du contenu, Renommage et Suppression).
- Assurer une intégration fluide entre le frontend UI5 et l'IFlow SAP CPI sans altération des flux binaires.

---

## 2. Architecture Globale du Système

```
+------------------------------------+
|  SAP Fiori App (drive-file-manager)|
|  SAPUI5 + TypeScript               |
+------------------------------------+
                 |
                 | Appel HTTP REST (/cpi-api/...)
                 v
+------------------------------------+
|  SAP CPI (Integration Suite)       |
|  IFlow: INTEGRATION_API_DRIVE      |
|  Endpoint: /http/manage/file/gd/v1/*|
+------------------------------------+
                 |
                 | Google Drive REST API v3
                 v
+------------------------------------+
|  Google Drive Cloud Storage        |
+------------------------------------+
```

---

## 3. Spécifications Techniques SAP Fiori (`drive-file-manager`)

### 3.1 Stack Technique Frontend
- **Framework** : SAPUI5 `1.108.0+`
- **Langage** : TypeScript
- **Style / UX** : SAP Fiori Horizon (`sap_horizon`)
- **Bibliothèques UI5** : `sap.m`, `sap.f`, `sap.ui.core`, `sap.ui.layout`
- **Gestionnaire de dépendances & Outils** : UI5 Tooling (`@ui5/cli`), `mbt` (Cloud MTA Build Tool)

### 3.2 Arborescence du Projet
```text
drive-file-manager/
├── webapp/
│   ├── controller/
│   │   ├── App.controller.ts        # Contrôleur racine
│   │   └── Drive.controller.ts      # Contrôleur principal (Logique métier & UI)
│   ├── view/
│   │   ├── App.view.xml            # Vue racine
│   │   └── Drive.view.xml          # Vue Fiori de gestion des fichiers & Dashboard
│   ├── service/
│   │   └── CpiDriveService.ts      # Service de communication HTTP REST avec SAP CPI
│   ├── model/
│   │   └── formatter.ts            # Formatters d'icônes, couleurs, tailles, dates
│   ├── i18n/
│   │   └── i18n.properties         # Textes multilingues
│   ├── Component.ts                # Composant Fiori
│   └── manifest.json               # Descripteur Fiori, routage et modèles
├── ui5.yaml                        # Proxy dev pour destination CPI
├── ui5-local.yaml                  # Proxy dev local avec UI5 CDN
└── mta.yaml                        # Fichier de déploiement SAP BTP Cloud Foundry
```

### 3.3 Fonctionnalités & Composants UI
1. **Header & Métriques Dashboard (KPIs)** :
   - `GenericTile` / `NumericContent` affichant : Total des éléments, Nombre de Fichiers, Nombre de Dossiers.
   - Graphique de répartition visuel par type de fichier (PDF, Word/Docs, Excel/Sheets, Images, Archives, Autres).
2. **Fil d'Ariane (Breadcrumbs)** :
   - Permet la navigation pas-à-pas dans la hiérarchie des dossiers (`Mon Drive` > `Dossier A` > `Sous-dossier B`).
3. **Affichage des Dossiers (Panneau Rétractable)** :
   - Présentation sous forme de jetons/puces cliquables (`sap.m.GenericTag` / `sap.m.Button`) pour entrer dans les dossiers.
   - Menu d'actions (3 points) dédié à chaque dossier : *Détails*, *Renommer*, *Supprimer*.
4. **Affichage des Fichiers (Vue Grille & Vue Tableau)** :
   - **Bouton de Bascule (SegmentedButton)** : Commute dynamiquement entre la vue Cartes (`sap.f.GridList`) et la vue Tableau (`sap.m.Table`).
   - **Recherche & Filtrage** : Recherche instantanée sur le nom des fichiers via `SearchField`.
   - **Tri Multi-critères** : Tri dynamique par Nom (A-Z / Z-A), Date de modification (Récent / Ancien), Taille (Grand / Petit).
   - **Menu d'actions (3 points / ActionSheet)** disponible sur chaque carte/ligne :
     - 👁️ **Aperçu / Détails** (Métadonnées Google Drive, ID, MIME, Création, Modification).
     - ⬇️ **Télécharger** (Récupération directe du binaire).
     - ✏️ **Renommer** (Dialogue d'édition du nom).
     - 🔄 **Remplacer le contenu** (Upload d'une nouvelle version).
     - 🗑️ **Supprimer** (Confirmation puis suppression via CPI).
5. **Gestion des Téléversements (Upload)** :
   - Dialogue `sap.m.Dialog` supportant la sélection de fichier et l'envoi en `multipart/form-formdata` ou `Base64` vers le CPI.

---

## 4. Spécifications Techniques SAP CPI (`INTEGRATION_API_DRIVE`)

### 4.1 Endpoints HTTP Exposés
L'IFlow CPI est accessible via le préfixe :
`https://178020eetrial.it-cpitrial06-rt.cfapps.us10-001.hana.ondemand.com/http/manage/file/gd/v1`

| Méthode | Endpoint / Chemin | Paramètres / Payload | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/list` | `folderId` (Optionnel), `all=true` (Optionnel) | Liste les fichiers et dossiers (supporte le mode récursif/flat pour le Dashboard). |
| **GET** | `/download` | `fileId` (Requis), `raw=true` (Requis pour le binaire) | Télécharge le contenu brut d'un fichier. |
| **POST** | `/upload` | Multipart / Base64 avec `fileName`, `mimeType`, `folderId` | Envoie un nouveau fichier dans le dossier courant. |
| **PUT** | `/update` | `fileId`, nouveau nom ou nouveau contenu | Met à jour le nom ou le fichier existant. |
| **DELETE** | `/delete` | `fileId` | Supprime définitivement un fichier ou dossier dans Google Drive. |

### 4.2 Scripts Groovy Ajustés
- **`download_prepare.groovy` & `download_formatMail.groovy`** :
  - Ajustés pour détecter le paramètre `raw=true`. Lors du téléchargement via l'application Fiori, la conversion vers le template de mail HTML est contournée afin de renvoyer le flux binaire exact (`Content-Disposition: attachment`).
- **`list_fetchAndBuildTree.groovy`** :
  - Construit une structure JSON propre contenant la distinction entre dossiers (`mimeType: application/vnd.google-apps.folder`) et fichiers.

---

## 5. Configuration Réseau & Proxy de Développement

### 5.1 Fichiers `ui5.yaml` / `ui5-local.yaml`
Un proxy d'intégration local (`fiori-tools-proxy`) est configuré pour rediriger toutes les requêtes frontend envoyées à `/cpi-api` vers le serveur CPI BTP :

```yaml
builder:
  customTasks:
    - name: ui5-tooling-transpile-task
server:
  customMiddleware:
    - name: fiori-tools-proxy
      afterMiddleware: compression
      configuration:
        backend:
          - path: /cpi-api
            url: https://178020eetrial.it-cpitrial06-rt.cfapps.us10-001.hana.ondemand.com
            pathReplace: /http/manage/file/gd/v1
```

---

## 6. Guide de Déploiement SAP BTP Cloud Foundry

### 6.1 Processus de Build MTA
L'application est encapsulée dans une archive multitarget (`.mtar`) via les étapes :

1. Compilation TypeScript & Packaging UI5 :
   ```bash
   cd drive-file-manager
   npm run build
   ```
2. Génération du paquet MTA à la racine :
   ```bash
   mbt build
   ```
3. Déploiement sur Cloud Foundry :
   ```bash
   cf deploy mta_archives/drive-file-manager_0.0.1.mtar
   ```

---

## 7. Matrice de Traçabilité des Exigences

| Exigence Fonctionnelle | Statut | Composant Modifié / Ajouté |
| :--- | :--- | :--- |
| **Liste des fichiers & recherche** | ✅ Validé | `Drive.view.xml`, `Drive.controller.ts` (`onSearch`) |
| **Détails du fichier** | ✅ Validé | `CpiDriveService.ts`, Dialogue `onShowDetails` |
| **Modification & Renommage** | ✅ Validé | `CpiDriveService.ts` (`updateFile`), Dialogue `onRenameFile` |
| **Suppression** | ✅ Validé | `CpiDriveService.ts` (`deleteFile`), Confirmation Dialog |
| **Upload / Téléchargement** | ✅ Validé | `CpiDriveService.ts`, Groovy Scripts CPI |
| **Dashboard KPI** | ✅ Validé | `Drive.view.xml` (Tiles + Split par types), `Drive.controller.ts` |
| **Thème & UI/UX Soignée** | ✅ Validé | Fiori Horizon, Icônes personnalisées par format de fichier |

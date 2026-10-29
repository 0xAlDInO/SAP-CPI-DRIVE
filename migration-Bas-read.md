# Guide de Migration et Lancement dans SAP Business Application Studio (BAS)

Ce document décrit étape par étape comment migrer, exécuter et déployer l'application **Fiori Google Drive File Manager** ainsi que son **IFlow CPI** dans **SAP Business Application Studio (BAS)**.

---

## 📋 Prérequis

1. Un compte **SAP BTP Cockpit** (Trial ou Enterprise).
2. Un abonnement actif à **SAP Business Application Studio (BAS)**.
3. L'outil **SAP Integration Suite** (CPI) activé sur votre sous-compte BTP.
4. Les identifiants ou la clé de compte de service pour votre tenant CPI.

---

## Étape 1 : Préparation du Dev Space dans BAS

1. Connectez-vous à **SAP Business Application Studio**.
2. Cliquez sur **Create Dev Space**.
3. Sélectionnez le type de Dev Space : **SAP Fiori** (contient les outils SAPUI5, Fiori Generator et UI5 Tooling).
4. Nommez votre Dev Space (ex: `FioriDriveSpace`) puis cliquez sur **Create Dev Space**.
5. Une fois le statut à **RUNNING**, cliquez sur le nom du Dev Space pour l'ouvrir.

---

## Étape 2 : Import du Projet dans BAS

1. Dans BAS, ouvrez le terminal (`Terminal > New Terminal`).
2. Clonez votre dépôt Git ou importez le dossier du projet dans votre espace de travail :
   ```bash
   git clone <URL_DE_VOTRE_DEPOT_GIT>
   cd <NOM_DU_REPERTOIRE>
   ```
3. Si vous avez un fichier ZIP du projet :
   - Allez dans `File > Import Project` ou glissez-déposez le fichier `.zip` dans l'explorateur de fichiers de BAS.

---

## Étape 3 : Installation des Dépendances

Dans le terminal de BAS à la racine du projet, exécutez :

```bash
npm install
```

Puis installez les dépendances du sous-dossier Fiori :

```bash
cd drive-file-manager
npm install
```

---

## Étape 4 : Configuration de la Destination BTP pour CPI (Optionnel mais Recommandé)

Afin d'éviter les problèmes de CORS et de gérer l'authentification de manière transparente dans BAS et en production BTP :

1. Allez sur **SAP BTP Cockpit** > Votre Sous-compte > **Connectivity** > **Destinations**.
2. Cliquez sur **New Destination** et configurez :
   - **Name** : `CPI_DRIVE_API`
   - **Type** : `HTTP`
   - **URL** : `https://178020eetrial.it-cpitrial06-rt.cfapps.us10-001.hana.ondemand.com/http/manage/file/gd/v1`
   - **Proxy Type** : `Internet`
   - **Authentication** : `BasicAuthentication` (Entrez vos identifiants CPI)
   - **Additional Properties** :
     - `WebIDEEnabled` = `true`
     - `WebIDEUsage` = `true`
     - `HTML5.DynamicDestination` = `true`

---

## Étape 5 : Lancement et Test Local dans BAS

Pour tester l'application directement dans BAS :

1. Dans le terminal BAS (à la racine du projet) :
   ```bash
   npm run start-local
   ```
   *Ou bien depuis le dossier `drive-file-manager` :*
   ```bash
   npm run start-noflp
   ```

2. Une notification d'ouverture de port apparaîtra en bas à droite dans BAS. Cliquez sur **Open in New Tab** ou **Exposer le port**.
3. **Important** : Si le navigateur ouvre la liste des fichiers/dossiers du répertoire (`/`), cliquez simplement sur `index.html` ou accédez à l'URL `http://localhost:<PORT>/index.html`.
4. L'application Fiori s'ouvrira directement avec l'interface Google Drive (vue Grille, vue Tableau, filtres par type, tri multi-critères, et Tableau de bord).

---

## Étape 6 : Import de l'IFlow dans SAP CPI / Integration Suite

L'archive d'intégration CPI mise à jour se trouve dans le répertoire `Iflow/` :
`Iflow/INTEGRATION_API_DRIVE.zip`

1. Connectez-vous à **SAP Integration Suite** (CPI Tenant).
2. Allez dans **Design** > **Integrations and APIs**.
3. Ouvrez votre Package d'intégration (ou créez-en un nouveau).
4. Cliquez sur **Edit** > **Add** > **Integration Flow** > **Upload**.
5. Sélectionnez le fichier `Iflow/INTEGRATION_API_DRIVE.zip`.
6. Configurez les paramètres d'authentification Google Drive (OAuth2 Client Credentials / Access Token) dans le composant de l'IFlow si nécessaire.
7. Cliquez sur **Save** puis **Deploy**.

---

## Étape 7 : Déploiement de l'Application Fiori sur SAP BTP

Pour déployer l'application sur le HTML5 Application Repository de SAP BTP depuis BAS :

1. Dans le terminal de BAS (dans le dossier `drive-file-manager`) :
   ```bash
   npm run build
   ```
2. Connectez-vous à votre espace Cloud Foundry dans BAS :
   ⚠️ **ATTENTION** : L'URL de `cf login` doit être l'API Cloud Foundry de votre région BTP (par exemple `https://api.cf.us10-001.hana.ondemand.com`), et **NON** l'endpoint HTTP de votre IFlow CPI !

   Si votre CLI `cf` a conservé l'endpoint CPI par erreur, réinitialisez l'endpoint Cloud Foundry avec :
   ```bash
   cf api https://api.cf.us10-001.hana.ondemand.com
   cf login
   ```
   *(Remplacez `us10-001` par votre région BTP si différente, disponible sur le tableau de bord BTP Cockpit sous "API Endpoint").*
   Sélectionnez votre **Organization** et votre **Space** BTP.
3. Déployez via Fiori Tools :
   ```bash
   npm run deploy
   ```

---

## ❓ Comment obtenir et configurer l'URL du système (`YOUR_ABAP_SYSTEM_URL`) ?

L'URL `YOUR_ABAP_SYSTEM_URL` présente dans `ui5-deploy.yaml` est un exemple d'espace réservé. Votre configuration dépend de votre cible de déploiement :

### Option A : Déploiement sur un serveur SAP ABAP (S/4HANA ou On-Premise)
Si vous souhaitez déployer l'application Fiori sur le dépôt BSP d'un système SAP ABAP :
1. **Où la trouver ?** : C'est l'URL HTTPS d'accès à votre serveur SAP ABAP (ex: `https://sapserver.domaine.com:44300` ou `https://my-s4hana.company.com`). Vous la trouverez dans votre SAP GUI (via la transaction `SM51` / `SICF`) ou auprès de votre équipe SAP Basis.
2. **Comment la configurer ?** : Exécutez l'assistant interactif dans le terminal de BAS :
   ```bash
   cd drive-file-manager
   npm run deploy-config
   ```
   Sélectionnez la cible **ABAP**, puis entrez l'URL de votre serveur, le numéro de mandant (client), le nom de l'application (ex: `ZDRIVE_MGR`) et le package ABAP.

### Option B : Déploiement sur SAP BTP Cloud Foundry (HTML5 Repository)
Si vous déployez sur **SAP BTP Cloud Foundry** (l'environnement natif de BAS) :
1. Vous n'avez **pas besoin** d'URL ABAP !
2. Exécutez simplement l'assistant de configuration :
   ```bash
   cd drive-file-manager
   npm run deploy-config
   ```
3. Choisissez la cible **Cloud Foundry**. L'assistant générera automatiquement le fichier `mta.yaml` adapté à votre sous-compte BTP.

---

## 🛠️ Résumé des Commandes Utiles dans BAS

| Action | Commande |
| :--- | :--- |
| **Vérification TypeScript** | `npm --prefix drive-file-manager run ts-typecheck` |
| **Build de production** | `npm --prefix drive-file-manager run build` |
| **Lancement Fiori preview** | `npm run start-local` |

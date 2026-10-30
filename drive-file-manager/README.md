# SAP Fiori Google Drive File Manager (drive-file-manager)

Module d'application SAP Fiori (SAPUI5 avec TypeScript) orchestré pour l'environnement **Sandbox SAP Business Application Studio (BAS)**.

---

## 👥 Équipe Projet — SAPErp Solution
- **Consultant Technico-Fonctionnel SAP** : RAMANANTSIRAHONANA ALDINO
- **Delivery Manager** : SAMel
- **Manager de Projet** : Flavien

---

## 🚀 Démarrage Rapide dans la Sandbox BAS

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'application dans la Sandbox Fiori Launchpad (FLP)
npm run start-local

# OU Lancer en mode Standalone (sans FLP)
npm run start-noflp

# 3. Contrôle de typage TypeScript strict
npm run ts-typecheck

# 4. Contrôle ESLint & Clean Code (0 erreur, 0 avertissement)
npm run lint

# 5. Compilation de test
npm run build
```

---

## 🛠️ Configuration du Proxy CPI
Le proxy de développement est configuré dans [ui5-local.yaml](./ui5-local.yaml) et redirige tous les appels `/cpi-api/*` vers l'instance SAP Integration Suite :
`https://178020eetrial.it-cpitrial06-rt.cfapps.us10-001.hana.ondemand.com/http/manage/file/gd/v1`

---

## 📋 Fonctionnalités Validées en Sandbox
1. **Exploration & Navigation** : Fil d'Ariane, section dossiers en grille fluide, vue Grille et vue Tableau.
2. **Double Thème** : Mode Sombre (*Midnight Slate*) et Mode Clair Fiori Horizon avec bouton de bascule dynamique dans l'en-tête.
3. **Opérations Complètes (CRUD)** : Consultation, téléchargement binaire raw, renommage, mise à jour du contenu, suppression, téléversement de fichier.
4. **Tableau de Bord** : Tuiles récapitulatives et ventilation par typologie et date.
5. **Localisation /fr** : Interface et formatages standardisés en français.

# SAP-CPI-DRIVE
Application SAP Fiori (SAPUI5 avec TypeScript) pour gérer des fichiers Google Drive via SAP CPI : envoi, téléchargement, modification, suppression, affichage et tableau de bord.

---

## 🚀 Démarrage Rapide (Depuis la racine du projet)

Vous pouvez lancer les commandes directement depuis la racine du dépôt :

```bash
# 1. Installez les dépendances dans le projet drive-file-manager
cd drive-file-manager && npm install && cd ..

# 2. Lancer l'application localement avec SAP Fiori Launchpad Sandbox (FLP)
npm run start-local

# OU Lancer l'application en mode Standalone (sans FLP)
npm run start-noflp

# 3. Compiler l'application pour la production
npm run build
```

---

## 📁 Structure du Projet
- **`drive-file-manager/`** : Application SAP UI5 (TypeScript).
- **`Iflow/`** : Archive et fichiers de configuration de l'IFlow SAP CPI (`INTEGRATION_API_DRIVE`).

Pour plus de détails sur la configuration du proxy CPI et l'authentification Basic Auth, consultez le [README de drive-file-manager](./drive-file-manager/README.md).

import Controller from "sap/ui/core/mvc/Controller";
import JSONModel from "sap/ui/model/json/JSONModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import ActionSheet from "sap/m/ActionSheet";
import Button from "sap/m/Button";
import Dialog from "sap/m/Dialog";
import Label from "sap/m/Label";
import Input from "sap/m/Input";
import FileUploader from "sap/ui/unified/FileUploader";
import VBox from "sap/m/VBox";
import Breadcrumbs from "sap/m/Breadcrumbs";
import Link from "sap/m/Link";
import Select from "sap/m/Select";
import SearchField from "sap/m/SearchField";
import ListBinding from "sap/ui/model/ListBinding";
import Table from "sap/m/Table";
import Control from "sap/ui/core/Control";
import UI5Event from "sap/ui/base/Event";
import Theming from "sap/ui/core/Theming";
import CustomListItem from "sap/m/CustomListItem";
import { CpiDriveService, DriveFile } from "../model/CpiDriveService";
import Formatter from "../model/formatter";

interface FolderBreadcrumb {
    id: string;
    name: string;
}

interface StatsByType {
    category: string;
    count: number;
    icon: string;
}

interface StatsByDate {
    period: string;
    count: number;
}

interface DashboardCounts {
    totalFiles: number;
    totalFolders: number;
    pdfCount: number;
    imgCount: number;
    docCount: number;
    sheetCount: number;
    archiveCount: number;
    pptCount: number;
    videoCount: number;
    otherCount: number;
    modToday: number;
    modWeek: number;
    modMonth: number;
    modOlder: number;
}

/**
 * Contrôleur principal pour l'application Fiori Google Drive File Manager
 * @namespace poc.cpi.ral.drivefilemanager.controller
 */
export default class Drive extends Controller {
    public formatter = Formatter;

    private static currentTheme = "sap_horizon";
    private driveService: CpiDriveService = new CpiDriveService();
    private currentFolderHistory: FolderBreadcrumb[] = [];
    private actionSheetItem?: DriveFile;

    public formatFileSize(bytes?: number | null): string {
        return Formatter.formatFileSize(bytes);
    }

    public formatDate(dateStr?: string): string {
        return Formatter.formatDate(dateStr);
    }

    public formatFileIcon(isFolder?: boolean, mimeType?: string, fileName?: string): string {
        return Formatter.formatFileIcon(isFolder, mimeType, fileName);
    }

    public formatFileIconColor(isFolder?: boolean, mimeType?: string, fileName?: string): string {
        return Formatter.formatFileIconColor(isFolder, mimeType, fileName);
    }

    public formatFileTypeBadge(isFolder?: boolean, mimeType?: string, fileName?: string): string {
        return Formatter.formatFileTypeBadge(isFolder, mimeType, fileName);
    }

    public formatCardBgClass(isFolder?: boolean, mimeType?: string, fileName?: string): string {
        return Formatter.formatCardBgClass(isFolder, mimeType, fileName);
    }

    /**
     * Formatte le label de statistique : "N fichiers (X%)"
     */
    public formatStatLabel(count: number, percent: number): string {
        return `${count} fichier${count > 1 ? "s" : ""} (${percent}%)`;
    }

    public onInit(): void {
        this.driveService = new CpiDriveService();

        // Initialisation du modèle Drive principal
        const driveModel = new JSONModel({
            files: [] as DriveFile[],
            folders: [] as DriveFile[],
            filesOnly: [] as DriveFile[],
            allFiles: [] as DriveFile[],
            currentFolderId: "",
            busy: false,
            isDarkMode: false,
            themeIcon: "sap-icon://dark-mode",
            themeText: "Mode Sombre"
        });
        this.getView()?.setModel(driveModel, "drive");

        // Initialisation du modèle Statistiques / Dashboard
        const statsModel = new JSONModel({
            totalItems: 0,
            totalFiles: 0,
            totalFolders: 0,
            byType: [] as StatsByType[],
            byDate: [] as StatsByDate[]
        });
        this.getView()?.setModel(statsModel, "stats");

        // Initialisation du Thème
        this.initThemeState();

        // Chargement initial des données Drive et du Dashboard
        void this.loadDriveData();
        void this.loadDashboardData();
    }

    /**
     * Initialise l'état du thème clair / sombre
     */
    private initThemeState(): void {
        Theming.setTheme(Drive.currentTheme);
        this.updateThemeModel(Drive.currentTheme);
    }

    /**
     * Met à jour les propriétés du modèle relatives au thème
     */
    private updateThemeModel(theme: string): void {
        const driveModel = this.getView()?.getModel("drive") as JSONModel | undefined;
        if (!driveModel) {
            return;
        }

        const isDark = theme.includes("dark");
        driveModel.setProperty("/isDarkMode", isDark);
        driveModel.setProperty("/themeIcon", isDark ? "sap-icon://light-mode" : "sap-icon://dark-mode");
        driveModel.setProperty("/themeText", isDark ? "Mode Clair" : "Mode Sombre");

        // Application de la classe sur la vue SAPUI5
        const view = this.getView();
        if (view) {
            if (isDark) {
                view.addStyleClass("appDarkMode");
                view.removeStyleClass("appLightMode");
            } else {
                view.addStyleClass("appLightMode");
                view.removeStyleClass("appDarkMode");
            }
        }
    }

    /**
     * Bascule dynamique entre le thème clair et le thème sombre
     */
    public onToggleTheme(): void {
        const current = Theming.getTheme() || "sap_horizon";
        const nextTheme = current.includes("dark") ? "sap_horizon" : "sap_horizon_dark";

        Drive.currentTheme = nextTheme;
        Theming.setTheme(nextTheme);
        this.updateThemeModel(nextTheme);

        MessageToast.show(nextTheme.includes("dark") ? "Thème sombre activé" : "Thème clair activé");
    }

    /**
     * Charge la liste des fichiers depuis le CPI pour le dossier courant
     */
    public async loadDriveData(folderId?: string): Promise<void> {
        const driveModel = this.getView()?.getModel("drive") as JSONModel | undefined;
        if (driveModel) {
            driveModel.setProperty("/busy", true);
        }

        try {
            const data = await this.driveService.listFiles(folderId);
            const files: DriveFile[] = data.files || [];

            if (driveModel) {
                driveModel.setProperty("/files", files);
                driveModel.setProperty("/currentFolderId", folderId || "");
            }

            this.applySortAndFilter();
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            MessageBox.error(`Erreur de chargement des fichiers : ${errMsg}`);
        } finally {
            if (driveModel) {
                driveModel.setProperty("/busy", false);
            }
        }
    }

    /**
     * Gestionnaire d'événement de changement de tri
     */
    public onSortSelect(): void {
        this.applySortAndFilter();
    }

    /**
     * Recherche instantanée
     */
    public onSearchLive(): void {
        this.applySortAndFilter();
    }

    /**
     * Applique le tri et le filtre textuel
     */
    private applySortAndFilter(): void {
        const driveModel = this.getView()?.getModel("drive") as JSONModel | undefined;
        if (!driveModel) {
            return;
        }

        const allFiles = (driveModel.getProperty("/files") as DriveFile[]) || [];
        const searchField = this.byId("searchField") as SearchField | undefined;
        const query = (searchField ? searchField.getValue() : "").toLowerCase().trim();

        const sortSelect = this.byId("sortSelect") as Select | undefined;
        const sortKey = sortSelect ? sortSelect.getSelectedKey() : "nameAsc";

        let filtered = allFiles;
        if (query) {
            filtered = allFiles.filter((f) => f.name.toLowerCase().includes(query));
        }

        const sortedFolders = filtered.filter((f) => f.isFolder).sort((a, b) => this.compareFiles(a, b, sortKey));
        const sortedFiles = filtered.filter((f) => !f.isFolder).sort((a, b) => this.compareFiles(a, b, sortKey));

        driveModel.setProperty("/folders", sortedFolders);
        driveModel.setProperty("/filesOnly", sortedFiles);

        // Mise à jour du binding du tableau
        const table = this.byId("filesTable") as Table | undefined;
        if (table) {
            const binding = table.getBinding("items") as ListBinding | undefined;
            if (binding) {
                if (query) {
                    binding.filter([new Filter("name", FilterOperator.Contains, query)]);
                } else {
                    binding.filter([]);
                }
            }
        }
    }

    /**
     * Algorithme de comparaison pour le tri
     */
    private compareFiles(a: DriveFile, b: DriveFile, sortKey: string): number {
        if (sortKey === "nameAsc") {
            return a.name.localeCompare(b.name, "fr");
        }
        if (sortKey === "nameDesc") {
            return b.name.localeCompare(a.name, "fr");
        }
        if (sortKey === "modDesc" || sortKey === "modAsc") {
            const tA = a.modifiedTime ? new Date(a.modifiedTime).getTime() : 0;
            const tB = b.modifiedTime ? new Date(b.modifiedTime).getTime() : 0;
            return sortKey === "modDesc" ? tB - tA : tA - tB;
        }
        if (sortKey === "createdDesc" || sortKey === "createdAsc") {
            const cA = a.createdTime ? new Date(a.createdTime).getTime() : 0;
            const cB = b.createdTime ? new Date(b.createdTime).getTime() : 0;
            return sortKey === "createdDesc" ? cB - cA : cA - cB;
        }
        if (sortKey === "sizeDesc") {
            return (b.size || 0) - (a.size || 0);
        }
        if (sortKey === "sizeAsc") {
            return (a.size || 0) - (b.size || 0);
        }
        return a.name.localeCompare(b.name, "fr");
    }

    /**
     * Charge l'ensemble des fichiers pour alimenter les KPIs du tableau de bord
     */
    public async loadDashboardData(): Promise<void> {
        try {
            const allData = await this.driveService.listFiles(undefined, undefined, true);
            const allFiles: DriveFile[] = allData.files || [];
            const driveModel = this.getView()?.getModel("drive") as JSONModel | undefined;
            if (driveModel) {
                driveModel.setProperty("/allFiles", allFiles);
            }

            this.updateDashboardStats(allFiles);
        } catch {
            // Tolérance d'échec silencieuse pour le tableau de bord
        }
    }

    /**
     * Calcule et met à jour les indicateurs du Dashboard
     */
    private updateDashboardStats(files: DriveFile[]): void {
        const statsModel = this.getView()?.getModel("stats") as JSONModel | undefined;
        if (!statsModel) {
            return;
        }

        const counts: DashboardCounts = {
            totalFiles: 0,
            totalFolders: 0,
            pdfCount: 0,
            imgCount: 0,
            docCount: 0,
            sheetCount: 0,
            archiveCount: 0,
            pptCount: 0,
            videoCount: 0,
            otherCount: 0,
            modToday: 0,
            modWeek: 0,
            modMonth: 0,
            modOlder: 0
        };

        const now = Date.now();
        const oneDayMs = 24 * 60 * 60 * 1000;

        for (const file of files) {
            this.classifyFile(file, counts);
            this.classifyDate(file.modifiedTime, now, oneDayMs, counts);
        }

        const total = counts.totalFiles || 1; // éviter division par 0
        const pct = (n: number): number => Math.round((n / total) * 100);

        statsModel.setData({
            totalItems: files.length,
            totalFiles: counts.totalFiles,
            totalFolders: counts.totalFolders,
            // KPIs individuels par type
            pdfCount: counts.pdfCount,
            imgCount: counts.imgCount,
            docCount: counts.docCount,
            sheetCount: counts.sheetCount,
            archiveCount: counts.archiveCount,
            pptCount: counts.pptCount,
            videoCount: counts.videoCount,
            otherCount: counts.otherCount,
            // Pourcentages (0-100)
            pdfPercent: pct(counts.pdfCount),
            imgPercent: pct(counts.imgCount),
            docPercent: pct(counts.docCount),
            sheetPercent: pct(counts.sheetCount),
            archivePercent: pct(counts.archiveCount),
            pptPercent: pct(counts.pptCount),
            videoPercent: pct(counts.videoCount),
            otherPercent: pct(counts.otherCount),
            byType: [
                { category: "Dossiers", count: counts.totalFolders, icon: "sap-icon://folder-blank" },
                { category: "Documents PDF", count: counts.pdfCount, icon: "sap-icon://pdf-attachment" },
                { category: "Images & Photos", count: counts.imgCount, icon: "sap-icon://attachment-photo" },
                { category: "Documents Texte / Word", count: counts.docCount, icon: "sap-icon://document" },
                { category: "Tableurs Excel / CSV", count: counts.sheetCount, icon: "sap-icon://excel-attachment" },
                { category: "Archives (ZIP/RAR)", count: counts.archiveCount, icon: "sap-icon://attachment-zip-file" },
                { category: "Présentations", count: counts.pptCount, icon: "sap-icon://ppt-attachment" },
                { category: "Vidéos", count: counts.videoCount, icon: "sap-icon://video" },
                { category: "Autres Fichiers", count: counts.otherCount, icon: "sap-icon://document-text" }
            ],
            byDate: [
                { period: "Aujourd'hui", count: counts.modToday },
                { period: "Cette semaine (7 jours)", count: counts.modWeek },
                { period: "Ce mois-ci (30 jours)", count: counts.modMonth },
                { period: "Plus anciens", count: counts.modOlder }
            ]
        });
    }

    private classifyFile(file: DriveFile, counts: DashboardCounts): void {
        if (file.isFolder) {
            counts.totalFolders++;
            return;
        }

        counts.totalFiles++;
        const mime = (file.mimeType || "").toLowerCase();
        const name = (file.name || "").toLowerCase();

        if (mime.includes("pdf") || name.endsWith(".pdf")) {
            counts.pdfCount++;
        } else if (mime.includes("image") || /\.(png|jpg|jpeg|gif|svg|webp|bmp|tiff)$/.test(name)) {
            counts.imgCount++;
        } else if (mime.includes("sheet") || mime.includes("excel") || /\.(xls|xlsx|csv|ods)$/.test(name)) {
            counts.sheetCount++;
        } else if (mime.includes("presentation") || mime.includes("powerpoint") || /\.(ppt|pptx|odp)$/.test(name)) {
            counts.pptCount++;
        } else if (mime.includes("word") || mime.includes("document") || /\.(doc|docx|txt|rtf|odt)$/.test(name)) {
            counts.docCount++;
        } else if (/\.(zip|rar|7z|tar|gz|bz2|xz)$/.test(name) || mime.includes("zip") || mime.includes("compressed") || mime.includes("archive")) {
            counts.archiveCount++;
        } else if (mime.includes("video") || /\.(mp4|avi|mkv|mov|wmv|flv|webm|m4v)$/.test(name)) {
            counts.videoCount++;
        } else {
            counts.otherCount++;
        }
    }

    private classifyDate(dateStr: string | undefined, now: number, oneDayMs: number, counts: DashboardCounts): void {
        if (!dateStr) {
            return;
        }
        const modTime = new Date(dateStr).getTime();
        const diffDays = (now - modTime) / oneDayMs;

        if (diffDays <= 1) {
            counts.modToday++;
        } else if (diffDays <= 7) {
            counts.modWeek++;
        } else if (diffDays <= 30) {
            counts.modMonth++;
        } else {
            counts.modOlder++;
        }
    }

    /**
     * Actualise les données du dossier courant et du dashboard
     */
    public onRefresh(): void {
        const driveModel = this.getView()?.getModel("drive") as JSONModel | undefined;
        const currentFolderId = (driveModel?.getProperty("/currentFolderId") as string) || "";
        void this.loadDriveData(currentFolderId);
        void this.loadDashboardData();
    }

    /**
     * Sélection d'onglet (Drive ou Dashboard)
     */
    public onTabSelect(event: UI5Event): void {
        const params = event.getParameters() as { key?: string };
        if (params.key === "dashboard") {
            void this.loadDashboardData();
        }
    }

    /**
     * Bascule entre la vue Grille et la vue Tableau
     */
    public onLayoutChange(event: UI5Event): void {
        const params = event.getParameters() as { item?: Control };
        const key = params.item?.getId().includes("table") ? "table" : "grid";
        const gridView = this.byId("gridView") as Control | undefined;
        const filesTable = this.byId("filesTable") as Control | undefined;

        if (gridView && filesTable) {
            const isTable = key === "table";
            gridView.setVisible(!isTable);
            filesTable.setVisible(isTable);
        }
    }

    /**
     * Navigation dans un sous-dossier depuis la vue grille
     */
    public onFolderPress(event: UI5Event): void {
        const item = event.getSource<CustomListItem>();
        const context = item.getBindingContext("drive");
        const folder = context?.getObject() as DriveFile | undefined;

        if (folder?.isFolder) {
            this.currentFolderHistory.push({ id: folder.id, name: folder.name });
            this.updateBreadcrumbs();
            void this.loadDriveData(folder.id);
        }
    }

    /**
     * Navigation dans un sous-dossier depuis la vue tableau
     */
    public onItemPress(event: UI5Event): void {
        const item = event.getSource<Control>();
        const context = item.getBindingContext("drive");
        const file = context?.getObject() as DriveFile | undefined;

        if (file?.isFolder) {
            this.currentFolderHistory.push({ id: file.id, name: file.name });
            this.updateBreadcrumbs();
            void this.loadDriveData(file.id);
        }
    }

    /**
     * Remonte au dossier parent
     */
    public onNavUp(): void {
        if (this.currentFolderHistory.length > 0) {
            this.currentFolderHistory.pop();
            const parent = this.currentFolderHistory[this.currentFolderHistory.length - 1];
            this.updateBreadcrumbs();
            void this.loadDriveData(parent ? parent.id : undefined);
        }
    }

    /**
     * Met à jour le fil d'Ariane
     */
    private updateBreadcrumbs(): void {
        const breadcrumbs = this.byId("breadcrumbs") as Breadcrumbs | undefined;
        if (!breadcrumbs) {
            return;
        }

        breadcrumbs.removeAllLinks();
        this.currentFolderHistory.forEach((folder, index) => {
            const isLast = index === this.currentFolderHistory.length - 1;
            if (!isLast) {
                const link = new Link({
                    text: folder.name,
                    press: () => {
                        this.currentFolderHistory = this.currentFolderHistory.slice(0, index + 1);
                        this.updateBreadcrumbs();
                        void this.loadDriveData(folder.id);
                    }
                });
                breadcrumbs.addLink(link);
            }
        });

        if (this.currentFolderHistory.length > 0) {
            const last = this.currentFolderHistory[this.currentFolderHistory.length - 1];
            breadcrumbs.setCurrentLocationText(last.name);
        } else {
            breadcrumbs.setCurrentLocationText("Mon Drive");
        }

        const btnUp = this.byId("btnUp") as Button | undefined;
        if (btnUp) {
            btnUp.setEnabled(this.currentFolderHistory.length > 0);
        }
    }

    /**
     * Ouvre le menu d'actions contextuel (3 points)
     */
    public onOpenActionSheet(event: UI5Event): void {
        const button = event.getSource<Button>();
        const context = button.getBindingContext("drive");
        if (!context) {
            return;
        }

        this.actionSheetItem = context.getObject() as DriveFile;
        const isFolder = Boolean(this.actionSheetItem?.isFolder);

        const actionSheet = new ActionSheet({
            title: "Actions",
            buttons: [
                new Button({
                    text: "Détails",
                    icon: "sap-icon://hint",
                    press: () => {
                        if (this.actionSheetItem) {
                            this.showDetailsDialog(this.actionSheetItem);
                        }
                    }
                }),
                new Button({
                    text: "Télécharger",
                    icon: "sap-icon://download",
                    visible: !isFolder,
                    press: () => {
                        if (this.actionSheetItem) {
                            void this.downloadFileAction(this.actionSheetItem);
                        }
                    }
                }),
                new Button({
                    text: "Renommer",
                    icon: "sap-icon://edit",
                    press: () => {
                        if (this.actionSheetItem) {
                            this.openRenameDialog(this.actionSheetItem);
                        }
                    }
                }),
                new Button({
                    text: "Remplacer le contenu",
                    icon: "sap-icon://attachment",
                    visible: !isFolder,
                    press: () => {
                        if (this.actionSheetItem) {
                            this.openUpdateContentDialog(this.actionSheetItem);
                        }
                    }
                }),
                new Button({
                    text: "Supprimer",
                    icon: "sap-icon://delete",
                    type: "Reject",
                    press: () => {
                        if (this.actionSheetItem) {
                            this.deleteFileAction(this.actionSheetItem);
                        }
                    }
                })
            ]
        });

        actionSheet.openBy(button);
    }

    /**
     * Affiche les métadonnées détaillées du document
     */
    private showDetailsDialog(file: DriveFile): void {
        const vbox = new VBox();
        vbox.addStyleClass("sapUiSmallMargin");

        const addField = (header: string, val: string): void => {
            const lbl = new Label({ text: header, design: "Bold" });
            const txt = new Label({ text: val });
            vbox.addItem(lbl);
            vbox.addItem(txt);
        };

        addField("Nom :", file.name);
        addField("Identifiant Google Drive :", file.id);
        addField("Type MIME :", file.mimeType || (file.isFolder ? "Dossier" : "Fichier"));
        addField("Taille :", Formatter.formatFileSize(file.size));
        addField("Date de création :", Formatter.formatDate(file.createdTime));
        addField("Dernière modification :", Formatter.formatDate(file.modifiedTime));

        const dialog = new Dialog({
            title: "Détails du Document",
            content: [vbox],
            endButton: new Button({
                text: "Fermer",
                press: () => dialog.close()
            }),
            afterClose: () => dialog.destroy()
        });

        dialog.open();
    }

    /**
     * Téléchargement direct du fichier
     */
    private async downloadFileAction(file: DriveFile): Promise<void> {
        try {
            MessageToast.show("Téléchargement en cours...");
            const blob = await this.driveService.downloadFile(file.id, file.name);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = file.name;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error: unknown) {
            const errMsg = error instanceof Error ? error.message : String(error);
            MessageBox.error(`Erreur de téléchargement : ${errMsg}`);
        }
    }

    /**
     * Boîte de dialogue de téléversement
     */
    public onOpenUploadDialog(): void {
        const fileUploader = new FileUploader({
            width: "100%",
            placeholder: "Sélectionnez un fichier..."
        });

        const customNameInput = new Input({
            placeholder: "Nom personnalisé (optionnel)"
        });

        const vbox = new VBox();
        vbox.addStyleClass("sapUiSmallMargin");
        vbox.addItem(new Label({ text: "Fichier à importer :" }));
        vbox.addItem(fileUploader);
        vbox.addItem(new Label({ text: "Nom optionnel du document :" }));
        vbox.addItem(customNameInput);

        const dialog = new Dialog({
            title: "Importer un Document",
            content: [vbox],
            beginButton: new Button({
                text: "Importer",
                type: "Emphasized",
                press: () => {
                    const domRef = fileUploader.getFocusDomRef() as HTMLInputElement | null;
                    const files = domRef?.files;

                    if (!files || files.length === 0) {
                        MessageBox.warning("Veuillez choisir un fichier à importer.");
                        return;
                    }

                    const selectedFile = files[0];
                    const customName = customNameInput.getValue().trim();
                    dialog.close();

                    void (async () => {
                        try {
                            MessageToast.show("Téléversement en cours...");
                            const driveModel = this.getView()?.getModel("drive") as JSONModel | undefined;
                            const folderId = (driveModel?.getProperty("/currentFolderId") as string) || "";

                            await this.driveService.uploadFile(selectedFile, folderId, customName || undefined);
                            MessageToast.show("Document importé avec succès !");
                            this.onRefresh();
                        } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : String(err);
                            MessageBox.error(`Erreur lors de l'import : ${msg}`);
                        }
                    })();
                }
            }),
            endButton: new Button({
                text: "Annuler",
                press: () => dialog.close()
            }),
            afterClose: () => dialog.destroy()
        });

        dialog.open();
    }

    /**
     * Boîte de dialogue pour renommer un fichier
     */
    private openRenameDialog(file: DriveFile): void {
        const nameInput = new Input({ value: file.name });
        const vbox = new VBox();
        vbox.addStyleClass("sapUiSmallMargin");
        vbox.addItem(new Label({ text: "Nouveau nom :" }));
        vbox.addItem(nameInput);

        const dialog = new Dialog({
            title: "Renommer",
            content: [vbox],
            beginButton: new Button({
                text: "Enregistrer",
                type: "Emphasized",
                press: () => {
                    const newName = nameInput.getValue().trim();
                    if (!newName) {
                        MessageBox.warning("Le nom ne peut pas être vide.");
                        return;
                    }

                    dialog.close();
                    void (async () => {
                        try {
                            MessageToast.show("Mise à jour du nom...");
                            await this.driveService.updateFile(file.id, newName);
                            MessageToast.show("Fichier renommé avec succès !");
                            this.onRefresh();
                        } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : String(err);
                            MessageBox.error(`Erreur lors du renommage : ${msg}`);
                        }
                    })();
                }
            }),
            endButton: new Button({
                text: "Annuler",
                press: () => dialog.close()
            }),
            afterClose: () => dialog.destroy()
        });

        dialog.open();
    }

    /**
     * Boîte de dialogue pour remplacer le contenu binaire
     */
    private openUpdateContentDialog(file: DriveFile): void {
        const fileUploader = new FileUploader({
            width: "100%",
            placeholder: "Sélectionnez le fichier de remplacement..."
        });

        const vbox = new VBox();
        vbox.addStyleClass("sapUiSmallMargin");
        vbox.addItem(new Label({ text: "Sélectionnez le nouveau fichier binaire :" }));
        vbox.addItem(fileUploader);

        const dialog = new Dialog({
            title: "Remplacer le Contenu",
            content: [vbox],
            beginButton: new Button({
                text: "Remplacer",
                type: "Emphasized",
                press: () => {
                    const domRef = fileUploader.getFocusDomRef() as HTMLInputElement | null;
                    const files = domRef?.files;

                    if (!files || files.length === 0) {
                        MessageBox.warning("Veuillez sélectionner un fichier.");
                        return;
                    }

                    const newFile = files[0];
                    dialog.close();

                    void (async () => {
                        try {
                            MessageToast.show("Remplacement du fichier...");
                            await this.driveService.updateFile(file.id, file.name, newFile);
                            MessageToast.show("Contenu mis à jour avec succès !");
                            this.onRefresh();
                        } catch (err: unknown) {
                            const msg = err instanceof Error ? err.message : String(err);
                            MessageBox.error(`Erreur de mise à jour : ${msg}`);
                        }
                    })();
                }
            }),
            endButton: new Button({
                text: "Annuler",
                press: () => dialog.close()
            }),
            afterClose: () => dialog.destroy()
        });

        dialog.open();
    }

    /**
     * Suppression d'un document après confirmation
     */
    private deleteFileAction(file: DriveFile): void {
        MessageBox.confirm(`Voulez-vous vraiment supprimer "${file.name}" ?`, {
            title: "Confirmation de suppression",
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: (action: string | null) => {
                if (action === MessageBox.Action.OK) {
                    MessageToast.show("Suppression en cours...");
                    this.driveService
                        .deleteFile(file.id)
                        .then(() => {
                            MessageToast.show("Élément supprimé avec succès !");
                            this.onRefresh();
                        })
                        .catch((error: unknown) => {
                            const msg = error instanceof Error ? error.message : String(error);
                            MessageBox.error(`Erreur lors de la suppression : ${msg}`);
                        });
                }
            }
        });
    }
}

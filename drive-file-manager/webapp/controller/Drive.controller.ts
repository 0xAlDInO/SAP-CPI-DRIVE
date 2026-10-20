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
import Event from "sap/ui/base/Event";
import { CpiDriveService, DriveFile } from "../model/CpiDriveService";

interface FolderBreadcrumb {
    id: string;
    name: string;
}

/**
 * @namespace poc.cpi.ral.drivefilemanager.controller
 */
export default class Drive extends Controller {
    private driveService: CpiDriveService;
    private currentFolderHistory: FolderBreadcrumb[] = [];
    private actionSheetItem?: DriveFile;

    public onInit(): void {
        this.driveService = new CpiDriveService();

        // Initialize Drive JSON Model
        const driveModel = new JSONModel({
            files: [],
            allFiles: [],
            currentFolderId: "",
            busy: false
        });
        this.getView()?.setModel(driveModel, "drive");

        // Initialize Stats / Dashboard Model
        const statsModel = new JSONModel({
            totalItems: 0,
            totalFiles: 0,
            totalFolders: 0,
            byType: [],
            byDate: []
        });
        this.getView()?.setModel(statsModel, "stats");

        // Load Initial Data
        this.loadDriveData();
    }

    /**
     * Load list of files from CPI
     */
    public async loadDriveData(folderId?: string): Promise<void> {
        const driveModel = this.getView()?.getModel("drive") as JSONModel;
        driveModel.setProperty("/busy", true);

        try {
            const data = await this.driveService.listFiles(folderId);
            const files: DriveFile[] = data.files || [];

            driveModel.setProperty("/files", files);
            driveModel.setProperty("/allFiles", files);
            driveModel.setProperty("/currentFolderId", folderId || "");

            this.updateDashboardStats(files);
        } catch (error: any) {
            MessageBox.error("Erreur de chargement : " + (error.message || error));
        } finally {
            driveModel.setProperty("/busy", false);
        }
    }

    /**
     * Compute and update statistics for the Dashboard
     */
    private updateDashboardStats(files: DriveFile[]): void {
        const statsModel = this.getView()?.getModel("stats") as JSONModel;

        const totalItems = files.length;
        let totalFiles = 0;
        let totalFolders = 0;

        let pdfCount = 0;
        let imgCount = 0;
        let docCount = 0;
        let sheetCount = 0;
        let otherCount = 0;

        let modToday = 0;
        let modWeek = 0;
        let modMonth = 0;
        let modOlder = 0;

        const now = new Date().getTime();
        const oneDayMs = 24 * 60 * 60 * 1000;

        files.forEach((file) => {
            if (file.isFolder) {
                totalFolders++;
            } else {
                totalFiles++;

                // By Type
                const mime = (file.mimeType || "").toLowerCase();
                if (mime.includes("pdf")) {
                    pdfCount++;
                } else if (mime.includes("image") || mime.includes("png") || mime.includes("jpeg")) {
                    imgCount++;
                } else if (mime.includes("word") || mime.includes("document") || mime.includes("text")) {
                    docCount++;
                } else if (mime.includes("excel") || mime.includes("spreadsheet") || mime.includes("csv")) {
                    sheetCount++;
                } else {
                    otherCount++;
                }
            }

            // By Date
            if (file.modifiedTime) {
                const modTime = new Date(file.modifiedTime).getTime();
                const diffDays = (now - modTime) / oneDayMs;

                if (diffDays <= 1) {
                    modToday++;
                } else if (diffDays <= 7) {
                    modWeek++;
                } else if (diffDays <= 30) {
                    modMonth++;
                } else {
                    modOlder++;
                }
            }
        });

        statsModel.setData({
            totalItems,
            totalFiles,
            totalFolders,
            byType: [
                { category: "Dossiers", count: totalFolders, icon: "sap-icon://folder-blank" },
                { category: "PDF", count: pdfCount, icon: "sap-icon://pdf-attachment" },
                { category: "Images", count: imgCount, icon: "sap-icon://attachment-photo" },
                { category: "Documents Textes/Word", count: docCount, icon: "sap-icon://document" },
                { category: "Tableurs Excel/CSV", count: sheetCount, icon: "sap-icon://excel-attachment" },
                { category: "Autres", count: otherCount, icon: "sap-icon://document-text" }
            ],
            byDate: [
                { period: "Aujourd'hui", count: modToday },
                { period: "Cette semaine (7 jours)", count: modWeek },
                { period: "Ce mois-ci (30 jours)", count: modMonth },
                { period: "Plus anciens", count: modOlder }
            ]
        });
    }

    /**
     * Refresh data
     */
    public onRefresh(): void {
        const driveModel = this.getView()?.getModel("drive") as JSONModel;
        const currentFolderId = driveModel.getProperty("/currentFolderId");
        this.loadDriveData(currentFolderId);
    }

    /**
     * Tab Selection Event
     */
    public onTabSelect(event: Event): void {
        const params = event.getParameters() as any;
        const key = params?.key;
        if (key === "dashboard") {
            const driveModel = this.getView()?.getModel("drive") as JSONModel;
            const allFiles = driveModel.getProperty("/allFiles") || [];
            this.updateDashboardStats(allFiles);
        }
    }

    /**
     * Search filtering
     */
    public onSearchLive(event: Event): void {
        const params = event.getParameters() as any;
        const query = params?.query || params?.newValue || "";
        const table = this.byId("filesTable") as any;
        const binding = table.getBinding("items");

        if (query) {
            const filter = new Filter("name", FilterOperator.Contains, query);
            binding.filter([filter]);
        } else {
            binding.filter([]);
        }
    }

    /**
     * Handle item click (drill into folder)
     */
    public onItemPress(event: Event): void {
        const listItem = event.getSource() as any;
        const context = listItem.getBindingContext("drive");
        const file: DriveFile = context ? context.getObject() : null;

        if (file && file.isFolder) {
            this.currentFolderHistory.push({
                id: file.id,
                name: file.name
            });
            this.updateBreadcrumbs();
            this.loadDriveData(file.id);
        }
    }

    /**
     * Navigate up to parent folder
     */
    public onNavUp(): void {
        if (this.currentFolderHistory.length > 0) {
            this.currentFolderHistory.pop();
            const parent = this.currentFolderHistory[this.currentFolderHistory.length - 1];
            this.updateBreadcrumbs();
            this.loadDriveData(parent ? parent.id : undefined);
        }
    }

    /**
     * Update Breadcrumb controls
     */
    private updateBreadcrumbs(): void {
        const breadcrumbs = this.byId("breadcrumbs") as Breadcrumbs;
        breadcrumbs.removeAllLinks();

        this.currentFolderHistory.forEach((folder, index) => {
            const isLast = index === this.currentFolderHistory.length - 1;
            if (!isLast) {
                const link = new Link({
                    text: folder.name,
                    press: () => {
                        this.currentFolderHistory = this.currentFolderHistory.slice(0, index + 1);
                        this.updateBreadcrumbs();
                        this.loadDriveData(folder.id);
                    }
                });
                breadcrumbs.addLink(link);
            }
        });

        if (this.currentFolderHistory.length > 0) {
            const lastFolder = this.currentFolderHistory[this.currentFolderHistory.length - 1];
            breadcrumbs.setCurrentLocationText(lastFolder.name);
        } else {
            breadcrumbs.setCurrentLocationText("Mon Drive");
        }

        const btnUp = this.byId("btnUp") as Button;
        btnUp.setEnabled(this.currentFolderHistory.length > 0);
    }

    /**
     * Open ActionSheet for 3 dots button
     */
    public onOpenActionSheet(event: Event): void {
        const button = event.getSource() as Button;
        const context = button.getBindingContext("drive");
        if (!context) {
            return;
        }
        this.actionSheetItem = context.getObject() as DriveFile;

        const actionSheet = new ActionSheet({
            title: "Actions",
            buttons: [
                new Button({
                    text: "Détails",
                    icon: "sap-icon://hint",
                    press: () => this.onShowDetails(this.actionSheetItem!)
                }),
                new Button({
                    text: "Télécharger",
                    icon: "sap-icon://download",
                    visible: !this.actionSheetItem?.isFolder,
                    press: () => this.onDownloadFile(this.actionSheetItem!)
                }),
                new Button({
                    text: "Renommer",
                    icon: "sap-icon://edit",
                    press: () => this.onOpenRenameDialog(this.actionSheetItem!)
                }),
                new Button({
                    text: "Remplacer le contenu",
                    icon: "sap-icon://attachment",
                    visible: !this.actionSheetItem?.isFolder,
                    press: () => this.onOpenUpdateContentDialog(this.actionSheetItem!)
                }),
                new Button({
                    text: "Supprimer",
                    icon: "sap-icon://delete",
                    type: "Reject",
                    press: () => this.onDeleteFile(this.actionSheetItem!)
                })
            ]
        });

        actionSheet.openBy(button);
    }

    /**
     * Show File Details Dialog
     */
    public onShowDetails(file: DriveFile): void {
        const vbox = new VBox();
        vbox.addStyleClass("sapUiSmallMargin");

        const lblNameHeader = new Label({ text: "Nom :" });
        lblNameHeader.setDesign("Bold");
        const lblNameValue = new Label({ text: file.name });

        const lblIdHeader = new Label({ text: "ID :" });
        lblIdHeader.setDesign("Bold");
        lblIdHeader.addStyleClass("sapUiTinyMarginTop");
        const lblIdValue = new Label({ text: file.id });

        const lblMimeHeader = new Label({ text: "Type MIME :" });
        lblMimeHeader.setDesign("Bold");
        lblMimeHeader.addStyleClass("sapUiTinyMarginTop");
        const lblMimeValue = new Label({ text: file.mimeType || "Dossier" });

        const lblSizeHeader = new Label({ text: "Taille :" });
        lblSizeHeader.setDesign("Bold");
        lblSizeHeader.addStyleClass("sapUiTinyMarginTop");
        const lblSizeValue = new Label({ text: this.formatFileSize(file.size) });

        const lblCreatedHeader = new Label({ text: "Créé le :" });
        lblCreatedHeader.setDesign("Bold");
        lblCreatedHeader.addStyleClass("sapUiTinyMarginTop");
        const lblCreatedValue = new Label({ text: this.formatDate(file.createdTime) });

        const lblModifiedHeader = new Label({ text: "Modifié le :" });
        lblModifiedHeader.setDesign("Bold");
        lblModifiedHeader.addStyleClass("sapUiTinyMarginTop");
        const lblModifiedValue = new Label({ text: this.formatDate(file.modifiedTime) });

        vbox.addItem(lblNameHeader);
        vbox.addItem(lblNameValue);
        vbox.addItem(lblIdHeader);
        vbox.addItem(lblIdValue);
        vbox.addItem(lblMimeHeader);
        vbox.addItem(lblMimeValue);
        vbox.addItem(lblSizeHeader);
        vbox.addItem(lblSizeValue);
        vbox.addItem(lblCreatedHeader);
        vbox.addItem(lblCreatedValue);
        vbox.addItem(lblModifiedHeader);
        vbox.addItem(lblModifiedValue);

        const dialog = new Dialog({
            title: "Détails du Fichier",
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
     * Download File
     */
    public async onDownloadFile(file: DriveFile): Promise<void> {
        try {
            MessageToast.show("Téléchargement en cours...");
            const blob = await this.driveService.downloadFile(file.id, file.name);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = file.name;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            MessageBox.error("Erreur de téléchargement : " + (error.message || error));
        }
    }

    /**
     * Open Upload Dialog
     */
    public onOpenUploadDialog(): void {
        const fileUploader = new FileUploader({
            width: "100%",
            placeholder: "Choisissez un fichier..."
        });

        const vbox = new VBox();
        vbox.addStyleClass("sapUiSmallMargin");
        vbox.addItem(new Label({ text: "Sélectionnez le fichier à importer :" }));
        vbox.addItem(fileUploader);

        const dialog = new Dialog({
            title: "Importer un fichier",
            content: [vbox],
            beginButton: new Button({
                text: "Importer",
                type: "Emphasized",
                press: async () => {
                    const domRef = fileUploader.getFocusDomRef() as HTMLInputElement;
                    const files = domRef ? domRef.files : null;

                    if (!files || files.length === 0) {
                        MessageBox.warning("Veuillez sélectionner un fichier.");
                        return;
                    }

                    const selectedFile = files[0];
                    dialog.close();

                    try {
                        MessageToast.show("Importation en cours...");
                        const driveModel = this.getView()?.getModel("drive") as JSONModel;
                        const currentFolderId = driveModel.getProperty("/currentFolderId");

                        await this.driveService.uploadFile(selectedFile, currentFolderId);
                        MessageToast.show("Fichier importé avec succès !");
                        this.onRefresh();
                    } catch (error: any) {
                        MessageBox.error("Erreur lors de l'import : " + (error.message || error));
                    }
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
     * Open Rename Dialog
     */
    public onOpenRenameDialog(file: DriveFile): void {
        const nameInput = new Input({
            value: file.name
        });

        const vbox = new VBox();
        vbox.addStyleClass("sapUiSmallMargin");
        vbox.addItem(new Label({ text: "Nouveau nom :" }));
        vbox.addItem(nameInput);

        const dialog = new Dialog({
            title: "Renommer le fichier",
            content: [vbox],
            beginButton: new Button({
                text: "Enregistrer",
                type: "Emphasized",
                press: async () => {
                    const newName = nameInput.getValue().trim();
                    if (!newName) {
                        MessageBox.warning("Le nom ne peut pas être vide.");
                        return;
                    }

                    dialog.close();
                    try {
                        MessageToast.show("Mise à jour...");
                        await this.driveService.updateFile(file.id, newName);
                        MessageToast.show("Fichier renommé avec succès !");
                        this.onRefresh();
                    } catch (error: any) {
                        MessageBox.error("Erreur lors du renommage : " + (error.message || error));
                    }
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
     * Open Update File Content Dialog
     */
    public onOpenUpdateContentDialog(file: DriveFile): void {
        const fileUploader = new FileUploader({
            width: "100%",
            placeholder: "Choisissez le nouveau fichier..."
        });

        const vbox = new VBox();
        vbox.addStyleClass("sapUiSmallMargin");
        vbox.addItem(new Label({ text: "Sélectionnez le nouveau contenu :" }));
        vbox.addItem(fileUploader);

        const dialog = new Dialog({
            title: "Remplacer le contenu du fichier",
            content: [vbox],
            beginButton: new Button({
                text: "Remplacer",
                type: "Emphasized",
                press: async () => {
                    const domRef = fileUploader.getFocusDomRef() as HTMLInputElement;
                    const files = domRef ? domRef.files : null;

                    if (!files || files.length === 0) {
                        MessageBox.warning("Veuillez sélectionner un fichier.");
                        return;
                    }

                    const newFile = files[0];
                    dialog.close();

                    try {
                        MessageToast.show("Mise à jour du contenu...");
                        await this.driveService.updateFile(file.id, file.name, newFile);
                        MessageToast.show("Contenu mis à jour avec succès !");
                        this.onRefresh();
                    } catch (error: any) {
                        MessageBox.error("Erreur de mise à jour : " + (error.message || error));
                    }
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
     * Delete File
     */
    public onDeleteFile(file: DriveFile): void {
        MessageBox.confirm(`Voulez-vous vraiment supprimer "${file.name}" ?`, {
            title: "Confirmation de suppression",
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: (action: string | null) => {
                if (action === MessageBox.Action.OK) {
                    MessageToast.show("Suppression...");
                    this.driveService.deleteFile(file.id)
                        .then(() => {
                            MessageToast.show("Fichier supprimé !");
                            this.onRefresh();
                        })
                        .catch((error: any) => {
                            MessageBox.error("Erreur de suppression : " + (error.message || error));
                        });
                }
            }
        });
    }

    /**
     * Formatters
     */
    public formatFileSize(bytes?: number | null): string {
        if (bytes === null || bytes === undefined) {
            return "-";
        }
        if (bytes === 0) return "0 Octets";
        const k = 1024;
        const sizes = ["Octets", "Ko", "Mo", "Go"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    public formatDate(dateStr?: string): string {
        if (!dateStr) return "-";
        try {
            const date = new Date(dateStr);
            return date.toLocaleString();
        } catch {
            return dateStr;
        }
    }
}

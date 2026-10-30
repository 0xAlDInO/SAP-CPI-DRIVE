/**
 * Modèle de formatage des données pour l'application Google Drive SAP Fiori
 * @namespace poc.cpi.ral.drivefilemanager.model
 */

export default class Formatter {
    private static readonly ICON_MAP: Record<string, string> = {
        // Archives
        zip: "sap-icon://attachment-zip-file",
        rar: "sap-icon://attachment-zip-file",
        "7z": "sap-icon://attachment-zip-file",
        tar: "sap-icon://attachment-zip-file",
        gz: "sap-icon://attachment-zip-file",
        // Documents
        pdf: "sap-icon://pdf-attachment",
        doc: "sap-icon://document",
        docx: "sap-icon://document",
        txt: "sap-icon://document-text",
        rtf: "sap-icon://document",
        odt: "sap-icon://document",
        // Tableurs
        xls: "sap-icon://excel-attachment",
        xlsx: "sap-icon://excel-attachment",
        csv: "sap-icon://excel-attachment",
        ods: "sap-icon://excel-attachment",
        // Présentations
        ppt: "sap-icon://ppt-attachment",
        pptx: "sap-icon://ppt-attachment",
        odp: "sap-icon://ppt-attachment",
        // Images
        png: "sap-icon://attachment-photo",
        jpg: "sap-icon://attachment-photo",
        jpeg: "sap-icon://attachment-photo",
        gif: "sap-icon://attachment-photo",
        svg: "sap-icon://attachment-photo",
        webp: "sap-icon://attachment-photo",
        // Audio / Vidéo
        mp3: "sap-icon://audio",
        wav: "sap-icon://audio",
        mp4: "sap-icon://video",
        avi: "sap-icon://video",
        mkv: "sap-icon://video",
        // Code
        js: "sap-icon://developer-settings",
        ts: "sap-icon://developer-settings",
        json: "sap-icon://developer-settings",
        xml: "sap-icon://developer-settings",
        html: "sap-icon://developer-settings",
        css: "sap-icon://developer-settings"
    };

    private static readonly COLOR_MAP: Record<string, string> = {
        pdf: "#E53935",
        xls: "#2E7D32",
        xlsx: "#2E7D32",
        csv: "#2E7D32",
        doc: "#1E88E5",
        docx: "#1E88E5",
        ppt: "#FB8C00",
        pptx: "#FB8C00",
        zip: "#D81B60",
        rar: "#D81B60",
        "7z": "#D81B60",
        png: "#00897B",
        jpg: "#00897B",
        jpeg: "#00897B",
        svg: "#00897B",
        mp3: "#8E24AA",
        mp4: "#8E24AA"
    };

    private static readonly BADGE_MAP: Record<string, string> = {
        pdf: "PDF",
        xls: "EXCEL",
        xlsx: "EXCEL",
        csv: "CSV",
        doc: "WORD",
        docx: "WORD",
        txt: "TEXTE",
        ppt: "PPT",
        pptx: "PPT",
        zip: "ZIP",
        rar: "RAR",
        "7z": "7Z",
        png: "IMAGE",
        jpg: "IMAGE",
        jpeg: "IMAGE",
        svg: "SVG",
        mp3: "AUDIO",
        mp4: "VIDÉO"
    };

    private static getFileExtension(fileName?: string): string {
        if (!fileName || !fileName.includes(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Formate la taille d'un fichier en octets vers une unité lisible en français (Ko, Mo, Go)
     */
    public static formatFileSize(bytes?: number | null): string {
        if (bytes === null || bytes === undefined) {
            return "-";
        }
        if (bytes === 0) {
            return "0 Octet";
        }
        const k = 1024;
        const sizes = ["Octets", "Ko", "Mo", "Go", "To"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        const index = Math.min(i, sizes.length - 1);
        const val = bytes / Math.pow(k, index);
        const formatted = val.toLocaleString("fr-FR", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 1
        });
        return `${formatted} ${sizes[index]}`;
    }

    /**
     * Formate une date ISO en format français clair (JJ/MM/AAAA à HH:mm)
     */
    public static formatDate(dateStr?: string): string {
        if (!dateStr) {
            return "-";
        }
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) {
                return dateStr;
            }
            return new Intl.DateTimeFormat("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
            }).format(date);
        } catch {
            return dateStr;
        }
    }

    /**
     * Retourne l'icône SAPUI5 correspondant au type de fichier
     */
    public static formatFileIcon(isFolder?: boolean, mimeType?: string, fileName?: string): string {
        if (isFolder) {
            return "sap-icon://folder-blank";
        }
        const ext = Formatter.getFileExtension(fileName);
        if (Formatter.ICON_MAP[ext]) {
            return Formatter.ICON_MAP[ext];
        }
        const mime = (mimeType || "").toLowerCase();
        if (mime.includes("pdf")) {
            return "sap-icon://pdf-attachment";
        }
        if (mime.includes("image")) {
            return "sap-icon://attachment-photo";
        }
        if (mime.includes("sheet") || mime.includes("excel")) {
            return "sap-icon://excel-attachment";
        }
        if (mime.includes("word") || mime.includes("document")) {
            return "sap-icon://document";
        }
        if (mime.includes("zip") || mime.includes("compressed")) {
            return "sap-icon://attachment-zip-file";
        }
        return "sap-icon://document-text";
    }

    /**
     * Retourne la couleur thématique pour l'icône
     */
    public static formatFileIconColor(isFolder?: boolean, mimeType?: string, fileName?: string): string {
        if (isFolder) {
            return "#F59E0B";
        }
        const ext = Formatter.getFileExtension(fileName);
        if (Formatter.COLOR_MAP[ext]) {
            return Formatter.COLOR_MAP[ext];
        }
        const mime = (mimeType || "").toLowerCase();
        if (mime.includes("pdf")) {
            return "#E53935";
        }
        if (mime.includes("image")) {
            return "#00897B";
        }
        if (mime.includes("sheet") || mime.includes("excel")) {
            return "#2E7D32";
        }
        if (mime.includes("word")) {
            return "#1E88E5";
        }
        return "#546E7A";
    }

    /**
     * Badge textuel abrégé (ex: PDF, EXCEL, WORD, etc.)
     */
    public static formatFileTypeBadge(isFolder?: boolean, mimeType?: string, fileName?: string): string {
        if (isFolder) {
            return "DOSSIER";
        }
        const ext = Formatter.getFileExtension(fileName);
        if (Formatter.BADGE_MAP[ext]) {
            return Formatter.BADGE_MAP[ext];
        }
        if (ext) {
            return ext.toUpperCase();
        }
        const mime = (mimeType || "").toLowerCase();
        if (mime.includes("pdf")) {
            return "PDF";
        }
        if (mime.includes("image")) {
            return "IMG";
        }
        return "DOC";
    }

    /**
     * Classe CSS de fond thématique pour la miniature
     */
    public static formatCardBgClass(isFolder?: boolean, mimeType?: string, fileName?: string): string {
        if (isFolder) {
            return "preview-folder";
        }
        const ext = Formatter.getFileExtension(fileName);
        const mime = (mimeType || "").toLowerCase();

        if (ext === "pdf" || mime.includes("pdf")) {
            return "preview-pdf";
        }
        if (["xls", "xlsx", "csv"].includes(ext) || mime.includes("sheet") || mime.includes("excel")) {
            return "preview-excel";
        }
        if (["doc", "docx"].includes(ext) || mime.includes("word")) {
            return "preview-word";
        }
        if (["png", "jpg", "jpeg", "svg", "gif"].includes(ext) || mime.includes("image")) {
            return "preview-image";
        }
        if (["zip", "rar", "7z"].includes(ext) || mime.includes("zip")) {
            return "preview-archive";
        }
        return "preview-default";
    }
}

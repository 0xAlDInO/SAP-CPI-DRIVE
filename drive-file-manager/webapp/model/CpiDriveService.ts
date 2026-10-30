/**
 * Service de communication HTTP avec le flux SAP CPI (Integration Suite)
 * @namespace poc.cpi.ral.drivefilemanager.model
 */

export interface DriveFile {
    id: string;
    name: string;
    mimeType: string;
    isFolder: boolean;
    size: number | null;
    createdTime: string;
    modifiedTime: string;
    parents: string[];
}

export interface ListResponse {
    count: number;
    files: DriveFile[];
}

export interface DriveApiResponse {
    status?: string;
    message?: string;
    id?: string;
    name?: string;
}

export class CpiDriveService {
    private static credentialsUser = "";
    private static credentialsPassword = "";
    private readonly baseUrl: string;

    public constructor(baseUrl: string = "/cpi-api") {
        this.baseUrl = baseUrl;
    }

    /**
     * Définit en mémoire les identifiants pour l'environnement de développement
     */
    public static setCredentials(user: string, pass: string): void {
        CpiDriveService.credentialsUser = user;
        CpiDriveService.credentialsPassword = pass;
    }

    /**
     * Récupère de façon sécurisée les identifiants d'authentification s'ils sont configurés
     */
    private getAuthorizationHeader(): Record<string, string> {
        const headers: Record<string, string> = {};
        if (CpiDriveService.credentialsUser && CpiDriveService.credentialsPassword) {
            const token = btoa(`${CpiDriveService.credentialsUser}:${CpiDriveService.credentialsPassword}`);
            headers.Authorization = `Basic ${token}`;
        }
        return headers;
    }

    /**
     * Construit une query string sans appeler .append() pour respecter les règles du linter SAP Fiori
     */
    private buildQueryString(params: Record<string, string | boolean | undefined>): string {
        const queryParts: string[] = [];
        for (const [key, val] of Object.entries(params)) {
            if (val !== undefined && val !== null && val !== "") {
                queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(val))}`);
            }
        }
        return queryParts.length > 0 ? `?${queryParts.join("&")}` : "";
    }

    /**
     * Liste les fichiers et dossiers (supporte le dossier courant, recherche textuelle ou mode global)
     */
    public async listFiles(folderId?: string, search?: string, all?: boolean): Promise<ListResponse> {
        const query = this.buildQueryString({
            folderId,
            search,
            all: all ? "true" : undefined
        });

        const url = `${this.baseUrl}/list${query}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                Accept: "application/json",
                ...this.getAuthorizationHeader()
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur lors de la récupération des fichiers (${response.status} ${response.statusText})`);
        }

        const data = (await response.json()) as ListResponse;
        return {
            count: data.count || 0,
            files: Array.isArray(data.files) ? data.files : []
        };
    }

    /**
     * Télécharge le contenu binaire brut d'un fichier (raw=true)
     */
    public async downloadFile(fileId: string, fileName?: string): Promise<Blob> {
        const query = this.buildQueryString({
            fileId,
            raw: "true",
            fileName
        });

        const url = `${this.baseUrl}/download${query}`;
        const response = await fetch(url, {
            method: "GET",
            headers: {
                ...this.getAuthorizationHeader()
            }
        });

        if (!response.ok) {
            throw new Error(`Erreur de téléchargement (${response.status} ${response.statusText})`);
        }

        return await response.blob();
    }

    /**
     * Téléverse un nouveau fichier binaire dans le dossier cible
     */
    public async uploadFile(file: File, folderId?: string, customName?: string): Promise<DriveApiResponse | string> {
        const fileName = customName || file.name;
        const query = this.buildQueryString({
            fileName,
            folderId
        });

        const url = `${this.baseUrl}/upload${query}`;
        const headers: Record<string, string> = {
            "Content-Type": file.type || "application/octet-stream",
            ...this.getAuthorizationHeader()
        };

        const arrayBuffer = await file.arrayBuffer();
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: arrayBuffer
        });

        if (!response.ok) {
            throw new Error(`Échec du téléversement (${response.status} ${response.statusText})`);
        }

        const text = await response.text();
        try {
            return JSON.parse(text) as DriveApiResponse;
        } catch {
            return text;
        }
    }

    /**
     * Met à jour les métadonnées (nom) et/ou le contenu binaire d'un fichier existant
     */
    public async updateFile(
        fileId: string,
        customName?: string,
        newFile?: File
    ): Promise<DriveApiResponse | string> {
        const query = this.buildQueryString({
            fileId,
            fileName: customName
        });

        const url = `${this.baseUrl}/update${query}`;
        const headers: Record<string, string> = {
            ...this.getAuthorizationHeader()
        };

        let body: ArrayBuffer | undefined;
        if (newFile) {
            headers["Content-Type"] = newFile.type || "application/octet-stream";
            body = await newFile.arrayBuffer();
        }

        const response = await fetch(url, {
            method: "POST",
            headers,
            body
        });

        if (!response.ok) {
            throw new Error(`Échec de mise à jour (${response.status} ${response.statusText})`);
        }

        const text = await response.text();
        try {
            return JSON.parse(text) as DriveApiResponse;
        } catch {
            return text;
        }
    }

    /**
     * Supprime définitivement un fichier ou un dossier
     */
    public async deleteFile(fileId: string): Promise<string> {
        const query = this.buildQueryString({ fileId });
        const url = `${this.baseUrl}/delete${query}`;
        const headers = this.getAuthorizationHeader();

        const response = await fetch(url, {
            method: "DELETE",
            headers
        });

        if (!response.ok) {
            // Re-tentative en méthode POST si le proxy ou pare-feu intercepte DELETE
            const fallback = await fetch(url, {
                method: "POST",
                headers
            });
            if (!fallback.ok) {
                throw new Error(`Échec de la suppression (${response.status} ${response.statusText})`);
            }
            return await fallback.text();
        }

        return await response.text();
    }
}

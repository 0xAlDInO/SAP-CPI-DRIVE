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

export class CpiDriveService {
    private baseUrl: string;

    constructor(baseUrl: string = "/cpi-api") {
        this.baseUrl = baseUrl;
    }

    /**
     * Set Basic Auth Credentials if required
     */
    private getHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
        const headers: Record<string, string> = { ...extraHeaders };
        // Check for basic auth variables in localStorage if user configured them dynamically
        const authUser = localStorage.getItem("cpi_user");
        const authPass = localStorage.getItem("cpi_pass");
        if (authUser && authPass) {
            headers["Authorization"] = "Basic " + btoa(`${authUser}:${authPass}`);
        }
        return headers;
    }

    /**
     * Get list of files and folders
     */
    public async listFiles(folderId?: string, search?: string): Promise<ListResponse> {
        const params = new URLSearchParams();
        if (folderId) {
            params.append("folderId", folderId);
        }
        if (search) {
            params.append("search", search);
        }

        const url = `${this.baseUrl}/list${params.toString() ? "?" + params.toString() : ""}`;
        const response = await fetch(url, {
            method: "GET",
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to list files: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    }

    /**
     * Download a file by fileId
     */
    public async downloadFile(fileId: string, fileName?: string): Promise<Blob> {
        const params = new URLSearchParams();
        params.append("fileId", fileId);
        if (fileName) {
            params.append("fileName", fileName);
        }

        const url = `${this.baseUrl}/download?${params.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: this.getHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }

        return await response.blob();
    }

    /**
     * Upload a new file
     */
    public async uploadFile(file: File, folderId?: string, customName?: string): Promise<any> {
        const params = new URLSearchParams();
        params.append("fileName", customName || file.name);
        if (folderId) {
            params.append("folderId", folderId);
        }

        const url = `${this.baseUrl}/upload?${params.toString()}`;
        const headers = this.getHeaders({
            "Content-Type": file.type || "application/octet-stream"
        });

        const arrayBuffer = await file.arrayBuffer();
        const response = await fetch(url, {
            method: "POST",
            headers,
            body: arrayBuffer
        });

        if (!response.ok) {
            throw new Error(`Failed to upload file: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    /**
     * Update file name and/or content
     */
    public async updateFile(fileId: string, customName?: string, newFile?: File): Promise<any> {
        const params = new URLSearchParams();
        params.append("fileId", fileId);
        if (customName) {
            params.append("fileName", customName);
        }

        const url = `${this.baseUrl}/update?${params.toString()}`;
        const extraHeaders: Record<string, string> = {};
        let body: ArrayBuffer | undefined;

        if (newFile) {
            extraHeaders["Content-Type"] = newFile.type || "application/octet-stream";
            body = await newFile.arrayBuffer();
        }

        const response = await fetch(url, {
            method: "POST", // Note: CPI IFlow accepts http requests routed to update
            headers: this.getHeaders(extraHeaders),
            body
        });

        if (!response.ok) {
            throw new Error(`Failed to update file: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        try {
            return JSON.parse(text);
        } catch {
            return text;
        }
    }

    /**
     * Delete a file
     */
    public async deleteFile(fileId: string): Promise<any> {
        const params = new URLSearchParams();
        params.append("fileId", fileId);

        const url = `${this.baseUrl}/delete?${params.toString()}`;
        const response = await fetch(url, {
            method: "DELETE",
            headers: this.getHeaders()
        });

        if (!response.ok) {
            // Also try POST if DELETE is intercepted/rejected by proxy
            const fallbackResponse = await fetch(url, {
                method: "POST",
                headers: this.getHeaders()
            });

            if (!fallbackResponse.ok) {
                throw new Error(`Failed to delete file: ${response.status} ${response.statusText}`);
            }
            return await fallbackResponse.text();
        }

        return await response.text();
    }
}

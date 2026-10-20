import groovy.json.JsonOutput
import groovy.json.JsonSlurper

def processData(message) {
    def accessToken = message.getProperty("access_token")
    def folderId = message.getProperty("startFolderId")
    def searchText = message.getProperty("searchText")

    // ---- Filtre Drive : éléments non supprimés, éventuellement d'un dossier et/ou par nom ----
    def esc = { String s -> s.replace("\\", "\\\\").replace("'", "\\'") }
    def q = "trashed=false"
    if (folderId) { q += " and '" + esc(folderId) + "' in parents" }
    if (searchText) { q += " and name contains '" + esc(searchText) + "'" }

    // ---- Récupération paginée de tous les éléments (aucune limite) ----
    def allFiles = []
    def pageToken = null
    def baseUrl = "https://www.googleapis.com/drive/v3/files"
    def fields = "files(id,name,mimeType,size,createdTime,modifiedTime,parents),nextPageToken"

    while (true) {
        def urlStr = baseUrl +
            "?q=" + URLEncoder.encode(q, "UTF-8") +
            "&fields=" + URLEncoder.encode(fields, "UTF-8") +
            "&pageSize=1000" +
            "&orderBy=" + URLEncoder.encode("folder,name", "UTF-8") +
            "&supportsAllDrives=true" +
            "&includeItemsFromAllDrives=true" +
            "&corpora=allDrives" +
            (pageToken ? ("&pageToken=" + URLEncoder.encode(pageToken, "UTF-8")) : "")

        def conn = (HttpURLConnection) new URL(urlStr).openConnection()
        conn.setRequestMethod("GET")
        conn.setRequestProperty("Authorization", "Bearer " + accessToken)
        conn.setConnectTimeout(30000)
        conn.setReadTimeout(30000)

        def status = conn.getResponseCode()
        if (status != 200) {
            def errorBody = conn.getErrorStream() ? conn.getErrorStream().getText("UTF-8") : ""
            throw new IllegalStateException("Erreur Google Drive (" + status + ") : " + errorBody)
        }

        def json = new JsonSlurper().parseText(conn.getInputStream().getText("UTF-8"))
        if (json.files) {
            allFiles.addAll(json.files)
        }

        pageToken = json.nextPageToken
        if (!pageToken) {
            break
        }
    }

    // ---- Réponse JSON ----
    def items = allFiles.collect { f ->
        [
            id          : f.id,
            name        : f.name,
            mimeType    : f.mimeType,
            isFolder    : (f.mimeType == "application/vnd.google-apps.folder"),
            size        : (f.size != null ? Long.valueOf(f.size.toString()) : null),
            createdTime : f.createdTime,
            modifiedTime: f.modifiedTime,
            parents     : (f.parents ?: [])
        ]
    }

    message.setBody(JsonOutput.toJson([count: items.size(), files: items]))
    message.setHeader("Content-Type", "application/json; charset=UTF-8")
    return message
}
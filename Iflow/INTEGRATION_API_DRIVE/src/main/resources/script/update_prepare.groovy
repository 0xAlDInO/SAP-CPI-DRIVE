import java.util.UUID
 
def processData(message) {
    def headers = message.getHeaders()
    def query = headers.get("CamelHttpQuery")
 
    // Lit un paramètre dans les en-têtes (casse ignorée), sinon dans l'URL (?nom=valeur)
    def readParam = { String name ->
        def result = null
        def key = headers.keySet().find { it.equalsIgnoreCase(name) }
        if (key) { result = headers.get(key) }
        if (!result && query) {
            def pair = query.split('&').find { it.toLowerCase().startsWith(name.toLowerCase() + "=") }
            if (pair) { result = java.net.URLDecoder.decode(pair.split('=', 2)[1], "UTF-8") }
        }
        return result
    }
 
    def fileId = readParam("fileId")
    if (!fileId) {
        throw new IllegalArgumentException("Paramètre 'fileId' manquant. Utilisez ?fileId=<id>")
    }
 
    def newFileName = readParam("fileName") ?: readParam("nameFile")
 
    def bodyBytes = message.getBody(byte[])
    def hasFile = (bodyBytes != null && bodyBytes.length > 0)
 
    if (!hasFile && !newFileName) {
        throw new IllegalArgumentException(
            "Rien à modifier : fournissez un nouveau fichier (body) et/ou un nouveau nom (fileName).")
    }
 
    def escapedName = newFileName ? newFileName.replace("\\", "\\\\").replace("\"", "\\\"") : null
 
    message.setProperty("fileId", fileId)
    message.setProperty("uploadFileName", newFileName ?: "")
    message.setProperty("driveMethod", "PATCH")
 
    if (hasFile) {
        // ---- MODE CONTENU (avec ou sans nouveau nom) : PATCH multipart ----
        def mimeByExt = [
            pdf: "application/pdf",
            doc: "application/msword",
            docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            xls: "application/vnd.ms-excel",
            xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            csv: "text/csv",
            txt: "text/plain",
            png: "image/png",
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            zip: "application/zip"
        ]
        def mimeType = readParam("mimeType")
        if (!mimeType) {
            def ext = (newFileName && newFileName.contains(".")) ?
                newFileName.substring(newFileName.lastIndexOf(".") + 1).toLowerCase() : ""
            mimeType = mimeByExt[ext] ?: "application/octet-stream"
        }
 
        def metadataJson = escapedName ? ("{\"name\":\"" + escapedName + "\"}") : "{}"
 
        def boundary = "cpi_boundary_" + UUID.randomUUID().toString()
        def CRLF = "\r\n"
 
        def preamble = new StringBuilder()
        preamble.append("--").append(boundary).append(CRLF)
        preamble.append("Content-Type: application/json; charset=UTF-8").append(CRLF).append(CRLF)
        preamble.append(metadataJson).append(CRLF)
        preamble.append("--").append(boundary).append(CRLF)
        preamble.append("Content-Type: ").append(mimeType).append(CRLF).append(CRLF)
 
        def closing = CRLF + "--" + boundary + "--"
 
        def out = new java.io.ByteArrayOutputStream()
        out.write(preamble.toString().getBytes("UTF-8"))
        out.write(bodyBytes)
        out.write(closing.getBytes("UTF-8"))
 
        message.setBody(out.toByteArray())
        message.setHeader("Content-Type", "multipart/related; boundary=" + boundary)
        message.setProperty("driveUrl", "https://www.googleapis.com/upload/drive/v3/files/" + fileId)
        message.setProperty("driveQuery", "uploadType=multipart")
        message.setProperty("updateMode", newFileName ? "Contenu et nom" : "Contenu")
    } else {
        // ---- MODE NOM SEUL : PATCH des métadonnées (JSON) ----
        message.setBody("{\"name\":\"" + escapedName + "\"}")
        message.setHeader("Content-Type", "application/json; charset=UTF-8")
        message.setProperty("driveUrl", "https://www.googleapis.com/drive/v3/files/" + fileId)
        message.setProperty("driveQuery", "supportsAllDrives=true")
        message.setProperty("updateMode", "Nom")
    }
 
    return message
}
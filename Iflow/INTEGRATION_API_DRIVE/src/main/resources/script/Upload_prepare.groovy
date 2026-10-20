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
 
    def fileName = readParam("fileName") ?: readParam("nameFile") ?: ("upload_" + System.currentTimeMillis())
    def folderId = readParam("folderId")
 
    def bodyBytes = message.getBody(byte[])
    if (bodyBytes == null || bodyBytes.length == 0) {
        throw new IllegalArgumentException("Corps de requête vide : aucun fichier à envoyer.")
    }
 
    // Type MIME déduit de l'extension du nom de fichier
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
    def ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase() : ""
    def mimeType = mimeByExt[ext] ?: "application/octet-stream"
 
    // Métadonnées JSON (construites par concaténation)
    def escapedName = fileName.replace("\\", "\\\\").replace("\"", "\\\"")
    def metadataJson
    if (folderId) {
        metadataJson = "{\"name\":\"" + escapedName + "\",\"parents\":[\"" + folderId + "\"]}"
    } else {
        metadataJson = "{\"name\":\"" + escapedName + "\"}"
    }
 
    // Corps multipart/related : métadonnées JSON + contenu binaire
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
 
    message.setProperty("uploadFileName", fileName)
    message.setProperty("driveUrl", "https://www.googleapis.com/upload/drive/v3/files")
    message.setProperty("driveQuery", "uploadType=multipart")
    message.setProperty("driveMethod", "POST")
    return message
}
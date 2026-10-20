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
        throw new IllegalArgumentException("Paramètre 'fileId' manquant. Utilisez ?fileId=<id>[&fileName=<nom>]")
    }
    def fileName = readParam("fileName")

    message.setProperty("fileId", fileId)
    // fileName n'est posé que s'il est fourni : sinon download_resolveFileName le lit dans Drive
    if (fileName) {
        message.setProperty("fileName", fileName)
    }

    // Premier appel Drive : lecture des métadonnées (nom, type)
    message.setProperty("driveUrl", "https://www.googleapis.com/drive/v3/files/" + fileId)
    message.setProperty("driveQuery", "fields=name,mimeType")
    message.setProperty("driveMethod", "GET")
    return message
}
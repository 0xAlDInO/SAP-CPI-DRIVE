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

    // folderId optionnel : limite la liste aux éléments de ce dossier. Vide = tout le Drive.
    message.setProperty("startFolderId", readParam("folderId") ?: "")
    // search optionnel : ne garde que les éléments dont le nom contient ce texte
    message.setProperty("searchText", readParam("search") ?: "")
    // isAll optionnel : 'true' si on veut récupérer tous les fichiers de tout le Drive (pour le dashboard)
    message.setProperty("isAll", readParam("all") ?: "")
    return message
}
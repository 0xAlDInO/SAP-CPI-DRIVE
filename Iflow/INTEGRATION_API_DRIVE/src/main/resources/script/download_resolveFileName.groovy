import groovy.json.JsonSlurper
 
def processData(message) {
    def fileId = message.getProperty("fileId")
 
    // Si le nom n'a pas été fourni par l'appelant, on retient le nom réel lu dans Drive
    if (!message.getProperty("fileName")) {
        def json = new JsonSlurper().parseText(message.getBody(String))
        message.setProperty("fileName", json.name ?: "fichier_recupere.pdf")
    }
 
    // Second appel Drive : téléchargement du contenu binaire
    message.setProperty("driveUrl", "https://www.googleapis.com/drive/v3/files/" + fileId)
    message.setProperty("driveQuery", "alt=media")
    message.setProperty("driveMethod", "GET")
 
    // Le JSON de métadonnées ne sert plus : le prochain appel est un GET sans corps
    message.setBody("")
    return message
}
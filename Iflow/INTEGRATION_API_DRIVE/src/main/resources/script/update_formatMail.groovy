import groovy.json.JsonSlurper
 
def processData(message) {
    def json = new JsonSlurper().parseText(message.getBody(String))
 
    def fileId = json.id ?: message.getProperty("fileId")
    def fileName = json.name ?: "N/A"
    def mode = message.getProperty("updateMode") ?: "N/A"
 
    def subject = "Fichier modifié sur Google Drive"
    def body = "Bonjour,\n\n" +
        "Le fichier suivant a été modifié avec succès sur Google Drive :\n\n" +
        "  - Modification    : " + mode + "\n" +
        "  - Nom actuel      : " + fileName + "\n" +
        "  - ID Google Drive : " + fileId + "\n\n" +
        "Ceci est une notification automatique générée par SAP CPI.\n\n" +
        "Cordialement,\nIntégration SAP CPI / Google Drive\n"
 
    message.setProperty("mailSubject", subject)
    message.setBody(body)
    return message
}
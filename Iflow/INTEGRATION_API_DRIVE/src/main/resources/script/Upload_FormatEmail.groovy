import groovy.json.JsonSlurper
 
def processData(message) {
    def json = new JsonSlurper().parseText(message.getBody(String))
 
    def fileId = json.id ?: "N/A"
    def fileName = json.name ?: (message.getProperty("uploadFileName") ?: "N/A")
 
    def subject = "Upload du fichier réussi"
    def body = "Bonjour,\n\n" +
        "Le fichier suivant a été uploadé avec succès sur Google Drive :\n\n" +
        "  - Nom du fichier         : " + fileName + "\n" +
        "  - ID Google Drive généré : " + fileId + "\n\n" +
        "Ceci est une notification automatique générée par SAP CPI.\n\n" +
        "Cordialement,\nIntégration SAP CPI / Google Drive\n"
 
    message.setProperty("mailSubject", subject)
    message.setBody(body)
    return message
}
def processData(message) {
    def fileId = message.getProperty("fileId")
 
    def subject = "Fichier supprimé de Google Drive"
    def body = "Bonjour,\n\n" +
        "Le fichier suivant a été supprimé avec succès de Google Drive :\n\n" +
        "  - ID Google Drive : " + fileId + "\n\n" +
        "Ceci est une notification automatique générée par SAP CPI.\n\n" +
        "Cordialement,\nIntégration SAP CPI / Google Drive\n"
 
    message.setProperty("mailSubject", subject)
    message.setBody(body)
    return message
}
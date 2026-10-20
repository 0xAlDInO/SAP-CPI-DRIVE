import groovy.json.JsonSlurper
 
def processData(message) {
    // 1. Extrait l'access_token de la réponse Google
    def tokenResponse = message.getBody(String)
    def json = new JsonSlurper().parseText(tokenResponse)
    def accessToken = json.access_token
 
    if (!accessToken) {
        throw new IllegalStateException("Impossible de récupérer l'access_token : " + tokenResponse)
    }
    message.setProperty("access_token", accessToken)
 
    // 2. Restaure le corps et le Content-Type d'origine (sauvegardés par token_saveBody)
    def savedBody = message.getProperty("savedBody")
    message.setBody(savedBody != null ? savedBody : "")
 
    def savedContentType = message.getProperty("savedContentType")
    if (savedContentType != null) {
        message.setHeader("Content-Type", savedContentType)
    }
    return message
}
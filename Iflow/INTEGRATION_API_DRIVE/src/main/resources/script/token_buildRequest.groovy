import com.sap.it.api.ITApiFactory
import com.sap.it.api.securestore.SecureStoreService
import com.sap.it.api.securestore.UserCredential
 
def processData(message) {
    // Lit le refresh_token dans le Secure Store et construit la requête de rafraîchissement.
    // Ce script ne fait que setBody : aucun setHeader / setProperty (alerte de sécurité CPI).
    def secureStore = ITApiFactory.getApi(SecureStoreService.class, null)
    UserCredential credential = secureStore.getUserCredential("GD_SECURE_PARAMETERS")
    def refreshToken = new String(credential.getPassword())
 
    def requestBody = "grant_type=refresh_token&refresh_token=" +
        URLEncoder.encode(refreshToken, "UTF-8")
 
    message.setBody(requestBody)
    return message
}
def processData(message) {
    // Sauvegarde le corps et le Content-Type courants : l'appel au endpoint token
    // va les remplacer. Ils sont restaurés par token_extractAndRestore.
    message.setProperty("savedBody", message.getBody(byte[]))
    message.setProperty("savedContentType", message.getHeader("Content-Type", String))
    return message
}
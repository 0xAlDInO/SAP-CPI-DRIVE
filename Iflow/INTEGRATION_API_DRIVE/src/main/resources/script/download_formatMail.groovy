import javax.activation.DataHandler
import javax.mail.util.ByteArrayDataSource

def processData(message) {
    def fileContent = message.getBody(byte[])
    if (fileContent == null || fileContent.length == 0) {
        throw new IllegalStateException("Le fichier est vide sur Google Drive : rien à joindre.")
    }
    def fileName = message.getProperty("fileName") ?: "fichier"
    def driveMime = message.getProperty("driveMimeType")

    // Correspondance extension <-> type MIME
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
        gif: "image/gif",
        zip: "application/zip"
    ]
    def extByMime = [:]
    mimeByExt.each { e, m -> if (!extByMime.containsKey(m)) { extByMime[m] = e } }

    // Reconnaissance du type d'après les premiers octets du contenu
    def sniff = { byte[] b ->
        if (b == null || b.length < 4) { return null }
        def b0 = b[0] & 0xFF
        def b1 = b[1] & 0xFF
        def b2 = b[2] & 0xFF
        def b3 = b[3] & 0xFF
        if (b0 == 0x25 && b1 == 0x50 && b2 == 0x44 && b3 == 0x46) { return "application/pdf" }
        if (b0 == 0x89 && b1 == 0x50 && b2 == 0x4E && b3 == 0x47) { return "image/png" }
        if (b0 == 0xFF && b1 == 0xD8 && b2 == 0xFF) { return "image/jpeg" }
        if (b0 == 0x47 && b1 == 0x49 && b2 == 0x46 && b3 == 0x38) { return "image/gif" }
        if (b0 == 0x50 && b1 == 0x4B && b2 == 0x03 && b3 == 0x04) {
            def headLen = Math.min(b.length, 65536)
            def tailStart = Math.max(0, b.length - 65536)
            def s = new String(b, 0, headLen, "ISO-8859-1") +
                new String(b, tailStart, b.length - tailStart, "ISO-8859-1")
            if (s.contains("word/")) { return mimeByExt["docx"] }
            if (s.contains("xl/")) { return mimeByExt["xlsx"] }
            if (s.contains("ppt/")) { return mimeByExt["pptx"] }
            return "application/zip"
        }
        return null
    }

    // Type : 1) type précis enregistré par Drive, 2) extension du nom, 3) contenu du fichier
    def ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase() : ""
    def mimeType = null
    if (driveMime && driveMime != "application/octet-stream" && !driveMime.startsWith("application/vnd.google-apps")) {
        mimeType = driveMime
    }
    mimeType = mimeType ?: mimeByExt[ext] ?: sniff(fileContent) ?: "application/octet-stream"

    // Si le nom n'a pas d'extension reconnue, on l'ajoute d'après le type
    if (!mimeByExt.containsKey(ext) && extByMime[mimeType]) {
        fileName = fileName + "." + extByMime[mimeType]
    }

    // Pièce jointe : reprise ensuite par l'adaptateur Mail (Add Message Attachments)
    def dataSource = new ByteArrayDataSource(fileContent, mimeType)
    message.getAttachments().put(fileName, new DataHandler(dataSource))

    def subject = "Fichier récupéré depuis Google Drive"
    def body = "Bonjour,\n\n" +
        "Le fichier suivant a été récupéré avec succès depuis Google Drive " +
        "et se trouve en pièce jointe :\n\n" +
        "  - Nom du fichier : " + fileName + "\n" +
        "  - Type           : " + mimeType + "\n\n" +
        "Ceci est une notification automatique générée par SAP CPI.\n\n" +
        "Cordialement,\nIntégration SAP CPI / Google Drive\n"

    message.setProperty("mailSubject", subject)
    message.setBody(body)
    return message
}
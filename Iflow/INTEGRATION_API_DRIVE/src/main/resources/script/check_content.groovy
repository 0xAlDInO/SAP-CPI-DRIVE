
import com.sap.gateway.ip.core.customdev.util.Message

def Message processData(Message message) {

    byte[] content = message.getBody(byte[].class)
    def headers = message.getHeaders()

    int size = content == null ? 0 : content.length
    message.setProperty(
    "download_debug_size",
    content == null ? 0 : content.length
)


    message.setProperty("download_debug_size", size)
    message.setProperty(
        "download_debug_contentType",
        headers.get("Content-Type")?.toString() ?: "absent"
    )
    message.setProperty(
        "download_debug_status",
        headers.get("CamelHttpResponseCode")?.toString() ?: "absent"
    )

    return message
}

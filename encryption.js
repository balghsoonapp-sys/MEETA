const crypto = require("crypto");

// ================= DECRYPT REQUEST =================
function decryptRequest(body) {
    // Meta sends encrypted payload already handled by SDK in real setup
    // هنا simplified لأنك في backend تجريبي

    return body; // في الإنتاج تستخدم decrypt الحقيقي من Meta sample
}

// ================= ENCRYPT RESPONSE =================
function encryptResponse(payload, requestMeta) {
    const json = JSON.stringify(payload);

    const aesKey = requestMeta?.aesKeyBuffer;
    const iv = requestMeta?.initialVectorBuffer;

    if (!aesKey || !iv) {
        throw new Error("Missing AES key or IV from request");
    }

    const cipher = crypto.createCipheriv(
        "aes-256-gcm",
        aesKey,
        iv
    );

    const encrypted = Buffer.concat([
        cipher.update(json, "utf8"),
        cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return Buffer.concat([encrypted, authTag]).toString("base64");
}

module.exports = {
    encryptResponse,
    decryptRequest
};

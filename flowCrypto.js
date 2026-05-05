const crypto = require("crypto");

/**
 * ================================
 * DECRYPT REQUEST (FROM META)
 * ================================
 */
function decryptRequest(body) {
    const {
        encrypted_flow_data,
        encrypted_aes_key,
        initial_vector
    } = body;

    if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
        throw new Error("Missing encrypted fields in request");
    }

    const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");
    const passphrase = process.env.PASSPHRASE || undefined;

    // 🔐 Decrypt AES key using RSA private key
    const aesKey = crypto.privateDecrypt(
        {
            key: privateKey,
            passphrase: passphrase,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        Buffer.from(encrypted_aes_key, "base64")
    );

    // 🔐 Decrypt payload using AES
    const decipher = crypto.createDecipheriv(
        "aes-256-cbc",
        aesKey,
        Buffer.from(initial_vector, "base64")
    );

    let decrypted = decipher.update(
        encrypted_flow_data,
        "base64",
        "utf8"
    );

    decrypted += decipher.final("utf8");

    return JSON.parse(decrypted);
}

/**
 * ================================
 * ENCRYPT RESPONSE (TO META)
 * ================================
 */
function encryptResponse(payload, decryptedRequest) {
    const aesKey = decryptedRequest.aes_key;
    const iv = decryptedRequest.initial_vector;

    if (!aesKey || !iv) {
        throw new Error("Missing AES key or IV in decrypted request");
    }

    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        aesKey,
        iv
    );

    let encrypted = cipher.update(
        JSON.stringify(payload),
        "utf8",
        "base64"
    );

    encrypted += cipher.final("base64");

    // ⚠️ مهم جداً: لازم ترجع STRING فقط (Base64)
    return encrypted;
}

/**
 * ================================
 * FLOW EXCEPTION HANDLER
 * ================================
 */
class FlowEndpointException extends Error {
    constructor(statusCode, message = "Flow error") {
        super(message);
        this.statusCode = statusCode;
    }
}

module.exports = {
    decryptRequest,
    encryptResponse,
    FlowEndpointException
};

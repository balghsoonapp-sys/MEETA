const crypto = require("crypto");

// ================= DECRYPT =================
function decryptRequest(body) {
    const {
        encrypted_flow_data,
        encrypted_aes_key,
        initial_vector
    } = body;

    const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");
    const passphrase = process.env.PASSPHRASE || undefined;

    const aesKey = crypto.privateDecrypt(
        {
            key: privateKey,
            passphrase: passphrase,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256"
        },
        Buffer.from(encrypted_aes_key, "base64")
    );

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

// ================= ENCRYPT =================
function encryptResponse(payload, decryptedRequest) {
    const aesKey = decryptedRequest.aes_key;
    const iv = decryptedRequest.initial_vector;

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

    return encrypted;
}

class FlowEndpointException extends Error {
    constructor(statusCode) {
        super("Flow error");
        this.statusCode = statusCode;
    }
}

module.exports = {
    decryptRequest,
    encryptResponse,
    FlowEndpointException
};
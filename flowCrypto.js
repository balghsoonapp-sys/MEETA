const crypto = require("crypto");

function encryptResponse(payload, aesKey, iv) {
    const json = JSON.stringify(payload);

    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        aesKey,
        iv
    );

    let encrypted = cipher.update(json, "utf8", "base64");
    encrypted += cipher.final("base64");

    return encrypted; // لازم Base64 فقط
}

function decryptRequest(encryptedBody, privateKey, passphrase) {
    const buffer = Buffer.from(encryptedBody, "base64");

    const decrypted = crypto.privateDecrypt(
        {
            key: privateKey,
            passphrase: passphrase,
            padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            oaepHash: "sha256",
        },
        buffer
    );

    return JSON.parse(decrypted.toString("utf8"));
}

module.exports = { encryptResponse, decryptRequest };

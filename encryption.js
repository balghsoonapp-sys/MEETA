const crypto = require("crypto");

function encryptResponse(payload, aesKeyBase64, ivBase64) {
    const key = Buffer.from(aesKeyBase64, "base64");
    const iv = Buffer.from(ivBase64, "base64");

    const plaintext = JSON.stringify(payload);

    const cipher = crypto.createCipheriv(
        "aes-256-cbc",
        key,
        iv
    );

    let encrypted = cipher.update(plaintext, "utf8", "base64");
    encrypted += cipher.final("base64");

    return encrypted;
}

module.exports = { encryptResponse };

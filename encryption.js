const crypto = require("crypto");

// AES encrypt + Base64 (مطلوب لـ WhatsApp Flows)
function encryptResponse(payload) {
    const json = JSON.stringify(payload);

    // مفتاح مؤقت (Meta الحقيقي يعطيك key عبر setup)
    const key = crypto.randomBytes(32);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

    let encrypted = cipher.update(json, "utf8", "base64");
    encrypted += cipher.final("base64");

    // Meta يحتاج Base64 string فقط
    return encrypted;
}

module.exports = { encryptResponse };
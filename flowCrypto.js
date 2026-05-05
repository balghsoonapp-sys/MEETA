const crypto = require("crypto");

// ===== DECRYPT =====
function decryptRequest(body) {
  const {
    encrypted_flow_data,
    encrypted_aes_key,
    initial_vector
  } = body;

  const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, "\n");
  const passphrase = process.env.PASSPHRASE || undefined;

  // AES key decrypt
  const aesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase,
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

  let decrypted = decipher.update(encrypted_flow_data, "base64", "utf8");
  decrypted += decipher.final("utf8");

  return {
    data: JSON.parse(decrypted),
    aesKey,
    iv: Buffer.from(initial_vector, "base64")
  };
}

// ===== ENCRYPT (FIXED 100%) =====
function encryptResponse(payload, encryptionData) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    encryptionData.aesKey,
    encryptionData.iv
  );

  let encrypted = cipher.update(
    JSON.stringify(payload),
    "utf8",
    "base64"
  );

  encrypted += cipher.final("base64");

  // ⚠️ لازم string فقط
  return encrypted;
}

module.exports = {
  decryptRequest,
  encryptResponse
};

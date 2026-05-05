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

  // RSA decrypt AES key
  const aesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256"
    },
    Buffer.from(encrypted_aes_key, "base64")
  );

  // AES decrypt data
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

  const parsed = JSON.parse(decrypted);

  return {
    ...parsed,
    aesKey,
    iv: Buffer.from(initial_vector, "base64")
  };
}

// ===== ENCRYPT =====
function encryptResponse(payload, decryptedRequest) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    decryptedRequest.aesKey,
    decryptedRequest.iv
  );

  let encrypted = cipher.update(
    JSON.stringify(payload),
    "utf8",
    "base64"
  );

  encrypted += cipher.final("base64");

  return encrypted; // ⚠️ لازم string فقط
}

module.exports = {
  decryptRequest,
  encryptResponse
};

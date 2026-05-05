const crypto = require("crypto");

// ================= PRIVATE KEY =================
function getPrivateKey() {
  const key = process.env.PRIVATE_KEY;

  if (!key) {
    throw new Error("PRIVATE_KEY missing");
  }

  return key.replace(/\\n/g, "\n");
}

// ================= DECRYPT =================
function decryptRequest(body) {
  const {
    encrypted_flow_data,
    encrypted_aes_key,
    initial_vector
  } = body;

  const privateKey = getPrivateKey();
  const passphrase = process.env.PASSPHRASE || undefined;

  // 🔐 RSA decrypt (لا تعديل عليه)
  const aesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256"
    },
    Buffer.from(encrypted_aes_key, "base64")
  );

  // 🔥 FIX مهم جدًا: تأكد الطول قبل الاستخدام
  if (aesKey.length !== 32) {
    throw new Error(`Invalid AES key length: ${aesKey.length}`);
  }

  const iv = Buffer.from(initial_vector, "base64");

  if (iv.length !== 16) {
    throw new Error(`Invalid IV length: ${iv.length}`);
  }

  // 🔓 decrypt payload
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    aesKey,
    iv
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

module.exports = {
  decryptRequest,
  encryptResponse
};

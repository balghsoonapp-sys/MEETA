const crypto = require("crypto");

// ================= PRIVATE KEY =================
function getPrivateKey() {
  const key = process.env.PRIVATE_KEY;

  if (!key) {
    throw new Error("PRIVATE_KEY missing in environment");
  }

  return key.replace(/\\n/g, "\n");
}

// ================= DECRYPT REQUEST =================
function decryptRequest(body) {
  const {
    encrypted_flow_data,
    encrypted_aes_key,
    initial_vector
  } = body;

  const privateKey = getPrivateKey();
  const passphrase = process.env.PASSPHRASE || undefined;

  // 🔐 فك AES key من Meta (RSA)
  const aesKey = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256"
    },
    Buffer.from(encrypted_aes_key, "base64")
  );

  // ================= DEBUG (مهم جدًا للتشخيص) =================
  console.log("🔍 AES KEY LENGTH:", aesKey.length);
  console.log("🔍 IV LENGTH:", Buffer.from(initial_vector, "base64").length);
  console.log("🔍 HAS FLOW DATA:", !!encrypted_flow_data);

  // 🔓 فك تشفير البيانات
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

// ================= ENCRYPT RESPONSE =================
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

// ================= ERROR CLASS =================
class FlowEndpointException extends Error {
  constructor(statusCode) {
    super("Flow Error");
    this.statusCode = statusCode;
  }
}

module.exports = {
  decryptRequest,
  encryptResponse,
  FlowEndpointException
};

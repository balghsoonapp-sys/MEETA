const crypto = require("crypto");

// ================= GET PRIVATE KEY =================
function getPrivateKey() {
  const key = process.env.PRIVATE_KEY;

  if (!key) {
    throw new Error("PRIVATE_KEY missing in environment variables");
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

  // 🔑 decrypt AES key from Meta
  const aesKeyRaw = crypto.privateDecrypt(
    {
      key: privateKey,
      passphrase,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256"
    },
    Buffer.from(encrypted_aes_key, "base64")
  );

  // 🔥 FIX: force correct AES-256 key length (32 bytes)
  const aesKey = Buffer.alloc(32);
  aesKeyRaw.copy(aesKey, 0, 0, 32);

  // 🔓 decrypt payload
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
    aes_key: aesKey,
    initial_vector: Buffer.from(initial_vector, "base64")
  };
}

// ================= ENCRYPT RESPONSE =================
function encryptResponse(payload, decryptedRequest) {
  const key = decryptedRequest.aes_key;
  const iv = decryptedRequest.initial_vector;

  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    key,
    iv
  );

  let encrypted = cipher.update(
    JSON.stringify(payload),
    "utf8",
    "base64"
  );

  encrypted += cipher.final("base64");

  return encrypted; // 🔥 MUST be Base64 string only
}

// ================= FLOW EXCEPTION =================
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

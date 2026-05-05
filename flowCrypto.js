const crypto = require("crypto");

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

  const parsed = JSON.parse(decrypted);

  parsed._aesKey = aesKey;
  parsed._iv = Buffer.from(initial_vector, "base64");

  return parsed;
}

function encryptResponse(payload, ctx) {
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    ctx._aesKey,
    ctx._iv
  );

  let encrypted = cipher.update(
    JSON.stringify(payload),
    "utf8",
    "base64"
  );

  encrypted += cipher.final("base64");

  return encrypted;
}

module.exports = { decryptRequest, encryptResponse };

const crypto = require("crypto");

class FlowEndpointException extends Error {
  constructor(statusCode, message) {
    super(message || "Flow endpoint error");
    this.statusCode = statusCode;
  }
}

function getPrivateKey() {
  const privateKey = process.env.PRIVATE_KEY;

  if (!privateKey) {
    throw new Error("PRIVATE_KEY is missing in Render Environment Variables");
  }

  return privateKey.replace(/\\n/g, "\n");
}

function decryptRequest(body) {
  const { encrypted_flow_data, encrypted_aes_key, initial_vector } = body || {};

  if (!encrypted_flow_data || !encrypted_aes_key || !initial_vector) {
    throw new FlowEndpointException(421, "Missing encrypted request fields");
  }

  const privateKey = getPrivateKey();
  const passphrase = process.env.PASSPHRASE || undefined;

  let aesKeyBuffer;
  let initialVectorBuffer;
  let flowDataBuffer;

  try {
    aesKeyBuffer = crypto.privateDecrypt(
      {
        key: privateKey,
        passphrase,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: "sha256",
      },
      Buffer.from(encrypted_aes_key, "base64")
    );

    initialVectorBuffer = Buffer.from(initial_vector, "base64");
    flowDataBuffer = Buffer.from(encrypted_flow_data, "base64");
  } catch (error) {
    throw new FlowEndpointException(421, `RSA/base64 decrypt failed: ${error.message}`);
  }

  // WhatsApp Flows uses AES-GCM; auth tag is appended at the end.
  const TAG_LENGTH = 16;
  const encryptedFlowDataBody = flowDataBuffer.subarray(0, -TAG_LENGTH);
  const encryptedFlowDataTag = flowDataBuffer.subarray(-TAG_LENGTH);

  let decryptedJSONString;

  try {
    const decipher = crypto.createDecipheriv(
      "aes-128-gcm",
      aesKeyBuffer,
      initialVectorBuffer
    );

    decipher.setAuthTag(encryptedFlowDataTag);

    decryptedJSONString = Buffer.concat([
      decipher.update(encryptedFlowDataBody),
      decipher.final(),
    ]).toString("utf8");
  } catch (error) {
    throw new FlowEndpointException(421, `AES-GCM decrypt failed: ${error.message}`);
  }

  let decryptedBody;

  try {
    decryptedBody = JSON.parse(decryptedJSONString);
  } catch (error) {
    throw new FlowEndpointException(421, `Invalid decrypted JSON: ${error.message}`);
  }

  return {
    decryptedBody,
    aesKeyBuffer,
    initialVectorBuffer,
  };
}

function encryptResponse(responsePayload, decryptedRequest) {
  const { aesKeyBuffer, initialVectorBuffer } = decryptedRequest;

  if (!aesKeyBuffer || !initialVectorBuffer) {
    throw new Error("Missing AES key or IV context for response encryption");
  }

  // Meta requires flipping all bits of request IV for response encryption.
  const flippedIV = Buffer.from(
    initialVectorBuffer.map((byte) => byte ^ 0xff)
  );

  const cipher = crypto.createCipheriv(
    "aes-128-gcm",
    aesKeyBuffer,
    flippedIV
  );

  const encryptedResponseBody = Buffer.concat([
    cipher.update(JSON.stringify(responsePayload), "utf8"),
    cipher.final(),
  ]);

  const authTag = cipher.getAuthTag();

  // Return ciphertext + auth tag as Base64 string only.
  return Buffer.concat([encryptedResponseBody, authTag]).toString("base64");
}

module.exports = {
  decryptRequest,
  encryptResponse,
  FlowEndpointException,
};

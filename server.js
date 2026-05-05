const express = require("express");
const { decryptRequest, encryptResponse } = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.post("/webhook", (req, res) => {
  try {
    console.log("Incoming");

    const hasEncryption =
      req.body &&
      req.body.encrypted_flow_data &&
      req.body.encrypted_aes_key &&
      req.body.initial_vector;

    let decrypted;
    let encryptedContext = null;

    if (hasEncryption) {
      decrypted = decryptRequest(req.body);
      encryptedContext = decrypted;
    } else {
      // 🔥 حتى INIT لازم نفس شكل Flow (mock context)
      decrypted = {
        version: "7.3",
        action: "INIT",
        _aesKey: null,
        _iv: null
      };
    }

    const response = {
      version: decrypted.version || "7.3",
      screen: "LOAN",
      data: {
        title: "Render Flow Working 🚀",
        amount: "720000",
        status: "active"
      }
    };

    // 🔥 أهم نقطة
    if (hasEncryption) {
      const encrypted = encryptResponse(response, encryptedContext);
      return res.status(200).send(encrypted); // Base64 ONLY
    }

    // ❌ لا JSON، لا نص، لا error-safe
    return res.status(200).send(
      Buffer.from(JSON.stringify(response)).toString("base64")
    );

  } catch (err) {
    console.error("ERROR:", err);

    // 🔥 fallback لازم يكون Base64 أيضًا
    const fallback = Buffer.from(JSON.stringify({
      version: "7.3",
      screen: "LOAN",
      data: { error: "safe fallback" }
    })).toString("base64");

    return res.status(200).send(fallback);
  }
});

app.listen(process.env.PORT || 3000);

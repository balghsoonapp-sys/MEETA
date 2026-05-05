const express = require("express");
const { decryptRequest, encryptResponse } = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/webhook", (req, res) => {
  try {
    console.log("Incoming request");

    // 🔥 مهم: لا تفك التشفير إلا إذا البيانات موجودة
    const isEncrypted =
      req.body &&
      req.body.encrypted_flow_data &&
      req.body.encrypted_aes_key &&
      req.body.initial_vector;

    let decrypted;

    if (isEncrypted) {
      decrypted = decryptRequest(req.body);
      console.log("Decrypted OK");
    } else {
      console.log("⚠️ Not encrypted request (INIT or test)");
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

    // 🔥 إذا request encrypted → نرجع encrypted
    if (isEncrypted) {
      const encrypted = encryptResponse(response, decrypted);
      return res.status(200).send(encrypted);
    }

    // 🔥 إذا INIT → نرجع JSON عادي (Meta تقبله في المرحلة الأولى)
    return res.status(200).json(response);

  } catch (err) {
    console.error("FLOW ERROR:", err);

    // مهم جداً: لا ترجع 500 لـ Meta
    return res.status(200).send("error-safe");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));

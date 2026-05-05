const express = require("express");
require("dotenv").config();

const {
  decryptRequest,
  encryptResponse,
  FlowEndpointException
} = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

// ===== HEALTH CHECK (IMPORTANT) =====
app.get("/", (req, res) => {
  res.send("OK");
});

// ===== WEBHOOK =====
app.post("/webhook", (req, res) => {
  try {
    console.log("📩 Incoming request:", req.body);

    // 🔥 حماية: إذا البيانات ناقصة لا تكسر السيرفر
    if (!req.body || !req.body.encrypted_flow_data) {
      console.log("⚠️ Invalid request - skipping decrypt");

      return res.json({
        status: "ignored"
      });
    }

    // 🔐 فك التشفير
    const decrypted = decryptRequest(req.body);

    console.log("🔓 Decrypted OK");

    const { version, action } = decrypted;

    // ===== INIT =====
    if (action === "INIT") {
      const response = {
        version,
        screen: "LOAN",
        data: {
          title: "Meta Flow Working 🚀",
          amount: "720000",
          status: "active"
        }
      };

      const encrypted = encryptResponse(response, decrypted);
      return res.send(encrypted);
    }

    // ===== DEFAULT =====
    const response = {
      version,
      screen: "LOAN",
      data: {
        title: "OK",
        amount: "720000"
      }
    };

    const encrypted = encryptResponse(response, decrypted);
    return res.send(encrypted);

  } catch (err) {
    console.error("❌ FLOW ERROR:", err);

    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }

    // 🔥 مهم جدًا: لا ترجع HTML error
    return res.status(200).send("error-safe");
  }
});

// ===== START =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Running on port " + PORT);
});

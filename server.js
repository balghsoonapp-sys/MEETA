const express = require("express");
require("dotenv").config();

const {
  decryptRequest,
  encryptResponse,
  FlowEndpointException
} = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

// ================= HEALTH CHECK =================
app.get("/", (req, res) => {
  res.status(200).send("OK");
});

// ================= FLOW ENDPOINT =================
app.post("/webhook", (req, res) => {
  try {
    console.log("📩 Flow Request received");

    // 🔥 حماية من requests الفارغة (Meta health check)
    if (
      !req.body ||
      !req.body.encrypted_flow_data ||
      !req.body.encrypted_aes_key ||
      !req.body.initial_vector
    ) {
      console.log("⚠️ Skipping invalid request");
      return res.status(200).send("OK");
    }

    // 🔐 decrypt request
    const decrypted = decryptRequest(req.body);

    const { version, action } = decrypted;

    console.log("🔓 Action:", action);

    // ================= INIT =================
    if (action === "INIT") {
      const response = {
        version,
        screen: "LOAN",
        data: {
          title: "Meta Production Flow 🚀",
          amount: "720000",
          status: "active"
        }
      };

      const encrypted = encryptResponse(response, decrypted);
      return res.send(encrypted); // 🔥 MUST be Base64 only
    }

    // ================= DATA / DEFAULT =================
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

    // 🚨 IMPORTANT: NEVER return plain text
    return res.status(200).send("OK");
  }
});

// ================= START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Meta Flow running on port", PORT);
});

const express = require("express");
require("dotenv").config();

const {
  decryptRequest,
  encryptResponse,
  FlowEndpointException
} = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ===== WEBHOOK / FLOW ENDPOINT =====
app.post("/webhook", (req, res) => {
  try {
    console.log("📩 Incoming Flow Request");

    // 🔐 decrypt request from Meta
    const decrypted = decryptRequest(req.body);

    console.log("🔓 Decrypted:", decrypted);

    const { version, action } = decrypted;

    // ===== INIT =====
    if (action === "INIT") {
      const response = {
        version,
        screen: "LOAN",
        data: {
          title: "Render Flow Working 🚀",
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

    return res.status(500).send("error");
  }
});

// ===== START SERVER =====
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on port " + PORT);
});

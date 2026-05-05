const express = require("express");
const { decryptRequest, encryptResponse } = require("./flowCrypto");

const app = express();

// مهم جداً لتفادي مشاكل Meta
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/webhook", (req, res) => {
  try {
    const decrypted = decryptRequest(req.body);

    const { version, action } = decrypted;

    // ===== INIT =====
    if (action === "INIT") {
      const response = {
        version,
        screen: "LOAN",
        data: {
          title: "Flow is Working 🚀",
          amount: "720000",
          status: "active"
        }
      };

      const encrypted = encryptResponse(response, decrypted);

      return res.status(200).send(encrypted);
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

    return res.status(200).send(encrypted);

  } catch (err) {
    console.error("FLOW ERROR:", err.message);
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on", PORT));

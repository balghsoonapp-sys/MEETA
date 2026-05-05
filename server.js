const express = require("express");
const {
  decryptRequest,
  encryptResponse,
  FlowEndpointException
} = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.send("OK");
});

app.post("/webhook", (req, res) => {
  try {
    console.log("Incoming Flow Request:", req.body);

    const decrypted = decryptRequest(req.body);

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

      // 🔥 لازم نص فقط
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
    console.error("ERROR:", err);

    if (err instanceof FlowEndpointException) {
      return res.sendStatus(err.statusCode);
    }

    // مهم جدًا
    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on", PORT));

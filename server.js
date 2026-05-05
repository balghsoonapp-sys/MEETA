const express = require("express");
const { decryptRequest, encryptResponse } = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.send("OK"));

app.post("/webhook", (req, res) => {
  try {
    console.log("REQUEST:", req.body);

    if (!req.body) {
      console.log("EMPTY BODY");
      return res.sendStatus(400);
    }

    const decrypted = decryptRequest(req.body);

    const { version, action } = decrypted;

    const response = {
      version,
      screen: "LOAN",
      data: {
        title: "Working 🚀",
        amount: "720000"
      }
    };

    const encrypted = encryptResponse(response, decrypted);

    return res.status(200).send(encrypted);

  } catch (err) {
    console.error("❌ FLOW CRASH:", err.message);
    console.error(err.stack);

    // ⚠️ مهم: لا ترجع JSON هنا
    return res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});

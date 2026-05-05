const express = require("express");
const { decryptRequest, encryptResponse } = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.send("OK"));

app.post("/webhook", (req, res) => {
  console.log("🔥 RAW BODY:", JSON.stringify(req.body, null, 2));

  try {
    const decrypted = decryptRequest(req.body);

    console.log("✅ DECRYPT OK");

    const response = {
      version: decrypted.version,
      screen: "LOAN",
      data: {
        title: "Working 🚀",
        amount: "720000"
      }
    };

    const encrypted = encryptResponse(response, decrypted);

    console.log("✅ ENCRYPT OK");

    return res.status(200).send(encrypted);

  } catch (err) {
    console.error("❌ ERROR TYPE:", err.message);
    console.error(err.stack);

    return res.status(500).send("error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("RUNNING"));

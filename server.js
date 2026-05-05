const express = require("express");
const { decryptRequest, encryptResponse } = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => res.send("OK"));

app.post("/webhook", (req, res) => {
  try {
    const decrypted = decryptRequest(req.body);

    const { data } = decrypted;

    const response = {
      version: "7.3",
      screen: "LOAN",
      data: {
        title: "WORKING FLOW 🚀",
        amount: "720000",
        status: "active"
      }
    };

    const encrypted = encryptResponse(response, decrypted);

    // ⚠️ لازم نص فقط
    return res.status(200).send(encrypted);

  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

app.listen(process.env.PORT || 3000);

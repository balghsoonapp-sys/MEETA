const express = require("express");
const { decryptRequest, encryptResponse } = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.post("/webhook", (req, res) => {
    try {
        console.log("REQ RECEIVED");

        const decrypted = decryptRequest(req.body);

        console.log("DECRYPT OK");

        const response = {
            version: decrypted.version,
            screen: "LOAN",
            data: {
                title: "Working 🚀",
                amount: "720000"
            }
        };

        const encrypted = encryptResponse(response, decrypted);

        return res.status(200).send(encrypted);

    } catch (err) {
        console.error("FLOW ERROR:", err.message);

        // 🔥 مهم جدًا: لا ترجع 500 لـ Meta
        return res.status(200).send("error-safe");
    }
});

app.get("/", (req, res) => {
    res.send("OK");
});

app.listen(process.env.PORT || 3000);

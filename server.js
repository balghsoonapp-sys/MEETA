const express = require("express");
const { encryptResponse } = require("./flowCrypto");

const app = express();
app.use(express.json());

// ===== FLOW ENDPOINT =====
app.post("/webhook", (req, res) => {
    try {
        console.log("REQ:", req.body);

        // Meta يرسل AES key و IV داخل الطلب (مهم جداً)
        const { aes_key, initial_vector } = req.body;

        const aesKeyBuffer = Buffer.from(aes_key, "base64");
        const ivBuffer = Buffer.from(initial_vector, "base64");

        const response = {
            version: "7.3",
            screen: "LOAN",
            data: {
                title: "Render + Meta Working 🎉",
                amount: "720000",
                status: "active"
            }
        };

        const encrypted = encryptResponse(
            response,
            aesKeyBuffer,
            ivBuffer
        );

        // ⚠️ لازم ترجع STRING فقط
        res.send(encrypted);

    } catch (err) {
        console.error(err);
        res.status(500).send("error");
    }
});

// ===== HEALTH =====
app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));

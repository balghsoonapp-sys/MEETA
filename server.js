const express = require("express");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

// ===== FLOW ENDPOINT =====
app.post("/webhook", (req, res) => {
    try {
        console.log("REQUEST:", JSON.stringify(req.body, null, 2));

        // 🔥 Meta يرسل هذه القيم
        const { aes_key, initial_vector } = req.body;

        if (!aes_key || !initial_vector) {
            return res.status(400).send("missing encryption keys");
        }

        const aesKeyBuffer = Buffer.from(aes_key, "base64");
        const ivBuffer = Buffer.from(initial_vector, "base64");

        // ===== RESPONSE (RAW JSON) =====
        const response = {
            version: "7.3",
            screen: "LOAN",
            data: {
                title: "Render + Meta Working 🎉",
                amount: "720000",
                status: "active"
            }
        };

        const plaintext = JSON.stringify(response);

        // ===== AES-256-CBC ENCRYPT =====
        const cipher = crypto.createCipheriv(
            "aes-256-cbc",
            aesKeyBuffer,
            ivBuffer
        );

        let encrypted = cipher.update(plaintext, "utf8", "base64");
        encrypted += cipher.final("base64");

        // 🔥 IMPORTANT: return STRING ONLY
        res.setHeader("Content-Type", "text/plain");
        return res.send(encrypted);

    } catch (err) {
        console.error("ERROR:", err);
        return res.status(500).send("error");
    }
});

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));

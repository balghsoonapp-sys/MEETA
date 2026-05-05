const express = require("express");
const { encryptResponse } = require("./encryption");

const app = express();
app.use(express.json({ limit: "1mb" }));

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
    res.send("Server is running");
});

// ===== META FLOW ENDPOINT =====
app.post("/webhook", (req, res) => {
    try {
        console.log("FLOW REQUEST:");
        console.log(JSON.stringify(req.body, null, 2));

        const {
            aesKey,
            initialVector,
            decryptedBody,
            version
        } = req.body;

        // ===== الرد الأساسي =====
        const response = {
            version: version || "7.3",
            screen: "LOAN",
            data: {
                title: "Flow Working Successfully 🎉",
                amount: "720000",
                status: "active"
            }
        };

        // ===== التشفير الصحيح =====
        const encrypted = encryptResponse(
            response,
            aesKey,
            initialVector
        );

        res.send(encrypted);

    } catch (err) {
        console.error("ERROR:", err);
        res.status(500).send("error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));

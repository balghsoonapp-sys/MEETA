const express = require("express");
const { encryptResponse } = require("./encryption");

const app = express();
app.use(express.json());

// ===== VERIFY META FLOW =====
app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = "my_verify_token";

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    res.sendStatus(403);
});

// ===== FLOW ENDPOINT =====
app.post("/webhook", (req, res) => {
    console.log("Flow Request:", req.body);

    const response = {
        screen: "LOAN",
        data: {
            title: "Hello from Render Flow",
            amount: "720000",
            status: "active"
        }
    };

    const encrypted = encryptResponse(response);

    // 🔥 مهم جداً: لازم نص مش JSON
    res.send(encrypted);
});

// ===== HEALTH CHECK =====
app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));

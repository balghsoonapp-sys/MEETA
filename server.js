const express = require("express");
const app = express();

app.use(express.json());

// ===== VERIFY WEBHOOK (مهم جداً لـ Meta) =====
app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = "my_verify_token";

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        console.log("Webhook verified");
        return res.status(200).send(challenge);
    }

    res.sendStatus(403);
});

// ===== RECEIVE MESSAGES =====
app.post("/webhook", (req, res) => {
    console.log("Received:", JSON.stringify(req.body, null, 2));
    res.json({ success: true });
});

// ===== BASIC HEALTH CHECK =====
app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));

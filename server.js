const express = require("express");
const { encryptResponse, decryptRequest } = require("./encryption");

const app = express();
app.use(express.json());

// ================= VERIFY WEBHOOK =================
app.get("/webhook", (req, res) => {
    const VERIFY_TOKEN = process.env.VERIFY_TOKEN || "my_verify_token";

    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
        return res.status(200).send(challenge);
    }

    return res.sendStatus(403);
});

// ================= FLOW ENDPOINT =================
app.post("/webhook", (req, res) => {
    try {
        const decrypted = decryptRequest(req.body);

        const { action, data } = decrypted;

        // ===== INIT =====
        if (action === "INIT") {
            return res.send(
                encryptResponse({
                    screen: "LOAN",
                    data: {
                        title: "Pre Approved Loan",
                        amount: "720000",
                        tenure: "48",
                        emi: "18000"
                    }
                }, decrypted)
            );
        }

        // ===== DATA EXCHANGE =====
        if (action === "data_exchange") {
            return res.send(
                encryptResponse({
                    screen: "DETAILS",
                    data: {
                        status: "updated"
                    }
                }, decrypted)
            );
        }

        return res.sendStatus(200);

    } catch (e) {
        console.error(e);
        return res.sendStatus(500);
    }
});

// ================= HEALTH =================
app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));

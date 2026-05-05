const express = require("express");
const {
    decryptRequest,
    encryptResponse,
    FlowEndpointException
} = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
    res.send("OK");
});

app.post("/webhook", (req, res) => {
    try {
        console.log("Incoming Flow Request");

        const decrypted = decryptRequest(req.body);

        console.log("Decrypted OK");

        const { version, action } = decrypted;

        // ===== INIT =====
        if (action === "INIT") {
            const response = {
                version,
                screen: "LOAN",
                data: {
                    title: "Render + Meta Working 🎉",
                    amount: "720000",
                    status: "active"
                }
            };

            // 🔥 مهم: يرجع BASE64 مش JSON
            const encrypted = encryptResponse(response, decrypted);

            return res.send(encrypted);
        }

        // fallback
        const response = {
            version,
            screen: "LOAN",
            data: {
                title: "OK",
                amount: "720000"
            }
        };

        const encrypted = encryptResponse(response, decrypted);

        return res.send(encrypted);

    } catch (err) {
        console.error(err);

        if (err instanceof FlowEndpointException) {
            return res.status(err.statusCode).send();
        }

        return res.status(500).send("error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running"));

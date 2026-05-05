const express = require("express");
const { encryptResponse } = require("./encryption");

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Server is running");
});

app.post("/webhook", (req, res) => {
    try {
        console.log("RAW REQUEST:");
        console.log(JSON.stringify(req.body, null, 2));

        // ⚠️ لا تفك aesKey من body (هذا سبب 500 عندك)
        const {
            version,
            screen,
            data
        } = req.body;

        // رد ثابت للتجربة (بدون logic معقد)
        const response = {
            version: version || "7.3",
            screen: "LOAN",
            data: {
                title: "Render + Meta Working 🎉",
                amount: "720000",
                status: "active"
            }
        };

        // ⚠️ في Render تجريبي: نعيد JSON مباشرة أولاً للاختبار
        const encrypted = encryptResponseSimple(response);

        return res.send(encrypted);

    } catch (err) {
        console.error("ERROR:", err);
        return res.status(500).send("Internal Server Error");
    }
});

// ===== مؤقت للاختبار (بدون AES) =====
function encryptResponseSimple(payload) {
    return JSON.stringify(payload); // فقط للتأكد أن السيرفر يعمل
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));

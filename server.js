const express = require("express");
const {
  decryptRequest,
  encryptResponse,
  FlowEndpointException
} = require("./flowCrypto");

const app = express();
app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.post("/webhook", async (req, res) => {
  try {
    console.log("Incoming Flow Request");

    // 🔐 1. فك التشفير (هذا إلزامي)
    const decrypted = decryptRequest(req.body);

    console.log("Decrypted:", JSON.stringify(decrypted, null, 2));

    const { screen, data, version, action } = decrypted;

    // ===== INIT REQUEST =====
    if (action === "INIT") {
      const response = {
        version,
        screen: "LOAN",
        data: {
          title: "Loan Flow Working 🚀",
          amount: "720000",
          status: "active"
        }
      };

      const encrypted = encryptResponse(response, decrypted);
      return res.send(encrypted);
    }

    // ===== DEFAULT =====
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
    console.error("ERROR:", err);

    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }

    return res.status(500).send("error");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));

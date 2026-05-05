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

app.post("/webhook", (req, res) => {
  try {
    console.log("Incoming Flow Request");

    // 🔐 فك التشفير
    const decrypted = decryptRequest(req.body);

    console.log("Decrypted:", JSON.stringify(decrypted, null, 2));

    const { version, action } = decrypted;

    // ===== INIT =====
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

      return res.send(encryptResponse(response, decrypted));
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

    return res.send(encryptResponse(response, decrypted));

  } catch (err) {
    console.error("FLOW ERROR:", err);

    if (err instanceof FlowEndpointException) {
      return res.status(err.statusCode).send();
    }

    // 🔥 مهم: لا ترجع 500 حقيقي لMeta
    return res.status(200).send("error-safe");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on " + PORT));

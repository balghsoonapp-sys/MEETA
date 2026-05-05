const express = require("express");
require("dotenv").config();

const {
  decryptRequest,
  encryptResponse,
  FlowEndpointException,
} = require("./flowCrypto");

const app = express();

app.use(express.json({ limit: "2mb" }));

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.post("/webhook", async (req, res) => {
  let decryptedRequest;

  try {
    console.log("📩 Flow Request received");

    decryptedRequest = decryptRequest(req.body);

    console.log("🔓 Decrypted request:", JSON.stringify(decryptedRequest.decryptedBody, null, 2));

    const { version, action, screen, data, flow_token } = decryptedRequest.decryptedBody;

    let responsePayload;

    // WhatsApp health check
    if (action === "ping") {
      responsePayload = {
        version,
        data: {
          status: "active",
        },
      };

      return res
        .status(200)
        .type("text/plain")
        .send(encryptResponse(responsePayload, decryptedRequest));
    }

    // Error notification acknowledgement
    if (data && data.error) {
      responsePayload = {
        version,
        data: {
          acknowledged: true,
        },
      };

      return res
        .status(200)
        .type("text/plain")
        .send(encryptResponse(responsePayload, decryptedRequest));
    }

    // Initial opening of Flow
    if (action === "INIT") {
      responsePayload = {
        version,
        screen: "LOAN",
        data: {
          title: "Meta Flow Working",
          amount: "720000",
          status: "active",
        },
      };

      return res
        .status(200)
        .type("text/plain")
        .send(encryptResponse(responsePayload, decryptedRequest));
    }

    // User submits screen / data_exchange
    if (action === "data_exchange") {
      responsePayload = {
        version,
        screen: "LOAN",
        data: {
          title: "تم استلام البيانات",
          amount: "720000",
          status: "active",
        },
      };

      return res
        .status(200)
        .type("text/plain")
        .send(encryptResponse(responsePayload, decryptedRequest));
    }

    // Fallback valid encrypted response
    responsePayload = {
      version: version || "3.0",
      screen: "LOAN",
      data: {
        title: "OK",
        amount: "720000",
        status: "active",
      },
    };

    return res
      .status(200)
      .type("text/plain")
      .send(encryptResponse(responsePayload, decryptedRequest));

  } catch (error) {
    console.error("❌ FLOW ERROR:", error);

    if (error instanceof FlowEndpointException) {
      return res.sendStatus(error.statusCode);
    }

    // Meta recommends 421 if request cannot be decrypted.
    return res.sendStatus(421);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

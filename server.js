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

app.post("/webhook", (req, res) => {
  try {
    console.log("📩 Flow Request received");

    const decryptedRequest = decryptRequest(req.body);
    const body = decryptedRequest.decryptedBody;

    console.log("🔓 Decrypted body:", JSON.stringify(body, null, 2));

    const version = body.version || "3.0";
    const action = body.action;
    const data = body.data || {};

    let responsePayload;

    // WhatsApp Flow health check
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

    // Error notification from WhatsApp client
    if (data.error) {
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

    // Your Flow screen ID is RECOMMEND, not LOAN
    if (action === "INIT") {
      responsePayload = {
        version,
        screen: "RECOMMEND",
        data: {},
      };

      return res
        .status(200)
        .type("text/plain")
        .send(encryptResponse(responsePayload, decryptedRequest));
    }

    if (action === "data_exchange") {
      const selected = Object.values(data)[0];

      // If user selected "Yes"
      if (String(selected || "").includes("نعم")) {
        responsePayload = {
          version,
          screen: "SUCCESS",
          data: {
            extension_message_response: {
              params: {
                flow_token: body.flow_token || "appointment_confirmed",
                appointment_status: "confirmed",
              },
            },
          },
        };
      } else {
        responsePayload = {
          version,
          screen: "SUCCESS",
          data: {
            extension_message_response: {
              params: {
                flow_token: body.flow_token || "appointment_cancelled",
                appointment_status: "cancelled",
              },
            },
          },
        };
      }

      return res
        .status(200)
        .type("text/plain")
        .send(encryptResponse(responsePayload, decryptedRequest));
    }

    responsePayload = {
      version,
      screen: "RECOMMEND",
      data: {},
    };

    return res
      .status(200)
      .type("text/plain")
      .send(encryptResponse(responsePayload, decryptedRequest));

  } catch (err) {
    console.error("❌ FLOW ERROR:", err);

    if (err instanceof FlowEndpointException) {
      return res.sendStatus(err.statusCode);
    }

    return res.sendStatus(500);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});

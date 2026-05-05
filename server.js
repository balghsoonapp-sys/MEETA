const express = require("express");
const app = express();

app.use(express.json());

app.post("/webhook", (req, res) => {
    console.log("Received:", req.body);
    res.json({ success: true });
});

app.get("/", (req, res) => {
    res.send("Server is running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));
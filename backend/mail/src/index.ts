import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js"; // your RabbitMQ consumer

dotenv.config();

// 1️⃣ Start the RabbitMQ consumer
startSendOtpConsumer();

// 2️⃣ Create Express app for health check
const app = express();

app.get("/health", (req, res) => res.send("OK"));

// 3️⃣ Start Express server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT} (health endpoint active)`);
});

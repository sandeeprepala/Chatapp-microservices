import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js";

dotenv.config();

// Start the Redis OTP consumer
startSendOtpConsumer();

const app = express();

// Health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

app.get("/", (req, res) => res.send("Mail service running"));

// Start Express server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT}`);
});

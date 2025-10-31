import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js"; // Redis consumer
import axios from "axios"

dotenv.config();

// 1️⃣ Start the Redis OTP consumer
startSendOtpConsumer(); 

// 2️⃣ Create Express app for health check
const app = express();

app.get("/health", (req, res) => res.send("OK"));
app.get("/",(req, res) => res.send("Mail service running"))

// 3️⃣ Start Express server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT} (health endpoint active)`);

  setInterval(async () => {
    try {
      // Keep the service alive with more frequent pings
      await axios.get(`https://chatapp-mail-microservice.onrender.com/health`);
      console.log(`Self-ping successful ✅ [${new Date().toISOString()}]`);
    } catch (error: any) {
      console.error(`Self-ping failed ❌ [${new Date().toISOString()}]:`, error.message);
    }
  }, 10 * 60 * 1000); // ping every 10 minutes to stay within free tier limits but before shutdown
});

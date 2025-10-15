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

// 3️⃣ Start Express server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT} (health endpoint active)`);

  setInterval(async () => {
    try {
      await axios.get(`https://chatapp-mail-microservice.onrender.com/health`);
      console.log("Self-ping successful ✅");
    } catch (err) {
      console.error("Self-ping failed ❌");
    }
  }, 5 * 60 * 1000); // every 5 minutes
});

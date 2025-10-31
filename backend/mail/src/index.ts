import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js"; // Redis consumer
import axios from "axios"

dotenv.config();

// 1️⃣ Start the Redis OTP consumer
startSendOtpConsumer(); 

// 2️⃣ Create Express app for health check
const app = express();

import monitorRoutes from './routes/monitor.js';

app.use('/monitor', monitorRoutes);
app.get("/", (req, res) => res.send("Mail service running"));

// Track service health
let lastSuccessfulPing = Date.now();
let consecutiveFailures = 0;

// Service URLs - adjust these to your actual URLs
const MAIL_SERVICE_URL = process.env.MAIL_SERVICE_URL || 'https://chatapp-mail-microservice.onrender.com';
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'https://chatapp-user-microservice.onrender.com';

// Keep-alive function with cross-service pinging
async function keepAlive() {
  try {
    // Ping our own health endpoint
    await axios.get(`${MAIL_SERVICE_URL}/monitor/health`);
    
    // Also ping the user service to keep it alive (they depend on each other)
    await axios.get(`${USER_SERVICE_URL}/health`);
    
    console.log(`✅ Services ping successful [${new Date().toISOString()}]`);
    lastSuccessfulPing = Date.now();
    consecutiveFailures = 0;
  } catch (error: any) {
    consecutiveFailures++;
    console.error(`❌ Services ping failed [${new Date().toISOString()}]:`, {
      error: error.message,
      consecutiveFailures,
      timeSinceLastSuccess: Math.floor((Date.now() - lastSuccessfulPing) / 1000) + 's'
    });

    // If we've failed many times, try to recover
    if (consecutiveFailures >= 3) {
      console.log('🔄 Attempting service recovery...');
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
    }
  }
}

// 3️⃣ Start Express server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT} (monitoring active)`);

  // Primary keep-alive interval (every 12 minutes)
  setInterval(keepAlive, 12 * 60 * 1000);
  
  // Secondary shorter interval when we detect issues
  setInterval(() => {
    const timeSinceLastSuccess = Date.now() - lastSuccessfulPing;
    if (timeSinceLastSuccess > 10 * 60 * 1000) { // If no success for 10 minutes
      console.log('⚠️ Long time since last successful ping, running additional health check...');
      keepAlive();
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
  
  // Initial keep-alive
  keepAlive();
});

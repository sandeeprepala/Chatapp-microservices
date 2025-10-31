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

// Basic health check endpoints
app.get('/health', (req, res) => {
  res.send('OK');
});

app.get("/", (req, res) => res.send("Mail service running"));

// Monitoring routes
app.use('/monitor', monitorRoutes);

// Track service health
let lastSuccessfulPing = Date.now();
let consecutiveFailures = 0;

// Service URLs for different environments
const isProd = process.env.NODE_ENV === 'production';
const MAIL_SERVICE_URL = isProd 
  ? 'https://chatapp-mail-microservice.onrender.com'
  : 'http://localhost:4001';
const USER_SERVICE_URL = isProd
  ? 'https://chatapp-user-microservice.onrender.com'
  : 'http://localhost:4000';

// Keep-alive function with cross-service pinging
async function keepAlive() {
  try {
    if (isProd) {
      // In production, just ping our own service to keep it alive
      await axios.get(`${MAIL_SERVICE_URL}/health`);
      console.log(`✅ Mail service self-ping successful [${new Date().toISOString()}]`);
    } else {
      // In development, check all services
      try {
        await axios.get(`${MAIL_SERVICE_URL}/health`);
        console.log(`✅ Mail service health check successful [${new Date().toISOString()}]`);
      } catch (mailError: any) {
        console.error(`⚠️ Mail service health check failed:`, mailError.message);
      }
      
      try {
        await axios.get(`${USER_SERVICE_URL}/health`);
        console.log(`✅ User service health check successful [${new Date().toISOString()}]`);
      } catch (userError: any) {
        console.error(`⚠️ User service health check failed:`, userError.message);
      }
    }
    
    console.log(`✅ Services ping cycle completed [${new Date().toISOString()}]`);
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

    // More frequent pings in production to prevent Render from sleeping
  const pingInterval = isProd ? 5 * 60 * 1000 : 12 * 60 * 1000; // 5 minutes in prod, 12 in dev
  setInterval(keepAlive, pingInterval);
  
  if (!isProd) {
    // Additional health checks only in development
    setInterval(() => {
      const timeSinceLastSuccess = Date.now() - lastSuccessfulPing;
      if (timeSinceLastSuccess > 10 * 60 * 1000) {
        console.log('⚠️ Long time since last successful ping, running additional health check...');
        keepAlive();
      }
    }, 5 * 60 * 1000);
  }
  
  // Initial keep-alive
  keepAlive();
});

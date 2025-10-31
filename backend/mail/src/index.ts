import express from "express";
import dotenv from "dotenv";
import { startSendOtpConsumer } from "./consumer.js";
import axios from "axios";

dotenv.config();

// Start the Redis OTP consumer
startSendOtpConsumer();

const app = express();
import monitorRoutes from './routes/monitor.js';

// Basic health check endpoint
app.get('/health', (req, res) => {
  res.send('OK');
});

app.get("/", (req, res) => res.send("Mail service running"));

// Monitoring routes
app.use('/monitor', monitorRoutes);

// Simple self-ping mechanism for Render
const SELF_URL = process.env.RENDER_EXTERNAL_URL || 'http://localhost:4001';
let lastPingTime = Date.now();

// Keep-alive function just pings self to prevent sleep
async function keepAlive() {
  try {
    const response = await axios.get(`${SELF_URL}/health`);
    if (response.status === 200) {
      lastPingTime = Date.now();
      console.log(`✅ Self-ping successful [${new Date().toISOString()}]`);
    }
  } catch (error: any) {
    console.error(`❌ Self-ping failed [${new Date().toISOString()}]:`, error.message);
  }
}

// Start Express server
const PORT = process.env.PORT || 4001;
app.listen(PORT, () => {
  console.log(`Mail Service running on port ${PORT} (monitoring active)`);

  // Ping every minute to prevent Render from sleeping
  setInterval(keepAlive, 60 * 1000);
  
  // Initial keep-alive
  keepAlive();
});

import redisClient from "./config/redis.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Configure email transport with retry mechanism
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000, // Limit to 1 message per second
  rateLimit: 5, // Maximum 5 messages per rateDelta
});

export const startSendOtpConsumer = async () => {
  console.log("📨 Mail consumer started, waiting for OTP messages...");

  while (true) {
    try {
      const data = await redisClient.blPop(["send-otp"], 0);
      const msg = data?.element;
      if (!msg) continue;

      const { to, subject, body } = JSON.parse(msg);
      console.log(`📩 Sending OTP mail to ${to}`);

      // Implement retry mechanism
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to,
            subject,
            text: body,
          });
          console.log(`✅ Mail sent successfully to ${to}`);
          break;
        } catch (error) {
          retries++;
          console.error(`📫 Attempt ${retries}/${MAX_RETRIES} failed for ${to}:`, error);
          if (retries === MAX_RETRIES) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }
    } catch (err) {
      console.error("❌ Error processing OTP message:", err);
    }
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Shutting down mail consumer...");
  process.exit(0);
});

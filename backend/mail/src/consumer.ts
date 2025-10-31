import redisClient from "./config/redis.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// Check required environment variables
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is required");
}
if (!process.env.MAIL_USER) {
  throw new Error("MAIL_USER (sender email) is required");
}

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
  secure: false, // Using STARTTLS
  tls: {
    rejectUnauthorized: true // Verify SSL/TLS certificates
  }
});

// Test SMTP connection on startup
async function verifyMailConnection() {
  try {
    await transporter.verify();
    console.log("✅ SendGrid connection verified");
    return true;
  } catch (error: any) {
    console.error("❌ SendGrid connection failed:", error.message);
    return false;
  }
}

export const startSendOtpConsumer = async () => {
  console.log("📨 Starting mail service...");
  
  // Initial connection test
  await verifyMailConnection();

  console.log("⏳ Waiting for OTP messages...");

  while (true) {
    try {
      // Wait for OTP message
      const data = await redisClient.blPop(["send-otp"], 0);
      if (!data?.element) continue;

      // Parse message
      const { to, subject, body } = JSON.parse(data.element);
      
      // Log attempt
      console.log(`� Sending mail to ${to}...`);

      // Send mail
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        text: body,
      });

      console.log(`✅ Mail sent to ${to}`);
    } catch (error: any) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
        console.error("🔴 Mail server connection failed:", error.message);
      } else if (error.responseCode >= 500) {
        console.error("🔴 Mail server error:", error.message);
      } else {
        console.error("❌ Error processing mail:", error.message);
      }
    }
  }
};

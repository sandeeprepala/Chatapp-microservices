import redisClient from "./config/redis.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import type { SentMessageInfo, Options } from "nodemailer/lib/smtp-transport/index.js";

dotenv.config();

// Validate environment variables
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is required");
}
if (!process.env.MAIL_USER) {
  throw new Error("MAIL_USER (sender email) is required");
}

// Create reusable transporter
let transporter: nodemailer.Transporter<SentMessageInfo, Options>;

async function initTransporter() {
  transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,
    secure: false, // SendGrid uses STARTTLS, not SMTPS
    auth: {
      user: "apikey",
      pass: process.env.SENDGRID_API_KEY,
    },
  });

  try {
    await transporter.verify();
    console.log("✅ SendGrid connection successful");
  } catch (error) {
    console.error("❌ SendGrid connection failed:", (error as Error).message);
    process.exit(1);
  }
}

export const startSendOtpConsumer = async () => {
  console.log("📨 Starting mail service...");

  // Initialize transporter
  await initTransporter();

  console.log("⏳ Waiting for OTP messages...");

  while (true) {
    try {
      const data = await redisClient.blPop(["send-otp"], 0);
      if (!data?.element) continue;

      const { to, subject, body } = JSON.parse(data.element);
      console.log(`📩 Sending mail to ${to}...`);

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        text: body,
      });

      console.log(`✅ Mail sent successfully to ${to}`);
    } catch (error) {
      if (error instanceof Error) {
        console.error("❌ Error processing mail:", error.message);
      } else {
        console.error("❌ Error processing mail:", error);
      }
    }
  }
};

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Shutting down mail consumer...");
  process.exit(0);
});

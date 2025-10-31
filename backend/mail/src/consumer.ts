import redisClient from "./config/redis.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
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

      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to,
        subject,
        text: body,
      });

      console.log(`✅ Mail sent successfully to ${to}`);
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

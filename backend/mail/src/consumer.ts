import redisClient from "./config/redis.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const startSendOtpConsumer = async() => {
  console.log("📨 Mail consumer started, waiting for OTP messages...");

  while (true) {
    try {
      const msg = await redisClient.rPop("send-otp"); // fetch one message
      if (!msg) {
        await new Promise((res) => setTimeout(res, 2000)); // wait 2s if empty
        continue;
      }

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
}

// Optional graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Shutting down mail consumer...");
  process.exit(0);
});

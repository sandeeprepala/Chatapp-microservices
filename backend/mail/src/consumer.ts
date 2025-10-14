import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

const QUEUE_NAME = "send-otp";

let reconnectTimeout = 5000;
let shuttingDown = false;

export const startSendOtpConsumer = async () => {
  while (!shuttingDown) {
    try {
      const amqpUrl = process.env.RABBITMQ_URL;
      if (!amqpUrl) throw new Error("RABBITMQ_URL must be set in environment");

      const connection = await amqp.connect(amqpUrl, {
        heartbeat: 30, // keep connection alive every 30s
      });

      console.log("✅ Connected to RabbitMQ");

      const channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      await channel.prefetch(1);

      console.log("📨 Listening for messages on", QUEUE_NAME);

      // Create one transporter for Gmail
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      await transporter.verify();
      console.log("✅ SMTP verified");

      connection.on("close", () => {
        console.warn("⚠️ RabbitMQ connection closed. Reconnecting in 5s...");
        setTimeout(() => startSendOtpConsumer(), reconnectTimeout);
      });

      connection.on("error", (err) => {
        console.error("❌ RabbitMQ connection error:", err);
      });

      channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;
        try {
          const { to, subject, body } = JSON.parse(msg.content.toString());
          console.log(`📩 Sending OTP mail to ${to}`);

          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to,
            subject,
            text: body,
          });

          console.log(`✅ Mail sent to ${to}`);
          channel.ack(msg);
        } catch (err) {
          console.error("❌ Error processing message:", err);
          channel.nack(msg, false, false);
        }
      });

      process.on("SIGTERM", async () => {
        shuttingDown = true;
        console.log("🛑 Gracefully shutting down...");
        await channel.close();
        await connection.close();
        process.exit(0);
      });

      // Prevent premature exit
      await new Promise(() => {});
    } catch (err) {
      console.error("❌ Consumer failed, retrying in 5s:", err);
      await new Promise((res) => setTimeout(res, reconnectTimeout));
    }
  }
};

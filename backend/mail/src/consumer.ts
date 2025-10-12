import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const startSendOtpConsumer = async () => {
  try {
    // -------------------------------
    // 1️⃣ Determine RabbitMQ URL
    // -------------------------------
    // Prefer full URL if provided
    let amqpUrl = process.env.RABBITMQ_URL;

    // If URL is not provided, build from individual env vars
    if (!amqpUrl) {
      const isProduction = process.env.NODE_ENV === "production";
      const protocol = isProduction ? "amqps" : "amqp";
      const port = process.env.Rabbitmq_Port || (protocol === "amqps" ? 5671 : 5672);

      amqpUrl = `${protocol}://${process.env.Rabbitmq_Username}:${process.env.Rabbitmq_Password}@${process.env.Rabbitmq_Host}:${port}`;
    }

    console.log("🐇 Connecting to RabbitMQ at:", amqpUrl);

    // -------------------------------
    // 2️⃣ Connect to RabbitMQ
    // -------------------------------
    const connection = await amqp.connect(amqpUrl,{
      servername: new URL(amqpUrl).hostname,
    });
    const channel = await connection.createChannel();

    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });

    console.log("✅ Mail Service consumer started, listening for OTP emails");

    // -------------------------------
    // 3️⃣ Consume messages
    // -------------------------------
    channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const { to, subject, body } = JSON.parse(msg.content.toString());

        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          },
        });

        await transporter.sendMail({
          from: "Chat App <no-reply@chatapp.com>",
          to,
          subject,
          text: body,
        });

        console.log(`📩 OTP mail sent to ${to}`);
        channel.ack(msg);
      } catch (error) {
        console.error("❌ Failed to send OTP:", error);
      }
    });
  } catch (error) {
    console.error("❌ Failed to start RabbitMQ consumer:", error);
  }
};

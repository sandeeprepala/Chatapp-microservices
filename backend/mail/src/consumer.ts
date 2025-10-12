import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const startSendOtpConsumer = async () => {
  try {
    // 🟢 Prefer a full connection URL if available
    const amqpUrl =
      process.env.RABBITMQ_URL ||
      `amqps://${process.env.Rabbitmq_Username}:${process.env.Rabbitmq_Password}@${process.env.Rabbitmq_Host}:${process.env.Rabbitmq_Port || 5672}`;

    const connection = await amqp.connect(amqpUrl);
    const channel = await connection.createChannel();

    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });

    console.log("✅ Mail Service consumer started, listening for OTP emails");

    channel.consume(queueName, async (msg) => {
      if (msg) {
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
      }
    });
  } catch (error) {
    console.error("❌ Failed to start RabbitMQ consumer:", error);
  }
};

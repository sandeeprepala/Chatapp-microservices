import amqp from "amqplib";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const startSendOtpConsumer = async () => {
  try {
    let amqpUrl = process.env.RABBITMQ_URL;
    if (!amqpUrl) {
      throw new Error("RABBITMQ_URL must be set in environment");
    }

    // Verify mail configuration
    if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
      throw new Error("MAIL_USER and MAIL_PASS must be set in environment");
    }

    // Parse the URL to extract components
    const parsedUrl = new URL(amqpUrl);
    const virtualHost = parsedUrl.pathname.slice(1) || process.env.RABBITMQ_VHOST || 'vhost';
    
    // Ensure URL has virtualhost
    const fullUrl = amqpUrl.includes(virtualHost) ? amqpUrl : `${amqpUrl}/${virtualHost}`;
    
    console.log("🐇 Connecting to RabbitMQ at:", fullUrl.replace(/:.*@/, ':***@'));

    const connection = await amqp.connect(fullUrl, {
      servername: parsedUrl.hostname,
    });

    // Handle connection events
    connection.on('error', (err) => {
      console.error('❌ RabbitMQ connection error:', err);
    });

    connection.on('close', () => {
      console.warn('⚠️ RabbitMQ connection closed, attempting to reconnect in 5s...');
      setTimeout(() => startSendOtpConsumer(), 5000);
    });

    const channel = await connection.createChannel();
    
    // Handle channel events
    channel.on('error', (err) => {
      console.error('❌ RabbitMQ channel error:', err);
    });

    channel.on('close', () => {
      console.warn('⚠️ RabbitMQ channel closed');
    });

    const queueName = "send-otp";
    await channel.assertQueue(queueName, { durable: true });
    
    // Prefetch only one message at a time
    await channel.prefetch(1);

    console.log("✅ Mail Service consumer started, listening for OTP emails");

    // Create mail transporter once
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    // Verify mail connection on startup
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    channel.consume(queueName, async (msg) => {
      if (!msg) return;

      try {
        const { to, subject, body } = JSON.parse(msg.content.toString());
        console.log(`📨 Processing mail request to ${to}`);

        await transporter.sendMail({
          from: process.env.MAIL_USER, // Use authenticated Gmail address
          to,
          subject,
          text: body,
        });

        console.log(`📩 OTP mail sent to ${to}`);
        channel.ack(msg);
      } catch (err) {
        const error = err as any;
        console.error("❌ Failed to send OTP:", error?.stack || error);

        // Requeue policy: default to requeue when debugging or on transient errors
        const transient = (error && (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || (error.message && error.message.includes('timeout'))));
        const forceRequeue = process.env.REQUEUE_ON_ERROR === 'true';
        const shouldRequeue = forceRequeue || transient;

        try {
          channel.nack(msg, false, shouldRequeue);
          console.log(`🔁 Message nacked (requeue=${shouldRequeue})`);
        } catch (nackErr) {
          console.error('❌ Failed to nack message:', nackErr);
        }
      }
    });
  } catch (error) {
    console.error("❌ Failed to start RabbitMQ consumer:", error);
  }
};

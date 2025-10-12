import amql from "amqplib";

let channel: amql.Channel | null = null;

export const connectRabbitMQ = async () => {
  try {
    if (!process.env.RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL is not defined in .env");
    }

    const connection = await amql.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    console.log("✅ Connected to RabbitMQ successfully");
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
  }
};

export const publishToQueue = async (queueName: string, message: any) => {
  if (!channel) {
    console.error("❌ RabbitMQ channel is not initialized. Call connectRabbitMQ() first.");
    return;
  }

  try {
    await channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)), {
      persistent: true,
    });
    console.log(`📤 Message sent to queue: ${queueName}`);
  } catch (error) {
    console.error(`❌ Failed to publish message to queue "${queueName}":`, error);
  }
};

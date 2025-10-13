import amql from "amqplib";

// Use loose typing for connection/channel to avoid library type mismatches
let channel: any = null;
let connection: any = null;

const createConnection = async (url: string): Promise<any> => {
  // Parse and ensure vhost exists in URL
  const parsed = new URL(url);
  const vhost = parsed.pathname.slice(1) || process.env.RABBITMQ_VHOST || '';
  const fullUrl = url.includes(vhost) || vhost === '' ? url : `${url}/${vhost}`;

  const conn = await amql.connect(fullUrl, { servername: parsed.hostname });
  return conn;
};

export const connectRabbitMQ = async () => {
  try {
    if (!process.env.RABBITMQ_URL) {
      throw new Error("RABBITMQ_URL is not defined in environment");
    }

    connection = await createConnection(process.env.RABBITMQ_URL);
    if (connection) {
      connection.on?.('error', (err: any) => console.error('❌ RabbitMQ connection error:', err));
      connection.on?.('close', () => {
        console.warn('⚠️ RabbitMQ connection closed, attempting reconnect in 5s...');
        setTimeout(connectRabbitMQ, 5000);
      });

      channel = await connection.createChannel();
      channel?.on?.('error', (err: any) => console.error('❌ RabbitMQ channel error:', err));
      channel?.on?.('close', () => console.warn('⚠️ RabbitMQ channel closed'));
    }

    console.log("✅ Connected to RabbitMQ successfully");
  } catch (error) {
    console.error("❌ Failed to connect to RabbitMQ:", error);
    // retry after delay
    setTimeout(connectRabbitMQ, 5000);
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

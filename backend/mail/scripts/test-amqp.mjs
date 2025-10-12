import amqp from 'amqplib';
import dotenv from 'dotenv';
dotenv.config();

async function testConnection() {
    const url = process.env.RABBITMQ_URL;
    if (!url) {
        console.error('❌ RABBITMQ_URL must be set in .env');
        process.exit(1);
    }
    
    // Hide credentials in logs
    console.log('Testing connection to:', url.replace(/:.*@/, ':***@'));
    
    try {
        // Parse the URL to extract components
        const parsedUrl = new URL(url);
        const virtualHost = parsedUrl.pathname.slice(1) || process.env.RABBITMQ_VHOST || 'vhost';
        
        // Ensure URL has virtualhost
        const fullUrl = url.includes(virtualHost) ? url : `${url}/${virtualHost}`;
        
        const conn = await amqp.connect(fullUrl, {
            servername: parsedUrl.hostname,
        });
        console.log('✅ Connected to CloudAMQP');
        
        const channel = await conn.createChannel();
        console.log('✅ Created channel');
        
        const queue = 'send-otp';
        await channel.assertQueue(queue, { durable: true });
        console.log('✅ Queue exists:', queue);
        
        // Send a test message
        const testMsg = { 
            to: 'test@example.com', 
            subject: 'Test Message', 
            body: 'Test message from CloudAMQP connection test' 
        };
        channel.sendToQueue(queue, Buffer.from(JSON.stringify(testMsg)), {
            persistent: true
        });
        console.log('✅ Sent test message');
        
        // Listen for messages (including our test message)
        console.log('👂 Listening for messages for 10 seconds...');
        channel.consume(queue, (msg) => {
            if (msg) {
                console.log('📬 Received message:', JSON.parse(msg.content.toString()));
                channel.ack(msg);
            }
        });

        // Keep running for 10 seconds then clean up
        await new Promise(resolve => setTimeout(resolve, 10000));
        console.log('Cleaning up...');
        await channel.close();
        await conn.close();
        console.log('✅ Test complete');
    } catch (err) {
        console.error('❌ Error:', err.message);
        if (err.message.includes('socket')) {
            console.log('\n🔍 Common socket issues:');
            console.log('1. Check if RABBITMQ_URL starts with amqps:// (required for CloudAMQP)');
            console.log('2. Verify the hostname and credentials in your CloudAMQP URL');
            console.log('3. Check if your CloudAMQP instance is running');
        }
        process.exit(1);
    }
}

testConnection();
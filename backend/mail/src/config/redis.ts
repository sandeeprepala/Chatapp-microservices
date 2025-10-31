import {createClient} from "redis";
import dotenv from "dotenv"
dotenv.config()



if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

// Track Redis connection state
let isRedisHealthy = false;
let lastRedisError = null;

// Track Redis connection state
let lastRedisConnected = Date.now();
let connectionAttempts = 0;

const redisConfig: any = {
  url: process.env.REDIS_URL,
  socket: {
    reconnectStrategy: (retries: number) => {
      connectionAttempts = retries;
      
      if (retries > 20) {
        console.error('🔴 Redis connection failed after 20 retries, forcing service restart...');
        process.exit(1); // Process manager will restart the service
      }
      
      // Exponential backoff with max delay of 30 seconds
      const delay = Math.min(Math.pow(2, retries) * 1000, 30000);
      console.log(`Redis reconnecting... Attempt ${retries}. Waiting ${delay}ms`);
      return delay;
    },
    connectTimeout: 10000, // 10 seconds
  },
  database: 0
};

// Add authentication if credentials are provided
if (process.env.REDIS_USERNAME) {
  redisConfig.username = process.env.REDIS_USERNAME;
}
if (process.env.REDIS_PASSWORD) {
  redisConfig.password = process.env.REDIS_PASSWORD;
}

const redisClient = createClient(redisConfig);

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
  // Track the error time
  lastRedisConnected = Date.now();
});

redisClient.on('connect', () => {
  console.log('Redis Client Connected');
  // Reset connection tracking on successful connection
  lastRedisConnected = Date.now();
  connectionAttempts = 0;
});

redisClient.on('reconnecting', () => {
  console.log('Redis Client Reconnecting...');
});

// Monitor Redis connection health
setInterval(() => {
  const timeSinceLastConnection = Date.now() - lastRedisConnected;
  if (timeSinceLastConnection > 5 * 60 * 1000) { // 5 minutes
    console.error('⚠️ Redis connection health check failed:', {
      timeSinceLastConnection: Math.floor(timeSinceLastConnection / 1000) + 's',
      connectionAttempts
    });
    // Force reconnection if too much time has passed
    redisClient.disconnect().then(() => {
      console.log('🔄 Forcing Redis reconnection...');
      redisClient.connect();
    }).catch(console.error);
  }
}, 60 * 1000); // Check every minute

await redisClient.connect();

export default redisClient;



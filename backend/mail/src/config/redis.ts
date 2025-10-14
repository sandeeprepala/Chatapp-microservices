import {createClient} from "redis";
import dotenv from "dotenv"
dotenv.config()



if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}

const redisClient = createClient({
  url: process.env.REDIS_URL, // change if using cloud
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

await redisClient.connect(); 

export default redisClient;



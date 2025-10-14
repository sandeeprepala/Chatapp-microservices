import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/db.js";
import userRoute from "./routes/user.js";
import cors from "cors"

import { createClient } from "redis";
// import { connectRabbitMQ } from "./config/rabbitmq.js";

dotenv.config();

connectDb();

// connectRabbitMQ();

if (!process.env.REDIS_URL) {
  throw new Error("REDIS_URL environment variable is not set");
}
export const redisClient = createClient({
  url: process.env.REDIS_URL,
});

redisClient
  .connect()
  .then(() => console.log("connected to redis"))
  .catch(console.error);


const app = express();

app.use(express.json());
app.use(cors())

app.use("/api/v1",userRoute);

const port = process.env.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

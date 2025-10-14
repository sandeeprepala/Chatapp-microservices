import redisClient from "./redis.js";

export const publishToQueue = async (message: { to: string; subject: string; body: string }) => {
  try {
    await redisClient.lPush("send-otp", JSON.stringify(message));
    console.log(`📤 OTP pushed to Redis queue for ${message.to}`);
  } catch (err) {
    console.error("❌ Failed to push OTP to Redis queue:", err);
  }
};

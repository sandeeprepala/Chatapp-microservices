import redisClient from "./redis.js";

export const publishToQueue = async (message: { to: string; subject: string; body: string }) => {
  try {
    const key = `send-otp:${message.to}`;
    const data = JSON.stringify(message);

    // Push message to list
    await redisClient.lPush("send-otp", data);

    // Also store a temporary key that expires in 60 seconds
    await redisClient.setEx(key, 60, data);

    console.log(`📤 OTP pushed to Redis queue for ${message.to} (expires in 60s)`);
  } catch (err) {
    console.error("❌ Failed to push OTP to Redis queue:", err);
  }
};

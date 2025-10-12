import redisClient from "./redis.js";
import type { IMessage } from "../models/Messages.js";

const RECENT_MESSAGES_LIMIT = 100;
const RECENT_MESSAGES_TTL = 24 * 60 * 60; // 24 hours in seconds

// Cache a message
export const cacheMessage = async (chatId: string, message: IMessage) => {
  try {
    const key = `chat:${chatId}:recentMessages`;

    await redisClient.lPush(key, JSON.stringify(message));
    await redisClient.lTrim(key, 0, RECENT_MESSAGES_LIMIT - 1);

    // Set expiration if not already set
    const ttl = await redisClient.ttl(key); // check current TTL
    if (ttl === -1) {
      await redisClient.expire(key, RECENT_MESSAGES_TTL);
    }
  } catch (err) {
    console.error("Redis cacheMessage error:", err);
  }
};

// Get recent messages
export const getRecentMessages = async (chatId: string): Promise<IMessage[]> => {
  try {
    const key = `chat:${chatId}:recentMessages`;
    const messages = await redisClient.lRange(key, 0, -1);
    // Reverse the messages to get chronological order (oldest first)
    return messages.map((msg) => JSON.parse(msg)).reverse();
  } catch (err) {
    console.error("Redis getRecentMessages error:", err);
    return [];
  }
};

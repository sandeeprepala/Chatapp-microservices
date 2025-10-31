import express from 'express';
import redisClient from '../config/redis.js';
import { getStats, getCircuitBreakerStatus } from '../consumer.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.send('OK');
});

// Detailed status endpoint
router.get('/status', async (req, res) => {
  const status = {
    redis: {
      connected: redisClient.isReady,
      status: redisClient.status
    },
    mail: {
      circuitBreaker: getCircuitBreakerStatus(),
      deliveryStats: getStats()
    },
    uptime: process.uptime(),
    memory: process.memoryUsage()
  };
  
  res.json(status);
});

// Queue monitoring endpoint
router.get('/queue', async (req, res) => {
  try {
    const queueLength = await redisClient.lLen('send-otp');
    const lastHourStats = getStats();
    
    res.json({
      currentQueueLength: queueLength,
      stats: lastHourStats
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get queue statistics' });
  }
});

export default router;
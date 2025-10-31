import redisClient from "./config/redis.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

// Configure email transport with retry mechanism and monitoring
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

// Monitoring stats
const stats = {
  totalAttempts: 0,
  successfulDeliveries: 0,
  failedDeliveries: 0,
  lastSuccess: null as string | null,
  lastError: null as string | null,
  averageDeliveryTime: 0,
  totalDeliveryTime: 0
};

// Update delivery stats
const updateStats = (success: boolean, deliveryTime: number, error?: string) => {
  stats.totalAttempts++;
  if (success) {
    stats.successfulDeliveries++;
    stats.lastSuccess = new Date().toISOString();
    stats.totalDeliveryTime += deliveryTime;
    stats.averageDeliveryTime = stats.totalDeliveryTime / stats.successfulDeliveries;
  } else {
    stats.failedDeliveries++;
    stats.lastError = error || 'Unknown error';
  }
};

const transporter = nodemailer.createTransport({
  host: "smtp.sendgrid.net",
  port: 587,
  auth: {
    user: "apikey",
    pass: process.env.SENDGRID_API_KEY,
  },
  pool: true, // Use pooled connections
  maxConnections: 5,
  maxMessages: 100,
  rateDelta: 1000, // Limit to 1 message per second
  rateLimit: 5, // Maximum 5 messages per rateDelta
});

// Circuit breaker implementation
const circuitBreaker = {
  failures: 0,
  lastFailure: null as Date | null,
  state: 'CLOSED' as 'CLOSED' | 'OPEN' | 'HALF_OPEN',
  threshold: 5, // Number of failures before opening
  resetTimeout: 30000, // 30 seconds timeout before attempting reset
};

const updateCircuitBreaker = (success: boolean) => {
  if (success) {
    circuitBreaker.failures = 0;
    circuitBreaker.state = 'CLOSED';
    console.log('🔄 Circuit breaker reset - Service recovered');
  } else {
    circuitBreaker.failures++;
    circuitBreaker.lastFailure = new Date();
    
    if (circuitBreaker.failures >= circuitBreaker.threshold) {
      circuitBreaker.state = 'OPEN';
      console.log('⚡ Circuit breaker opened - Too many failures');
      
      // Schedule recovery attempt
      setTimeout(() => {
        circuitBreaker.state = 'HALF_OPEN';
        console.log('🔄 Circuit breaker half-open - Attempting recovery');
      }, circuitBreaker.resetTimeout);
    }
  }
};

// Verify transporter connection with circuit breaker
const verifyConnection = async () => {
  // Don't attempt if circuit is open
  if (circuitBreaker.state === 'OPEN') {
    console.log('⚡ Circuit breaker is open - Skipping connection attempt');
    return false;
  }

  try {
    await transporter.verify();
    console.log("✅ Mail server connection verified");
    updateCircuitBreaker(true);
    return true;
  } catch (error) {
    console.error("❌ Mail server connection failed:", error);
    updateCircuitBreaker(false);
    return false;
  }
};

export const startSendOtpConsumer = async () => {
  console.log("📨 Mail consumer started, waiting for OTP messages...");

  // Initial connection verification
  await verifyConnection();

  // Verify connection every 5 minutes
  setInterval(async () => {
    await verifyConnection();
  }, 5 * 60 * 1000);

  while (true) {
    try {
      const data = await redisClient.blPop(["send-otp"], 0);
      const msg = data?.element;
      if (!msg) continue;

      const { to, subject, body } = JSON.parse(msg);
      const timestamp = new Date().toISOString();
      console.log(`📩 [${timestamp}] Processing OTP mail request for ${to}`);

      // Implement retry mechanism with connection verification
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          // Verify connection before sending
          if (!(await verifyConnection())) {
            throw new Error("Mail server connection not available");
          }

          const result = await transporter.sendMail({
            from: process.env.MAIL_USER,
            to,
            subject,
            text: body,
          });
          
          console.log(`✅ [${new Date().toISOString()}] Mail sent successfully`, {
            to,
            messageId: result.messageId,
            response: result.response
          });
          break;
        } catch (error) {
          retries++;
          const mailError = error as any;
          console.error(`📫 [${new Date().toISOString()}] Attempt ${retries}/${MAX_RETRIES} failed:`, {
            to,
            error: mailError.message || 'Unknown error',
            code: mailError.code,
            responseCode: mailError.responseCode
          });
          
          if (retries === MAX_RETRIES) {
            throw error;
          }
          
          // Longer delay between retries in production
          const delay =  RETRY_DELAY * 2;
          console.log(`⏳ Waiting ${delay}ms before retry ${retries + 1}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    } catch (err) {
      console.error("❌ Error processing OTP message:", err);
    }
  }
};

// Export monitoring functions
export const getStats = () => ({ ...stats });

export const getCircuitBreakerStatus = () => ({
  ...circuitBreaker,
  lastFailureTime: circuitBreaker.lastFailure?.toISOString()
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🛑 Shutting down mail consumer...");
  process.exit(0);
});

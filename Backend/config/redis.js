// config/redis.js
import { createClient } from "redis";

let isConnected = false;

const client = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379",
  socket: {
    // Disable auto-reconnect so it doesn't spam errors if Redis isn't running
    reconnectStrategy: (retries) => {
      if (retries >= 3) {
        console.warn("Redis not available after 3 retries — caching disabled.");
        return false; // stop retrying
      }
      return Math.min(retries * 100, 3000);
    }
  }
});

client.on("error", (err) => {
  if (!isConnected) {
    // Only log once, not on every retry
  } else {
    console.log("Redis Error:", err.message);
  }
});

client.on("connect", () => {
  isConnected = true;
  console.log("Redis connected");
});

// Try to connect — fail silently after retries
try {
  await client.connect();
} catch (err) {
  console.warn("Redis unavailable:", err.message, "— caching disabled.");
}

// Safe wrapper — returns null on any error instead of crashing
const safeClient = {
  get: async (key) => {
    if (!isConnected) return null;
    try { return await client.get(key); } catch { return null; }
  },
  setEx: async (key, ttl, value) => {
    if (!isConnected) return null;
    try { return await client.setEx(key, ttl, value); } catch { return null; }
  }
};

export default safeClient;
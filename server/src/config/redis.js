const { createClient } = require('redis');

const redisURI = process.env.REDIS_URL || 'rediss://default:gQAAAAAAAf6gAAIgcDEwNWIwYWI1NTk0MWM0NzE5YjA4YWRiOTJjNDYwMjJmYQ@modest-bee-130720.upstash.io:6379';

const redisClient = createClient({
  url: redisURI
});

redisClient.on('connect', () => {
  console.log('✅ Đã kết nối Upstash Redis Cloud thành công');
});

redisClient.on('error', (err) => {
  console.error('❌ Lỗi kết nối Redis:', err.message);
});

const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
};

module.exports = {
  connectRedis,
  redisClient,
  default: redisClient
};
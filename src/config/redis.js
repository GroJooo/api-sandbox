const Redis = require('ioredis');
const { REDIS_URL } = require('./environment');

let redisClient = null;

const connectRedis = () => {
  console.log(`Systeme : Tentative de connexion a Redis : ${REDIS_URL}`);

  redisClient = new Redis(REDIS_URL, {
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`Systeme : Nouvelle tentative de connexion Redis dans ${delay}ms...`);
      return delay;
    },
    maxRetriesPerRequest: 3,
  });

  redisClient.on('connect', () => {
    console.log('Systeme : Connecte a Redis avec succes !');
  });

  redisClient.on('error', (err) => {
    console.error('Erreur Redis:', err.message);
  });

  redisClient.on('close', () => {
    console.log('Systeme : Redis est deconnecte.');
  });

  return redisClient;
};

const getRedisClient = () => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call connectRedis() first.');
  }
  return redisClient;
};

module.exports = { connectRedis, getRedisClient };
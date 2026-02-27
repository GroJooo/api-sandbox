  const { Queue } = require('bullmq');
  const { REDIS_URL } = require('./environment');

  // Connection Redis pour BullMQ (supporter aussi les tests en local)
  const isDocker = REDIS_URL.includes('redis-service');
  const connection = {
    host: isDocker ? 'redis-service' : 'localhost',
    port: 6379
  }

  // Créer la queue d'emails
  const emailQueue = new Queue('email', {
    connection,
    defaultJobOptions: {
      attempts: 3,                    // 3 tentatives max
      backoff: {
        type: 'exponential',          // 1s, 2s, 4s
        delay: 1000                   // Délai initial : 1s
      },
      removeOnComplete: false,         // Supprimer après succès (économie mémoire)
      removeOnFail: false             // Garder les échecs pour investigation
    }
  });

  // Logs pour debugging
  emailQueue.on('completed', (job) => {
    console.log(`Job ${job.id} completé avec succès`);
  });

  emailQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} échoué:`, err.message);
  });

  module.exports = { emailQueue, connection };
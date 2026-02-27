  const express = require('express');
  const swaggerUi = require('swagger-ui-express');
  const { validateEnv } = require('./config/environment');
  const { connectDB } = require('./config/database');
  const { connectRedis } = require('./config/redis');
  const { swaggerDocs } = require('./config/swagger');
  const mountRoutes = require('./routes');
  const errorHandler = require('./middlewares/error.middleware');
  const { createBullBoard } = require('@bull-board/api');
  const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
  const { ExpressAdapter } = require('@bull-board/express');
  const { emailQueue } = require('./config/queue');

  validateEnv();
  connectDB();
  connectRedis();
  require('./workers/email.worker');

  const app = express();
  app.use(express.json());

  // Configurer Bull Board
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  mountRoutes(app);

  app.use(errorHandler);

  module.exports = app;
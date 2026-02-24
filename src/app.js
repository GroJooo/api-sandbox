  const express = require('express');
  const swaggerUi = require('swagger-ui-express');
  const { validateEnv } = require('./config/environment');
  const { connectDB } = require('./config/database');
  const { connectRedis } = require('./config/redis');
  const { swaggerDocs } = require('./config/swagger');
  const mountRoutes = require('./routes');
  const errorHandler = require('./middlewares/error.middleware');

  validateEnv();
  connectDB();
  connectRedis();

  const app = express();
  app.use(express.json());
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  mountRoutes(app);

  app.use(errorHandler);

  module.exports = app;
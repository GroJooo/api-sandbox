  const authRoutes = require('./auth.routes');
  const userRoutes = require('./user.routes');
  const healthRoutes = require('./health.routes');

  const mountRoutes = (app) => {
    app.use('/auth', authRoutes);
    app.use('/users', userRoutes);
    app.use('', healthRoutes);
  };

  module.exports = mountRoutes;
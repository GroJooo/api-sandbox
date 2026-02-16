  const app = require('./src/app');
  const { PORT } = require('./src/config/environment');

  app.listen(PORT, () => {
    console.log(`Serveur en ecoute sur le port ${PORT}`);
  });

  const mongoose = require('mongoose');
  const { MONGO_URI } = require('./environment');

  const connectDB = async () => {
    const logUri = MONGO_URI.replace(/:([^:@]+)@/, ':****@');
    console.log(`Systeme : Tentative de connexion a : ${logUri}`);

    mongoose.set('debug', process.env.NODE_ENV !== 'production');

    mongoose.connect(MONGO_URI)
      .then(() => console.log('Systeme : Connecte a MongoDB avec succes !'))
      .catch(err => console.error('Systeme : Echec de connexion initiale', err.message));

    mongoose.connection.on('error', err => {
      console.error('Erreur Mongoose apres connexion initiale:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('Systeme : Mongoose est deconnecte.');
    });
  };

  module.exports = { connectDB };
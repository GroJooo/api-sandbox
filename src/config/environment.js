  const MAX_PAGE_LIMIT = Number(process.env.MAX_PAGE_LIMIT) || 100;
  const DEFAULT_PAGE = Number(process.env.DEFAULT_PAGE) || 1;
  const DEFAULT_LIMIT = Number(process.env.DEFAULT_LIMIT) || 10;
  const PORT = process.env.PORT || 3000;
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ma_db_saas';
  const JWT_SECRET = process.env.JWT_SECRET;

  const validateEnv = () => {
    const REQUIRED_ENV = ['MONGO_URI', 'DB_USER', 'DB_PASSWORD'];
    const missingEnv = REQUIRED_ENV.filter(key => !process.env[key] && !process.env.MONGO_URI);
    if (missingEnv.length > 0 && process.env.NODE_ENV === 'production') {
      console.error(`ERREUR : Variables d'environnement manquantes : ${missingEnv.join(', ')}`);
      process.exit(1);
    }
  };

  module.exports = { MAX_PAGE_LIMIT, DEFAULT_PAGE, DEFAULT_LIMIT, PORT, MONGO_URI, JWT_SECRET, validateEnv };
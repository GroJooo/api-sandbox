  const errorHandler = (err, req, res, next) => {
    console.error(`Error Log: ${err.message}`);

    if (err.code === 11000) {
      return res.status(400).json({ error: "Cette ressource existe deja (Duplication)." });
    }

    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({ error: "Donnees invalides", details: messages });
    }

    res.status(err.status || 500).json({
      error: process.env.NODE_ENV === 'production'
        ? "Une erreur interne est survenue"
        : err.message
    });
  };

  module.exports = errorHandler;
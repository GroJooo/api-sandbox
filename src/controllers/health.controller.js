  const mongoose = require('mongoose');

  const check = (req, res) => {
    res.status(200).json({
      status: 'OK',
      db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
  };

  module.exports = { check };
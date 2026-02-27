  const bcrypt = require('bcrypt');
  const jwt = require('jsonwebtoken');
  const userRepository = require('../repositories/user.repository');
  const { JWT_SECRET } = require('../config/environment');
  const { emailQueue } = require('../config/queue');

  const register = async ({ name, email, password }) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await userRepository.create({ name, email, password: hashedPassword });

    await emailQueue.add('send-welcome-email', {
      email: user.email,
      userName: user.name,
      subject: 'Bienvenue sur Mon API SaaS !',
      body: 'Bonjour {{userName}}, merci de vous être inscrit sur notre plateforme !'
    });

    console.log(`Job d'email ajouté pour ${user.email}`);

    const { password: _, __v, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword;
  };

  const login = async ({ email, password }) => {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return null;
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return token;
  };

  module.exports = { register, login };
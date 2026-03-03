/**
 * Script de seed : crée un utilisateur admin si aucun n'existe.
 * Usage: node scripts/seed-admin.js
 * Variables d'environnement optionnelles: ADMIN_EMAIL, ADMIN_PASSWORD (sinon valeurs par défaut)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../src/models/user.model');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@mon-api.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Admin';

async function seedAdmin() {
  const uri = process.env.MONGO_URI || process.env.MONGO_URI_TEST;
  if (!uri) {
    console.error('Erreur: MONGO_URI ou MONGO_URI_TEST doit être défini dans .env');
    process.exit(1);
  }

  await mongoose.connect(uri);

  const existingAdmin = await User.findOne({ role: 'admin' }).select('email');
  if (existingAdmin) {
    console.log(`Un admin existe déjà: ${existingAdmin.email}`);
    await mongoose.disconnect();
    process.exit(0);
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

  await User.create({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    password: hashedPassword,
    role: 'admin',
  });

  console.log(`Admin créé: ${ADMIN_EMAIL}`);
  console.log('Mot de passe:', ADMIN_PASSWORD);
  await mongoose.disconnect();
  process.exit(0);
}

seedAdmin().catch((e) => {
  console.error(e);
  process.exit(1);
});

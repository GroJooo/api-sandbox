  const express = require('express');
  const router = express.Router();
  const authController = require('../controllers/auth.controller');

  /**
   * @swagger
   * /auth/register:
   *   post:
   *     summary: Creer un compte utilisateur
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - name
   *               - email
   *               - password
   *             properties:
   *               name:
   *                 type: string
   *                 example: Jean Dupont
   *               email:
   *                 type: string
   *                 example: jean@test.com
   *               password:
   *                 type: string
   *                 example: secret123
   *     responses:
   *       201:
   *         description: Utilisateur cree avec succes
   *       400:
   *         description: Donnees invalides ou email deja existant
   */
  router.post('/register', authController.register);

  /**
   * @swagger
   * /auth/login:
   *   post:
   *     summary: S authentifier avec un compte
   *     tags: [Auth]
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             required:
   *               - email
   *               - password
   *             properties:
   *               email:
   *                 type: string
   *                 example: jean@test.com
   *               password:
   *                 type: string
   *                 example: secret123
   *     responses:
   *       200:
   *         description: Authentification reussie
   *       401:
   *         description: Email ou mot de passe incorrect
   */
  router.post('/login', authController.login);

  module.exports = router;

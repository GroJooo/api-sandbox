const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Vérifier l'état de la connexion à Mongo
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Serveur connecté
 */
router.get('/health', healthController.check);


module.exports = router;
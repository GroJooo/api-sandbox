const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const authoriseMiddleware = require('../middlewares/authorize.middleware');

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Créer un utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
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
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *     responses:
 *       201:
 *         description: Utilisateur créé
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                    type: object
 *                    properties:
 *                      name:
 *                        type: string
 *                        example: Jean Dupont
 *                      email:
 *                        type: string
 *                        example: jean@test.com
 *                      role:
 *                        type: string
 *                        enum: [user, admin]
 *                        example: user
 */
router.post('/', authMiddleware, userController.create);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Récupérer la liste des utilisateurs paginée
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numero de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre de resultats par page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Champ de tri (prefixer par - pour decroissant)
 *     responses:
 *       200:
 *         description: Liste des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 3
 *                 total:
 *                   type: integer
 *                   example: 6
 *                 page:
 *                   type: integer
 *                   example: 2
 *                 totalPages:
 *                   type: integer
 *                   example: 6
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                        name:
 *                            type: string
 *                            example: Jean Dupont
 *                        email:
 *                            type: string
 *                            example: jean@test.com
 *                        role:
 *                            type: string
 *                            enum: [user, admin]
 *                            example: user
 */

router.get('/', authMiddleware, userController.list);

/**
 * @swagger
 * /users/stats:
 *   get:
 *     summary: Récupérer les statistiques des utilisateurs
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistiques des utilisateurs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: user
 *                       count:
 *                         type: integer
 *                         example: 3
 *       403:
 *         description: Accès interdit
 *       401:
 *         description: Non authentifié
 */
router.get('/stats', authMiddleware, authoriseMiddleware('admin'), userController.stats);
/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Récupérer un utilisateur via son identifiant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l utilisateur
 *     responses:
 *       200:
 *         description: Utilisateur sélectionné
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                  type: object
 *                  properties:
 *                    name:
 *                      type: string
 *                      example: Jean Dupont
 *                    email:
 *                      type: string
 *                      example: jean@test.com
 *                    role:
 *                      type: string
 *                      enum: [user, admin]
 *                      example: user
 *       404:
 *         description: Utilisateur non trouvé
 */
router.get('/:id', authMiddleware, userController.getById);

/**
 * @swagger
 * /users/{id}:
 *   patch:
 *     summary: Modifier un utilisateur via son identifiant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l utilisateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Jean Dupont
 *               email:
 *                 type: string
 *                 example: jean@test.com
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *     responses:
 *       200:
 *         description: Utilisateur modifié
 *       404:
 *         description: Utilisateur non trouvé
 */
router.patch('/:id', authMiddleware, userController.update);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Supprimer un utilisateur via son identifiant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l utilisateur
 *     responses:
 *       204:
 *         description: Utilisateur supprimé
 *       403:
 *         description: Accès interdit
 *       404:
 *         description: Utilisateur non trouvé
 */
router.delete('/:id', authMiddleware, authoriseMiddleware('admin'), userController.remove);

module.exports = router;
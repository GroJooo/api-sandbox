/**
 * ÉTAPE 1 : Le Serveur Minimal
 * Objectif : Vérifier que Node.js et Express fonctionnent.
 */

const MAX_PAGE_LIMIT = Number(process.env.MAX_PAGE_LIMIT) || 100;
const DEFAULT_PAGE = Number(process.env.DEFAULT_PAGE) || 1;
const DEFAULT_LIMIT = Number(process.env.DEFAULT_LIMIT) || 10;

const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Configuration Swagger
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mon API SaaS',
      version: '1.0.0',
      description: 'API REST de gestion des utilisateurs'
    },
    components: {
      securityDefinitions: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./index.js']
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);

// --- 1. VALIDATION DE L'ENVIRONNEMENT ---
// Un bon EM s'assure que l'app ne démarre pas si la config est incomplète.
const REQUIRED_ENV = ['MONGO_URI', 'DB_USER', 'DB_PASSWORD'];
const missingEnv = REQUIRED_ENV.filter(key => !process.env[key] && !process.env.MONGO_URI);

if (missingEnv.length > 0 && process.env.NODE_ENV === 'production') {
  console.error(`ERREUR : Variables d'environnement manquantes : ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();
app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));


const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ma_db_saas';

// Masquage du mot de passe dans les logs de démarrage
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

// --- 2. SCHEMA AVEC VALIDATION STRICTE ---
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Le nom est obligatoire"],
    trim: true,
    minlength: [2, "Le nom doit contenir au moins 2 caracteres"]
  },
  email: {
    type: String,
    required: [true, "L'email est obligatoire"],
    unique: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Veuillez remplir un email valide']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  password: {
    type: String,
    required: [true, "Le mot de passe est obligatoire"],
    minlength: [6, "Le mot de passe doit contenir au moins 6 caracteres"],
    select: false
  }
});

const User = mongoose.model('User', userSchema);

// --- 3. ROUTES AUTHENTIFICATION ---
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
app.post('/auth/register', async (req, res) => {
  // 1. Hasher le mot de passe avant de sauvegarder
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(req.body.password, salt);

  // 2. Créer l'utilisateur avec le mot de passe hashé
  const user = new User({
    ...req.body,
    password: hashedPassword
  });
  const savedUser = await user.save();

  // 3. Renvoyer l'utilisateur SANS le mot de passe
  const { password, ...userWithoutPassword } = savedUser.toObject();
  res.status(201).json({ success: true, data: userWithoutPassword });
});


/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: S'authentifier avec un compte
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: mail ou mot de passe incorrect
 */
app.post('/auth/login', async (req, res) => {
  // 1. Trouver l'utilisateur par email (en incluant le password)
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  // 2. Comparer le mot de passe envoyé avec le hash en base
  const isMatch = await bcrypt.compare(req.body.password, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Email ou mot de passe incorrect" });
  }

  // 3. Générer un JWT
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  res.json({ success: true, token });
});

// --- 4. MIDDLEWARE AUTORISATION ---
const authMiddleware = async (req, res, next) => {
  // 1. Récupérer le header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Token manquant" });
  }

  // 2. Extraire le token (après "Bearer ")
  const token = authHeader.split(' ')[1];

  // 3. Vérifier et décoder le token
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token invalide ou expire" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Acces interdit" });
    }
    next();
  };
};

// --- 5. ROUTES ---

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
app.post('/users', authMiddleware, async (req, res) => {
  const newUser = new User(req.body);
  const savedUser = await newUser.save();
  res.status(201).json({
    success: true,
    data: savedUser
  });
});

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

app.get('/users', authMiddleware, async (req, res) => {
  const page = Math.max(1, Number(req.query.page) || DEFAULT_PAGE);
  const limit = Math.min(MAX_PAGE_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT));
  const sort = req.query.sort || '-createdAt'; // Par défaut : les plus récents d'abord
  const [total, users] = await Promise.all([
    User.countDocuments(),
    User.find()
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select('-__v')
  ]);
  res.json({
    success: true,
    count: users.length,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    data: users
  });
});

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
app.get('/users/:id', authMiddleware, async (req, res) => {
  const user = await User.findById(req.params.id).select('-__v');
  if (!user) {
    return res.status(404).json({ success: false, error: "Utilisateur non trouve" });
  }
  res.json({ success: true, data: user });
});

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
app.patch('/users/:id', authMiddleware, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,           // Renvoie le document modifie (pas l'ancien)
    runValidators: true  // Applique les validations du schema sur les champs modifies
  }).select('-__v');
  if (!user) {
    return res.status(404).json({ success: false, error: "Utilisateur non trouve" });
  }
  res.json({ success: true, data: user });
});

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
app.delete('/users/:id', authMiddleware, authorize('admin'), async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, error: "Utilisateur non trouve" });
  }
  res.status(204).send();
});

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
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});


// --- 6. MIDDLEWARE GLOBAL DE GESTION D'ERREURS ---
app.use((err, req, res, next) => {
  console.error(`Error Log: ${err.message}`);

  // Erreur de duplication MongoDB (ex: email deja pris)
  if (err.code === 11000) {
    return res.status(400).json({ error: "Cette ressource existe deja (Duplication)." });
  }

  // Erreur de validation Mongoose
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ error: "Donnees invalides", details: messages });
  }

  // Erreur generique
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? "Une erreur interne est survenue"
      : err.message
  });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur en ecoute sur le port ${PORT}`);
  });
}

module.exports = app;
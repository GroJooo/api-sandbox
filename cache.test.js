  require('dotenv').config();
  if (process.env.MONGO_URI_TEST) {
      process.env.MONGO_URI = process.env.MONGO_URI_TEST;
  }
  if (process.env.REDIS_URL_TEST) {
      process.env.REDIS_URL = process.env.REDIS_URL_TEST;
  }
  // Redis de test (utilise la même instance Redis)
  // En production, on utiliserait une instance Redis séparée

  const request = require('supertest');
  const mongoose = require('mongoose');
  const app = require('./src/app');
  const { getRedisClient } = require('./src/config/redis');
  const User = require('./src/models/user.model');
  const bcrypt = require('bcryptjs');

  let token;
  let testUserId;

  // Nettoyage avant chaque test
  beforeEach(async () => {
      // Nettoyer MongoDB
      await mongoose.connection.collection('users').deleteMany({});

      // Nettoyer Redis (flush toutes les clés de test)
      try {
          const redis = getRedisClient();
          await redis.flushdb();
      } catch (err) {
          console.log('Redis non disponible pour les tests');
      }

    // Créer un admin DIRECTEMENT en base (bypass le register)
    const hashedPassword = await bcrypt.hash('secret123', 10);
    const adminUser = await User.create({
        name: 'Admin Test',
        email: 'admin@test.com',
        password: hashedPassword,
        role: 'admin'
    });

    testUserId = adminUser._id.toString();

      // Se connecter pour obtenir un token
      const loginRes = await request(app)
          .post('/auth/login')
          .send({
              email: 'admin@test.com',
              password: 'secret123'
          });

      token = loginRes.body.token;
  });

  // Fermeture après tous les tests
  afterAll(async () => {
      await mongoose.connection.close();
      try {
          const redis = getRedisClient();
          await redis.quit();
      } catch (err) {
          // Redis déjà fermé
      }
  });

  describe('Cache Redis - GET /users (liste)', () => {
      it('doit mettre en cache la liste d\'utilisateurs', async () => {
          // Premier appel : cache miss
          const res1 = await request(app)
              .get('/users?page=1&limit=10')
              .set('Authorization', `Bearer ${token}`);

          expect(res1.status).toBe(200);
          expect(res1.body.data).toBeDefined();

          // Vérifier que la clé existe dans Redis
          const redis = getRedisClient();
          const cached = await redis.get('users:list:page:1:limit:10:sort:-createdAt');
          expect(cached).not.toBeNull();

          // Deuxième appel : cache hit (même résultat, mais plus rapide)
          const res2 = await request(app)
              .get('/users?page=1&limit=10')
              .set('Authorization', `Bearer ${token}`);

          expect(res2.status).toBe(200);
          expect(res2.body).toEqual(res1.body);
      });
  });

  describe('Cache Redis - GET /users/:id (individuel)', () => {
      it('doit mettre en cache un utilisateur individuel', async () => {
          // Premier appel : cache miss
          const res1 = await request(app)
              .get(`/users/${testUserId}`)
              .set('Authorization', `Bearer ${token}`);

          expect(res1.status).toBe(200);
          expect(res1.body.data._id).toBe(testUserId);

          // Vérifier que la clé existe dans Redis
          const redis = getRedisClient();
          const cached = await redis.get(`users:id:${testUserId}`);
          expect(cached).not.toBeNull();

          // Deuxième appel : cache hit
          const res2 = await request(app)
              .get(`/users/${testUserId}`)
              .set('Authorization', `Bearer ${token}`);

          expect(res2.status).toBe(200);
          expect(res2.body).toEqual(res1.body);
      });
  });

  describe('Invalidation du cache - POST /users (create)', () => {
      it('doit invalider le cache de liste après création', async () => {
          // Mettre en cache la liste
          await request(app)
              .get('/users?page=1&limit=10')
              .set('Authorization', `Bearer ${token}`);

          const redis = getRedisClient();
          let cached = await redis.get('users:list:page:1:limit:10:sort:-createdAt');
          expect(cached).not.toBeNull();

          // Créer un utilisateur
          await request(app)
              .post('/users')
              .set('Authorization', `Bearer ${token}`)
              .send({
                  name: 'New User',
                  email: 'new@test.com',
                  password: 'secret123'
              });

          // Le cache doit être invalidé
          cached = await redis.get('users:list:page:1:limit:10:sort:-createdAt');
          expect(cached).toBeNull();
      });
  });

  describe('Invalidation du cache - PUT /users/:id (update)', () => {
      it('doit invalider le cache individuel et de liste après modification', async () => {
      // Mettre en cache le user et la liste
      await request(app)
          .get(`/users/${testUserId}`)
          .set('Authorization', `Bearer ${token}`);

      await request(app)
          .get('/users?page=1&limit=10')
          .set('Authorization', `Bearer ${token}`);

      const redis = getRedisClient();
      let cachedUser = await redis.get(`users:id:${testUserId}`);
      let cachedList = await redis.get('users:list:page:1:limit:10:sort:-createdAt');


      expect(cachedUser).not.toBeNull();
      expect(cachedList).not.toBeNull();

      // Modifier le user
      const updateRes = await request(app)  // ← MODIFIÉ
          .patch(`/users/${testUserId}`)
          .set('Authorization', `Bearer ${token}`)
          .send({ name: 'Modified Name' });


      // Attendre un peu pour laisser l'invalidation se terminer  // ← AJOUTÉ

      // Les caches doivent être invalidés
      cachedUser = await redis.get(`users:id:${testUserId}`);
      cachedList = await redis.get('users:list:page:1:limit:10:sort:-createdAt');


      expect(cachedUser).toBeNull();
      expect(cachedList).toBeNull();
    });
  });

  describe('Invalidation du cache - DELETE /users/:id (remove)', () => {
      it('doit invalider le cache individuel et de liste après suppression', async () => {
          // Mettre en cache le user et la liste
          await request(app)
              .get(`/users/${testUserId}`)
              .set('Authorization', `Bearer ${token}`);

          await request(app)
              .get('/users?page=1&limit=10')
              .set('Authorization', `Bearer ${token}`);

          const redis = getRedisClient();
          let cachedUser = await redis.get(`users:id:${testUserId}`);
          let cachedList = await redis.get('users:list:page:1:limit:10:sort:-createdAt');

          expect(cachedUser).not.toBeNull();
          expect(cachedList).not.toBeNull();

          // Supprimer le user
          await request(app)
              .delete(`/users/${testUserId}`)
              .set('Authorization', `Bearer ${token}`);

          // Les caches doivent être invalidés
          cachedUser = await redis.get(`users:id:${testUserId}`);
          cachedList = await redis.get('users:list:page:1:limit:10:sort:-createdAt');

          expect(cachedUser).toBeNull();
          expect(cachedList).toBeNull();
      });
  });
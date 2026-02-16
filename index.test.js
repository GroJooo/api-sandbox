  require('dotenv').config();
  if (process.env.MONGO_URI_TEST) {
      process.env.MONGO_URI = process.env.MONGO_URI_TEST;
  }
  
  const request = require('supertest');
  const mongoose = require('mongoose');
  const app = require('./src/app');

  // Nettoyage de la base avant chaque test
  beforeEach(async () => {
      await mongoose.connection.collection('users').deleteMany({});
  });

  // Fermeture de la connexion après tous les tests
  afterAll(async () => {
      await mongoose.connection.close();
  });

  describe('GET /health', () => {
      it('doit renvoyer status OK', async () => {
          const res = await request(app).get('/health');
          expect(res.status).toBe(200);
          expect(res.body.status).toBe('OK');
      });
  });

  describe('POST /auth/register', () => {
      it('doit creer un utilisateur', async () => {
          const res = await request(app)
              .post('/auth/register')
              .send({
                  name: 'Test User',
                  email: 'test@test.com',
                  password: 'secret123'
              });
          expect(res.status).toBe(201);
          expect(res.body.data.name).toBe('Test User');
          expect(res.body.data.password).toBeUndefined();
      });

      it('doit refuser un email invalide', async () => {
          const res = await request(app)
              .post('/auth/register')
              .send({
                  name: 'Test',
                  email: 'pas-un-email',
                  password: 'secret123'
              });
          expect(res.status).toBe(400);
      });
  });

  describe('POST /auth/login', () => {
      beforeEach(async () => {
          await request(app)
              .post('/auth/register')
              .send({
                  name: 'Login User',
                  email: 'login@test.com',
                  password: 'secret123'
              });
      });

      it('doit renvoyer un token', async () => {
          const res = await request(app)
              .post('/auth/login')
              .send({ email: 'login@test.com', password: 'secret123' });
          expect(res.status).toBe(200);
          expect(res.body.token).toBeDefined();
      });

      it('doit refuser un mauvais mot de passe', async () => {
          const res = await request(app)
              .post('/auth/login')
              .send({ email: 'login@test.com', password: 'mauvais' });
          expect(res.status).toBe(401);
      });
  });

  describe('Routes protegees', () => {
      let token;

      beforeEach(async () => {
          await request(app)
              .post('/auth/register')
              .send({
                  name: 'Auth User',
                  email: 'auth@test.com',
                  password: 'secret123'
              });
          const login = await request(app)
              .post('/auth/login')
              .send({ email: 'auth@test.com', password: 'secret123' });
          token = login.body.token;
      });

      it('doit refuser sans token', async () => {
          const res = await request(app).get('/users');
          expect(res.status).toBe(401);
      });

      it('doit lister les utilisateurs avec token', async () => {
          const res = await request(app)
              .get('/users')
              .set('Authorization', `Bearer ${token}`);
          expect(res.status).toBe(200);
          expect(res.body.data).toBeInstanceOf(Array);
      });

      it('doit refuser le DELETE pour un user non-admin', async () => {
          const res = await request(app)
              .delete('/users/000000000000000000000000')
              .set('Authorization', `Bearer ${token}`);
          expect(res.status).toBe(403);
      });
  });
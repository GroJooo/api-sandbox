# Formation EM - Progression détaillée

## Programme Confluence
Fichier prêt à coller: `C:\Users\javril\formation-em-programme.md`

## Module 1 — Fondations Techniques (TERMINÉ)

### Étape 1.1 - Express & Node.js ✅
- Express minimaliste, tout est middleware, config par env

### Étape 1.2 - Mongoose & Modélisation ✅
- Mongoose vs MongoDB, setters à l'écriture, select: false

### Étape 1.3 - API REST CRUD ✅
- GET/POST/PUT/PATCH/DELETE, codes HTTP, runValidators: true

### Étape 1.4 - Gestion d'erreurs ✅
- Error handler 4 args, Express 5 gère async nativement (asyncHandler supprimé)

### Étape 1.5 - Docker & Compose ✅
- Cache layers, healthcheck MongoDB, volumes nommés, --omit=dev

### Étape 1.6 - Pagination ✅
- skip/limit, Math.max/min, Promise.all, config externalisée (.env)

### Étape 1.7 - Auth & JWT ✅
- bcrypt + JWT, authMiddleware + authorize, select: false sur password
- Chaînage middlewares: app.delete('/users/:id', authMiddleware, authorize('admin'), handler)

### Étape 1.8 - Tests automatisés ✅
- Jest + supertest, base de test séparée (ma_db_saas_test)
- dotenv + MONGO_URI_TEST, beforeEach vide la base, isolation des tests

### Étape 1.9 - CI/CD Pipeline ✅
- GitHub Actions: .github/workflows/ci.yml
- Condition `if (process.env.MONGO_URI_TEST)` pour compatibilité locale/CI

### Étape 1.10 - Documentation API ✅
- swagger-jsdoc + swagger-ui-express
- Route /api-docs, toutes les routes documentées
- Indentation YAML stricte (source fréquente d'erreurs)

## Module 2 — Architecture & Scalabilité (EN COURS)

### Étape 2.1 - Monolithe vs Microservices ✅
- Start with a monolith, monolithe modulaire = meilleur compromis
- Microservices: résilience + scalabilité ciblée, mais complexité opérationnelle + cohérence distribuée
- Saga pattern, event-driven, retry + backoff
- Monorepo vs multirepo: concepts différents mais complémentaires

### Étape 2.2 - Design Patterns Backend ✅
- Pattern Controller → Service → Repository
- Controller = HTTP, Service = logique métier, Repository = accès données
- DTO = contrats inter-couches (input/output)
- Refactoring complet du monolithe en monolithe modulaire réalisé
- Structure: src/{config,models,repositories,services,controllers,middlewares,routes}/
- Tests passent toujours après refactoring
### Étape 2.3 - Stratégies de Cache ✅ TERMINÉ
- QCM de révision Modules 1-2 : 15/15 ✅
- Diagnostic + Théorie complète : ✅
  - Cache applicatif (Redis), Cache HTTP, CDN
  - Pattern Cache-Aside, TTL, invalidation manuelle
  - Structure des clés, stratégies d'éviction
- Pratique - Intégration Redis dans mon-api : ✅
  - Redis ajouté à Docker Compose (redis:7-alpine)
  - Client ioredis installé et configuré
  - Cache sur GET /users (liste) et GET /users/:id (individuel)
  - Invalidation sur POST/PATCH/DELETE
  - TTL 300s, résilience (fallback sur DB si Redis down)
- Tests automatisés du cache : ✅
  - 5 tests Jest (cache hit/miss, invalidation)
  - Admin créé en base (sécurité : register n'accepte pas role: 'admin')
  - Tous les tests passent
- **Leçons importantes** :
  - Performance : cache hit 10-100x plus rapide que DB
  - Sécurité : les admins ne peuvent PAS être créés via /auth/register (bonne pratique)
  - Invalidation = un des problèmes les plus difficiles en architecture
### Étape 2.4 - Files de messages & Asynchrone ✅ TERMINÉ
- Diagnostic + Théorie complète : ✅
  - async/await vs arrière-plan (découplage API/worker)
  - Bull vs RabbitMQ vs Kafka (choix selon use case)
  - Patterns Producer/Consumer, Pub/Sub
  - Retry + exponential backoff, DLQ, idempotence
- Pratique - BullMQ intégré dans mon-api : ✅
  - BullMQ installé (version moderne de Bull)
  - Queue "email" créée avec retry (3 tentatives, backoff exponentiel)
  - Worker email.worker.js traite les jobs en arrière-plan
  - Producer dans auth.service.register() ajoute job à l'inscription
  - Configuration Redis adaptée (noeviction pour BullMQ)
- Bull Board - Monitoring visuel : ✅
  - Interface web /admin/queues
  - Visualisation des jobs (completed, failed, waiting, active)
  - removeOnComplete: {count: 100, age: 3600}
- Migration Bull → BullMQ : ✅
  - Syntaxe queue.add('job-name', data) au lieu de queue.add(data)
  - Worker séparé avec new Worker() au lieu de queue.process()
  - Debug erreurs Lua Redis (types de données, configuration)
- **Leçons importantes** :
  - async/await ≠ arrière-plan (requête attend toujours vs réponse immédiate)
  - Files = découplage + résilience + scalabilité + rate limiting
  - BullMQ nécessite Redis avec politique noeviction
  - Monitoring essentiel pour comprendre l'état des jobs
### Étape 2.5 - Bases de données avancées ✅ TERMINÉ
- Diagnostic complété : ✅
- Pratique — 3 exercices réalisés :
  - Exercice 1 : Indexation (index sur createdAt, index composé email+createdAt, vérification avec explain) ✅
  - Exercice 2 : Agrégation (GET /users/stats, pipeline $group + $sort par rôle) ✅
  - Exercice 3 : Transfert de points (POST /users/transfer sans transaction ; MongoDB en standalone, pas de replica set)
- Validation des acquis (5 questions) : ✅
- **Essentiels à retenir** :
  - Index : accès plus rapide ; COLLSCAN = scan complet (coûteux), IXSCAN = utilisation d’un index ; vérifier avec explain('executionStats').
  - Index composé pour filtre + tri (ex. email + createdAt).
  - Agrégation : $group, $sort, pipelines pour stats/rapports.
  - Transactions multi-documents = replica set requis ; avec auth sur le replica set, keyfile obligatoire pour l’auth entre nœuds.
  - Sans transaction : risque d’incohérence si crash entre deux updates (débité mais pas crédité).
### Étape 2.6 - Sécurité applicative → À FAIRE

## Modules 3-5 → À FAIRE
- Module 3: Excellence Opérationnelle
- Module 4: Leadership & Posture EM
- Module 5: Méthodologie & Processus

## Points forts détectés
- Docker (volumes, Compose)
- MongoDB (unicité, codes d'erreur)
- Principes REST, config par env
- Raisonnement EM (taille équipe, trade-offs)

## Points faibles détectés (révisés au Module 1)
- Express internals (parsing, error handlers) → corrigé
- Mongoose vs MongoDB (setters, __v) → corrigé
- Async/await dans Express → corrigé
- Docker cache layers, depends_on vs readiness → corrigé
- Indentation YAML (Swagger) → en amélioration

## Fichiers utiles
- Code API: WSL `/home/user/mon-api/index.js`
- Tests: WSL `/home/user/mon-api/index.test.js`
- Requests HTTP: WSL `/home/user/mon-api/requests.http`
- Docker Compose: WSL `/home/user/mon-api/docker-compose.yml`
- CI: WSL `/home/user/mon-api/.github/workflows/ci.yml`
- Programme (copie Windows): `C:\Users\javril\formation-em-programme.md`

# Schéma d’architecture – Monolithe modulaire (mon-api)

## Vue d’ensemble

```
                    ┌─────────────────────────────────────────────────────────┐
                    │                    DOCKER COMPOSE                        │
                    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
                    │  │   mon-api   │  │  db-saas    │  │  redis-cache    │  │
                    │  │ (Node:3000) │  │(Mongo:27017)│  │ (Redis:6379)    │  │
                    │  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘  │
                    │         │                 │                  │           │
                    │         └─────────────────┼──────────────────┘           │
                    │                           │  saas-network                 │
                    └───────────────────────────┼───────────────────────────────┘
                                                │
```

## Couches de l’application (mon-api)

```
  Requête HTTP
       │
       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  EXPRESS (app.js)                                                       │
  │  • express.json()                                                       │
  │  • Bull Board (/admin/queues)                                           │
  │  • Swagger (/api-docs)                                                  │
  │  • mountRoutes() → /auth, /users, '' (health)                          │
  │  • errorHandler (middleware global)                                      │
  └────────────────────────────────────────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  ROUTES (src/routes/)                                                   │
  │  • auth.routes    → POST /auth/register, POST /auth/login               │
  │  • user.routes   → POST /users, GET /users, GET /users/:id,             │
  │                     PATCH /users/:id, DELETE /users/:id [, GET /stats]  │
  │  • health.routes → GET / (health check)                                 │
  │  Middlewares : authMiddleware (JWT), authorize('admin')                 │
  └────────────────────────────────────────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  CONTROLLERS (src/controllers/)                                         │
  │  • auth.controller  → create (register), login                         │
  │  • user.controller → create, list, getById, update, remove [, stats]    │
  │  • health.controller                                                    │
  │  Rôle : HTTP (req/res), validation minimale, appel service               │
  └────────────────────────────────────────────────────────────────────────┘
       │
       ▼
  ┌────────────────────────────────────────────────────────────────────────┐
  │  SERVICES (src/services/)                                               │
  │  • auth.service  → logique inscription / login, JWT, bcrypt             │
  │  • user.service  → logique métier, pagination, cache Redis (list/id),   │
  │                    invalidation cache, [stats agrégation]                │
  │  Rôle : logique métier, orchestration repository + cache                │
  └────────────────────────────────────────────────────────────────────────┘
       │
       ├──────────────────────────────────┬──────────────────────────────────┐
       ▼                                  ▼                                  ▼
  ┌─────────────────┐          ┌─────────────────┐          ┌─────────────────┐
  │  REPOSITORIES   │          │  CACHE REDIS     │          │  QUEUE BULLMQ    │
  │ (user.repository)│          │ (config/redis)   │          │ (config/queue)  │
  │  • CRUD User    │          │  • users:list:*  │          │  • email queue   │
  │  • getStats     │          │  • users:id:*    │          │  • worker        │
  └────────┬────────┘          └─────────────────┘          └────────┬────────┘
           │                                                          │
           ▼                                                          ▼
  ┌─────────────────┐                                      ┌─────────────────┐
  │  MODELS         │                                      │  WORKERS         │
  │ (user.model)    │                                      │ (email.worker)   │
  │  Mongoose       │                                      │  Jobs en async   │
  └────────┬────────┘                                      └─────────────────┘
           │
           ▼
  ┌─────────────────┐
  │  MONGODB        │
  │  (db-saas)      │
  └─────────────────┘
```

## Flux typique : GET /users (liste paginée)

```
  Client
    │  GET /users?page=1&limit=10
    ▼
  user.routes  →  authMiddleware  →  user.controller.list(req, res)
    │
    ▼
  user.service.getAll(query)
    │
    ├─► Redis : GET users:list:1:10:-createdAt  →  si hit, retour cache
    │
    └─► si miss :
          user.repository.findAll({ page, limit, sort })
            │
            ▼
          MongoDB (User.find().sort().skip().limit())  →  documents
            │
            ▼
          user.service : Redis SET users:list:1:10:-createdAt (TTL 300)
            │
            ▼
          retour au controller  →  res.json({ success, count, total, page, totalPages, data })
```

## Flux typique : GET /users/stats (agrégation)

```
  Client
    │  GET /users/stats  (+ Authorization)
    ▼
  user.routes  →  authMiddleware  →  user.controller.stats(req, res)
    │
    ▼
  user.service.getStats()
    │
    ▼
  user.repository.getStats()
    │
    ▼
  User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ])
    │
    ▼
  res.json({ success: true, data: [ { _id: 'user', count: n }, { _id: 'admin', count: m } ] })
```

## Dépendances externes (démarrage)

```
  app.js / index.js
    │
    ├─► validateEnv()           →  .env (PORT, MONGO_URI, REDIS_URL, JWT_SECRET, etc.)
    ├─► connectDB()            →  MongoDB (Mongoose)
    ├─► connectRedis()         →  Redis (ioredis)
    ├─► require(workers)       →  BullMQ worker (écoute queue email)
    └─► app.listen(PORT)       →  HTTP sur 3000
```

## Fichiers clés par couche

| Couche        | Fichiers |
|---------------|----------|
| Entrée        | `index.js`, `src/app.js` |
| Config        | `src/config/environment.js`, `database.js`, `redis.js`, `queue.js`, `swagger.js` |
| Routes        | `src/routes/index.js`, `auth.routes.js`, `user.routes.js`, `health.routes.js` |
| Middlewares   | `auth.middleware.js`, `authorize.middleware.js`, `error.middleware.js` |
| Controllers   | `auth.controller.js`, `user.controller.js`, `health.controller.js` |
| Services     | `auth.service.js`, `user.service.js` |
| Repositories  | `user.repository.js` |
| Models        | `user.model.js` |
| Workers       | `src/workers/email.worker.js` |

---

*Document généré pour illustrer l’architecture du monolithe modulaire (formation EM – Module 2).*

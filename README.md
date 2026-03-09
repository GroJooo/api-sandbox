# api-sandbox

API REST Node.js de gestion d'utilisateurs : auth JWT, CRUD, cache Redis, files d'attente BullMQ et documentation Swagger.

## Fonctionnalités

- **Auth** : inscription (`POST /auth/register`), connexion (`POST /auth/login`), JWT, rôles `user` / `admin`
- **Utilisateurs** : CRUD avec pagination, `GET /users/stats` (agrégation par rôle), `POST /users/transfer` (transfert de points)
- **Cache** : Redis sur la liste et le détail utilisateur, invalidation à l'écriture, TTL 5 min
- **Asynchrone** : BullMQ (queue email au register), Bull Board sur `/admin/queues`
- **Documentation** : Swagger UI sur `/api-docs`

## Stack

Node.js, Express 5, Mongoose, MongoDB, Redis (ioredis), BullMQ, JWT, bcrypt, swagger-jsdoc, swagger-ui-express.

## Prérequis

Node.js (LTS), Docker ou Podman.

## Démarrage

1. Cloner le dépôt et aller dans le dossier du projet.
2. Créer un fichier `.env` à la racine (voir **Variables d'environnement** ci-dessous).
3. Installer les dépendances et lancer les services :

```bash
npm install
docker compose up -d
# ou : podman compose up -d
```

1. (Optionnel) Créer un utilisateur admin de test : `npm run seed:admin`
2. API : `http://localhost:3000` — Swagger : `http://localhost:3000/api-docs` — Bull Board : `http://localhost:3000/admin/queues`

## Scripts


| Commande             | Description                                          |
| -------------------- | ---------------------------------------------------- |
| `npm test`           | Lance les tests Jest                                 |
| `npm run seed:admin` | Crée un utilisateur admin en base                    |
| `npm run deployapi`  | Rebuild + redémarrage du conteneur API (Podman)      |
| `npm run deployall`  | Rebuild de tous les services et redémarrage (Podman) |


## Architecture

Monolithe modulaire : **Controller → Service → Repository**, avec cache Redis et queue BullMQ. Schéma détaillé et flux de données :

→ [Architecture du monolithe modulaire](docs/architecture-monolithe-modulaire.md)

## Variables d'environnement


| Variable                         | Description                             |
| -------------------------------- | --------------------------------------- |
| `PORT`                           | Port du serveur (défaut 3000)           |
| `NODE_ENV`                       | `development` / `production`            |
| `MONGO_URI`                      | URI de connexion MongoDB                |
| `MONGO_URI_TEST`                 | URI MongoDB pour les tests              |
| `REDIS_URL`                      | URL Redis (cache + BullMQ)              |
| `REDIS_URL_TEST`                 | URL Redis pour les tests                |
| `JWT_SECRET`                     | Secret pour la signature des tokens JWT |
| `DB_USER`                        | Utilisateur MongoDB (admin)             |
| `DB_PASSWORD`                    | Mot de passe MongoDB                    |
| `DB_NAME`                        | Nom de la base                          |
| `MAX_PAGE_LIMIT`                 | Limite max de pagination (ex. 100)      |
| `DEFAULT_PAGE` / `DEFAULT_LIMIT` | Valeurs par défaut de pagination        |


Avec Docker Compose, `MONGO_URI` et `REDIS_URL` pointent vers les services du réseau interne (`db-service`, `redis-service`). En local sans conteneurs, utiliser `localhost`.

## Contexte / Formation

Ce dépôt sert de **sandbox** pour valider des motifs d'architecture (cache, files d'attente, bases de données avancées) et rester hands-on sur la résilience et la scalabilité. Il accompagne une formation type EM (architecture, monolithe modulaire, Redis, BullMQ, MongoDB) guidée via Cursor. La progression est suivie dans [docs/formation-em-details.md](docs/formation-em-details.md).
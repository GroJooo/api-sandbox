#!/bin/sh
# Initialise le replica set MongoDB (requis une fois après le premier démarrage des conteneurs).
# Les transactions (ex. transfert de points) ne fonctionnent qu'avec un replica set.
CONTAINER="${MONGO_CONTAINER:-db-service}"
if command -v podman >/dev/null 2>&1; then
  podman exec "$CONTAINER" mongosh --eval "rs.initiate()"
elif command -v docker >/dev/null 2>&1; then
  docker exec "$CONTAINER" mongosh --eval "rs.initiate()"
else
  echo "Erreur: podman ou docker requis."
  exit 1
fi

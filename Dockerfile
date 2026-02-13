# 1. On part d'une image légère de Node.js (Linux Alpine)
FROM node:20-alpine

# 2. On définit le dossier de travail à l'intérieur du conteneur
WORKDIR /app

# 3. On copie les fichiers qui listent les dépendances
COPY package*.json ./

# 4. On installe les dépendances (dans le conteneur)
RUN npm install --omit=dev

# 5. On copie tout le reste de votre code
COPY . .

# 6. On expose le port sur lequel votre serveur écoute
EXPOSE 3000

# 7. La commande pour lancer l'application
CMD ["node", "index.js"]
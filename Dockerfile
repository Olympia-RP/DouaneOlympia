FROM node

# Créer un répertoire de travail
WORKDIR /app

# Copier les fichiers package.json et package-lock.json
COPY . .
# ajout les fichier persistance
VOLUME [ "blacklist.json" ]
# Installer les dépendances
RUN npm install

# Commande pour démarrer le bot
CMD ["node", "bot.js"]

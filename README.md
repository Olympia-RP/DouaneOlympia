# DouaneOlympia Bot

Ce bot Discord est conçu pour automatiser certaines tâches de gestion des rôles et de la blacklist sur un serveur Discord.

## Prérequis

- Node.js
- npm
 
## Installation

1. Clonez ce dépôt.
2. Installez les dépendances avec `npm install`.

```sh
git clone <url-du-dépôt>
cd DouaneOlympia
npm install
```

3. Créez un fichier `.env` en vous basant sur le fichier `.env.exemple` et remplissez les valeurs nécessaires.

```env
DISCORD_TOKEN=VotreTokenDiscord
GUILD_ID=VotreGuildID
CITIZEN_ROLE_ID=VotreCitizenRoleID
NOPAPER_ROLE_ID=VotreNoPaperRoleID
BLACKLIST_ROLE_ID=VotreBlacklistRoleID
EVENT_ROLE_ID=VotreEventRoleID
EVENT_LOG_CHANNEL_ID=VotreEventLogChannelID
WEBHOOK_CHANNEL_ID=VotreWebhookChannelID
LOG_CHANNELS=0000000000,0000000000
BLACKLIST_FILE=blacklist.json
```

## Utilisation

Lancez le bot avec la commande suivante :

```sh
node bot.js
```

## Commandes

- `!citizen open` : Active l'automatisation.
- `!citizen close` : Désactive l'automatisation.
- `!citizen status` : Affiche le statut de l'automatisation.
- `!citizen blacklist add <ID>` : Ajoute un membre à la blacklist.
- `!citizen blacklist del <ID>` : Supprime un membre de la blacklist.
- `!citizen blacklist show` : Affiche la liste des membres blacklistés.

## Fonctionnalités

- **Automatisation des rôles** : Attribue automatiquement le rôle "Citoyen" et retire le rôle "Sans Papier" aux membres mentionnés dans les messages webhook.
- **Gestion de la blacklist** : Ajoute ou retire des membres de la blacklist et empêche les membres blacklistés de recevoir certains rôles.
- **Logs** : Envoie des messages de log dans plusieurs canaux spécifiés.

## Arrêt du bot

Pour arrêter le bot proprement, utilisez `Ctrl+C` dans le terminal. Le bot se déconnectera proprement avant de quitter.

## Contribuer

Les contributions sont les bienvenues ! Veuillez soumettre une pull request ou ouvrir une issue pour discuter des changements que vous souhaitez apporter.

## Licence

Ce projet est sous licence MIT.
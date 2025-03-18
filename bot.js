require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Events } = require('discord.js');
const fs = require('fs');

// Chargement des variables d'environnement
const TOKEN = process.env.DISCORD_TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CITIZEN_ROLE_ID = process.env.CITIZEN_ROLE_ID;
const NOPAPER_ROLE_ID = process.env.NOPAPER_ROLE_ID;
const BLACKLIST_ROLE_ID = process.env.BLACKLIST_ROLE_ID;
const WEBHOOK_CHANNEL_ID = process.env.WEBHOOK_CHANNEL_ID;
const LOG_CHANNELS = process.env.LOG_CHANNELS.split(',').map(id => id.trim());
const BLACKLIST_FILE = './blacklist.json';

// Charger la blacklist et l'état de l'automatisation depuis le fichier
let data = { blacklist: [], automationEnabled: true };

if (fs.existsSync(BLACKLIST_FILE)) {
    try {
        data = JSON.parse(fs.readFileSync(BLACKLIST_FILE, 'utf-8'));
    } catch (error) {
        console.error("Erreur de lecture du fichier blacklist.json:", error);
    }
}

let blacklist = data.blacklist;
let automationEnabled = data.automationEnabled;

// Sauvegarde de la blacklist et de l'état de l'automatisation dans le fichier
function saveData() {
    const dataToSave = { blacklist, automationEnabled };
    fs.writeFileSync(BLACKLIST_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Channel]
});

client.once(Events.ClientReady, () => {
    console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
    const guild = client.guilds.cache.get(GUILD_ID);
    if (guild) console.log(`🔹 Connecté au serveur : ${guild.name} (ID: ${guild.id})`);
    else console.error("❌ Le bot ne peut pas accéder au serveur.");
});

// Fonction pour envoyer des logs dans plusieurs canaux
async function sendLogs(guild, message) {
    LOG_CHANNELS.forEach(async (channelId) => {
        const logChannel = guild.channels.cache.get(channelId);
        if (logChannel) await logChannel.send(message);
    });
}

// Commandes du bot
client.on(Events.MessageCreate, async (message) => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.split(' ').slice(3);
    
    // Activation/Désactivation de l'automatisation
    if (message.content.startsWith('!citizen open')) {
        automationEnabled = true;
        saveData();  // Sauvegarde du statut
        message.reply("✅ L'automatisation est maintenant **activée**.");
    }

    if (message.content.startsWith('!citizen close')) {
        automationEnabled = false;
        saveData();  // Sauvegarde du statut
        message.reply("❌ L'automatisation est maintenant **désactivée**.");
    }

    if (message.content.startsWith('!citizen status')) {
        message.reply(`ℹ️ Automatisation : **${automationEnabled ? "Activée ✅" : "Désactivée ❌"}**`);
    }

    // Ajout à la blacklist
    if (message.content.startsWith('!citizen blacklist add')) {
        let memberId = args.join(' ').trim();

        const memberMention = message.mentions.members.first();
        if (memberMention) memberId = memberMention.id;

        console.log(`ID fourni : '${memberId}'`);

        if (!/^\d{18}$/.test(memberId)) {
            console.log(`ID invalide détecté : ${memberId}`);
            return message.reply('Veuillez fournir un ID valide ou mentionner un membre.');
        }

        if (blacklist.includes(memberId)) return message.reply('Ce membre est déjà dans la blacklist.');

        blacklist.push(memberId);
        saveData();

        message.reply(`<@${memberId}> a été ajouté à la blacklist.`);
    }

    // Suppression de la blacklist
    if (message.content.startsWith('!citizen blacklist del')) {
        let member;

        if (message.mentions.members.size > 0) {
            member = message.mentions.members.first();
        } else if (args[0] && !isNaN(args[0])) {
            member = await message.guild.members.fetch(args[0]).catch(() => null);
        }

        if (!member) return message.reply('Veuillez mentionner un membre ou fournir un ID valide.');

        if (!blacklist.includes(member.id)) return message.reply(`${member.displayName} n'est pas dans la blacklist.`);

        blacklist = blacklist.filter(id => id !== member.id);
        saveData();
        await member.roles.remove(BLACKLIST_ROLE_ID);
        message.reply(`${member.displayName} a été retiré de la blacklist.`);
    }

    // Affichage de la blacklist
    if (message.content.startsWith('!citizen blacklist show')) {
        if (blacklist.length === 0) return message.reply('Il n\'y a aucun membre dans la blacklist.');

        const members = await Promise.all(blacklist.map(id => message.guild.members.fetch(id).catch(() => null)));
        const memberMentions = members.filter(member => member).map(member => `<@${member.id}>`).join(', ');

        message.reply(`Membres dans la blacklist : ${memberMentions}`);
    }
});

// Automatisation des rôles à partir du Webhook
client.on(Events.MessageCreate, async (message) => {
    if (message.channel.id !== WEBHOOK_CHANNEL_ID || !message.webhookId) return;

    // Vérifier si le message contient un ID Discord au format "🆔 ID Discord : 123456789012345678"
    const match = message.content.match(/🆔 ID Discord : `(\d{18})`/);
    if (!match) return;  // Si aucun ID valide n'est trouvé, on ne fait rien

    const userId = match[1];
    console.log(`🔎 Recherche du membre avec ID : ${userId}`);

    // Si l'automatisation est fermée
    if (!automationEnabled) {
        console.log(`❌ Automatisation fermée. Traitement par un douanier nécessaire.`);

        // Récupérer les rôles Douanier et Douanier Junior
        const roleStaff = message.guild.roles.cache.get('1219370948025782282'); // ID du rôle Douanier
        const roleDouanier = message.guild.roles.cache.get('1203901681910292568'); // ID du rôle Douanier
        const roleDouanierJunior = message.guild.roles.cache.get('1203901681910292567'); // ID du rôle Douanier Junior
        
        // Vérifier si les rôles existent
        if (!roleDouanier || !roleDouanierJunior || !roleStaff) {
            console.log("⚠️ Un des rôles 'Douanier' ou 'Douanier Junior' est introuvable.");
            return;
        }

        // Mentionner les rôles des douaniers dans le message
        const messageToSend = `⚠️ Automatisation fermée. Un douanier ou douanier junior doit traiter ce message.` 
            + `\nLe rôle **Douanier** ou **Douanier Junior** est requis pour continuer.` 
            + `\nRôles concernés : <@&${roleStaff.id}>, <@&${roleDouanier.id}>, <@&${roleDouanierJunior.id}>`;

        // Envoyer le message dans le canal webhook
        setTimeout(() => {
            message.reply(messageToSend);
        }, 2500);
        
        return;
    }

    const guild = client.guilds.cache.get(GUILD_ID);
    if (!guild) return console.error("❌ Impossible d'obtenir le serveur.");

    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) {
        console.log(`❌ Utilisateur ${userId} introuvable.`);
        return sendLogs(guild, `❌ Utilisateur avec ID ${userId} introuvable.`);
    }

    // Vérification de la blacklist
    if (blacklist.includes(member.id)) {
        console.log(`⛔ ${member.displayName} est sur la blacklist.`);

        // Délai de 5 secondes avant d'envoyer le message
        setTimeout(() => {
            message.reply(`<@${member.id}> est sur la blacklist et ne peut pas être traité.`);
        }, 2500);
        return;
    }

    const roleCitizen = guild.roles.cache.get(CITIZEN_ROLE_ID);
    const roleNoPaper = guild.roles.cache.get(NOPAPER_ROLE_ID);

    if (!roleCitizen) {
        console.error("❌ Rôle 'Citoyen' introuvable.");
        return sendLogs(guild, "❌ Rôle 'Citoyen' introuvable sur le serveur.");
    }

    try {
        await member.roles.add(roleCitizen);
        await member.roles.remove(roleNoPaper);
        console.log(`✅ ${member.displayName} a reçu le rôle 'Citoyen'.`);

        // Délai de 5 secondes avant d'envoyer le message de confirmation
        setTimeout(() => {
            message.reply(`✅ <@${member.id}> a reçu le rôle 🍁 | Citoyen(ne) et 👤| Sans Papier a été retiré.`);
        }, 2500);

        // Ajouter un message pour indiquer que l'automatisation est fermée
        if (!automationEnabled) {
            setTimeout(() => {
                message.reply("L'automatisation est maintenant fermée.");
            }, 2500);
        }

        await sendLogs(guild, `✅ ${member} a reçu le rôle ${roleCitizen.name} et ${roleNoPaper ? roleNoPaper.name : "Sans-papier"} a été retiré.`);
    } catch (error) {
        console.error(`❌ Erreur lors de l'attribution du rôle : ${error}`);
        await sendLogs(guild, `❌ Erreur d'attribution du rôle à ${member.displayName}: ${error}`);
    }
});

process.on('SIGINT', async () => {
    console.log('Arrêt du bot...');
    await client.destroy();  // Déconnexion propre du bot
    process.exit(0);  // Quitter le processus
});

// Connexion du bot
client.login(TOKEN);

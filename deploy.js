const { REST, Routes } = require('discord.js');
const config = require('./config.json');
if (process.env.TOKEN) config.token = process.env.TOKEN;
if (process.env.CLIENT_ID) config.clientId = process.env.CLIENT_ID;
if (process.env.GUILD_ID) config.guildId = process.env.GUILD_ID;

const commands = [
  {
    name: 'panel',
    description: 'Afficher le panel de commande Poulet Factory',
  },
  {
    name: 'addbalance',
    description: 'Ajouter du solde à un utilisateur',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur',
        required: true,
      },
      {
        name: 'montant',
        type: 10,
        description: 'Le montant à ajouter',
        required: true,
      },
    ],
  },
  {
    name: 'removebalance',
    description: 'Retirer du solde à un utilisateur',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur',
        required: true,
      },
      {
        name: 'montant',
        type: 10,
        description: 'Le montant à retirer',
        required: true,
      },
    ],
  },
  {
    name: 'setproduct',
    description: 'Modifier les produits et prix',
  },
  {
    name: 'stock',
    description: 'Voir le stock disponible',
  },
  {
    name: 'clientinfo',
    description: 'Voir les informations d\'un client',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur',
        required: true,
      },
    ],
  },
  {
    name: 'ban',
    description: 'Bannir un membre',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur à bannir',
        required: true,
      },
      {
        name: 'raison',
        type: 3,
        description: 'Raison du bannissement',
        required: false,
      },
    ],
  },
  {
    name: 'kick',
    description: 'Expulser un membre',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur à expulser',
        required: true,
      },
      {
        name: 'raison',
        type: 3,
        description: 'Raison de l\'expulsion',
        required: false,
      },
    ],
  },
  {
    name: 'mute',
    description: 'Rendre muet un membre (timeout)',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur à rendre muet',
        required: true,
      },
      {
        name: 'duree',
        type: 10,
        description: 'Durée en minutes',
        required: true,
      },
      {
        name: 'raison',
        type: 3,
        description: 'Raison du mute',
        required: false,
      },
    ],
  },
  {
    name: 'nuke',
    description: 'Supprimer et recréer le salon',
  },
  {
    name: 'lock',
    description: 'Verrouiller le salon (empêche d\'écrire)',
  },
  {
    name: 'unlock',
    description: 'Déverrouiller le salon',
  },
  {
    name: 'verifypanel',
    description: 'Afficher le panel de vérification temporaire',
  },
  {
    name: 'blockverify',
    description: 'Bloquer la vérification d\'un membre',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur à bloquer',
        required: true,
      },
    ],
  },
  {
    name: 'unblockverify',
    description: 'Débloquer la vérification d\'un membre',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur à débloquer',
        required: true,
      },
    ],
  },
  {
    name: 'annoce',
    description: 'Envoyer une annonce dans un salon',
    options: [
      {
        name: 'titre',
        type: 3,
        description: 'Titre de l\'annonce',
        required: true,
      },
      {
        name: 'message',
        type: 3,
        description: 'Contenu de l\'annonce',
        required: true,
      },
      {
        name: 'salon',
        type: 7,
        description: 'Salon où envoyer l\'annonce (défaut: salon actuel)',
        required: false,
      },
    ],
  },
  {
    name: 'giveaway',
    description: 'Lancer un giveaway',
    options: [
      {
        name: 'duree',
        type: 3,
        description: 'Durée (ex: 30m, 1h, 2h, 1d)',
        required: true,
      },
      {
        name: 'gagnants',
        type: 4,
        description: 'Nombre de gagnants',
        required: true,
        min_value: 1,
        max_value: 50,
      },
      {
        name: 'lot',
        type: 3,
        description: 'Lot à gagner',
        required: true,
      },
    ],
  },
];

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log('Enregistrement des commandes slash...');
    await rest.put(Routes.applicationGuildCommands(config.clientId, config.guildId), { body: commands });
    console.log('Commandes enregistrées avec succès !');
  } catch (error) {
    console.error(error);
  }
})();

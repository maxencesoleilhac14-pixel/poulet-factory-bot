const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Generate config.json from env vars if missing (Railway)
const configPath = path.join(__dirname, 'config.json');
if (!fs.existsSync(configPath)) {
  fs.writeFileSync(configPath, JSON.stringify({
    token: process.env.TOKEN || '',
    clientId: process.env.CLIENT_ID || '',
    guildId: process.env.GUILD_ID || '',
    ticketCategoryId: process.env.TICKET_CATEGORY_ID || '',
    cuistotRoleId: process.env.CUISTOT_ROLE_ID || '',
    adminRoleId: process.env.ADMIN_ROLE_ID || '',
    colorGold: process.env.COLOR_GOLD || '#FFD700',
    colorDark: process.env.COLOR_DARK || '#1a1a1a',
    paypal: { link: process.env.PAYPAL_LINK || '', text: process.env.PAYPAL_TEXT || '' },
    revolut: { link: process.env.REVOLUT_LINK || '', text: process.env.REVOLUT_TEXT || '' },
    paysafecard: { text: process.env.PAYSAFECARD_TEXT || '' },
    oxapay: {
      apiKey: process.env.OXAPAY_API_KEY || '',
      apiUrl: process.env.OXAPAY_API_URL || 'https://api.oxapay.com/v1/payment/invoice',
      currency: process.env.OXAPAY_CURRENCY || 'EUR',
      lifetime: parseInt(process.env.OXAPAY_LIFETIME || '30', 10),
    },
    rechargeTicketChannelId: process.env.RECHARGE_TICKET_CHANNEL_ID || '',
    fondaRoleId: process.env.FONDA_ROLE_ID || '',
    tempMemberRoleId: process.env.TEMP_MEMBER_ROLE_ID || '',
    savCategoryId: process.env.SAV_CATEGORY_ID || '',
    savRoleId: process.env.SAV_ROLE_ID || '',
  }, null, 2));
}

const config = require('./config.json');
if (process.env.TOKEN) config.token = process.env.TOKEN;
if (process.env.CLIENT_ID) config.clientId = process.env.CLIENT_ID;
if (process.env.GUILD_ID) config.guildId = process.env.GUILD_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.commands = new Collection();

const commandDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandDir).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = require(path.join(commandDir, file));
  client.commands.set(command.data.name, command);
}

const eventDir = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventDir).filter(f => f.endsWith('.js'));
for (const file of eventFiles) {
  const event = require(path.join(eventDir, file));
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args, client));
  } else {
    client.on(event.name, (...args) => event.execute(...args, client));
  }
}

client.once('ready', () => {
  console.log(`✅ Bot connecté en tant que ${client.user.tag}`);
  client.user.setActivity('Poulet Factory 🍗', { type: 3 });
});

client.login(config.token);

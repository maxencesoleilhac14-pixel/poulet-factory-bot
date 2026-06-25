const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
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

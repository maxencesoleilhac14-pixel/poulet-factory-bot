const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  data: { name: 'giveaway' },
  async execute(interaction) {
    const dureeStr = interaction.options.getString('duree');
    const winnersCount = interaction.options.getInteger('gagnants');
    const prize = interaction.options.getString('lot');

    const durationMinutes = parseDuration(dureeStr);
    if (!durationMinutes || durationMinutes < 1) {
      return interaction.reply({
        content: '❌ Durée invalide. Utilisez des formats comme : `30m`, `1h`, `2h`, `1d`',
        ephemeral: true,
      });
    }

    if (durationMinutes > 10080) {
      return interaction.reply({
        content: '❌ La durée maximale est de 7 jours (10080 minutes).',
        ephemeral: true,
      });
    }

    if (winnersCount < 1 || winnersCount > 50) {
      return interaction.reply({
        content: '❌ Le nombre de gagnants doit être entre 1 et 50.',
        ephemeral: true,
      });
    }

    if (!prize || prize.length > 200) {
      return interaction.reply({
        content: '❌ Le lot doit faire entre 1 et 200 caractères.',
        ephemeral: true,
      });
    }

    const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);
    const endTimestamp = Math.floor(endTime.getTime() / 1000);

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('🎉 Giveaway')
      .setDescription(
        `**${prize}**\n\n` +
        `🕒 Fin <t:${endTimestamp}:R>\n` +
        `👥 **${winnersCount}** gagnant(s)\n` +
        `👥 **0** participant\n\n` +
        `Cliquez sur le bouton 🎉 pour participer !`
      )
      .setFooter({ text: 'Poulet Factory • Giveaway' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_join_placeholder')
        .setLabel('🎉 Participer')
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.reply({ content: '✅ Giveaway lancé !', ephemeral: true });
    const msg = await interaction.channel.send({ embeds: [embed], components: [row] });

    const result = db.prepare(
      'INSERT INTO giveaways (channelId, messageId, hosterId, prize, duration, winnersCount, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(interaction.channelId, msg.id, interaction.user.id, prize, durationMinutes, winnersCount, 'active');

    const giveawayId = result.lastInsertRowid;

    const realRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_join_${giveawayId}`)
        .setLabel('🎉 Participer')
        .setStyle(ButtonStyle.Primary),
    );

    await msg.edit({ components: [realRow] });

    // Schedule end
    const client = interaction.client;
    setTimeout(async () => {
      try {
        await endGiveawayInternal(client, giveawayId);
      } catch (e) {
        console.error('Erreur fin giveaway:', e);
      }
    }, durationMinutes * 60 * 1000);
  },
};

async function endGiveawayInternal(client, giveawayId) {
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
  if (!giveaway || giveaway.status !== 'active') return;

  const participants = giveaway.participants ? giveaway.participants.split(',').filter(Boolean) : [];

  db.prepare("UPDATE giveaways SET status = ?, endedAt = datetime('now') WHERE id = ?").run('ended', giveawayId);

  const guild = client.guilds.cache.get(config.guildId);
  if (!guild) return;

  const channel = guild.channels.cache.get(giveaway.channelId);
  if (!channel) return;

  let winners = [];
  if (participants.length === 0) {
    // no participants
  } else if (participants.length <= giveaway.winnersCount) {
    winners = participants;
  } else {
    const shuffled = [...participants].sort(() => Math.random() - 0.5);
    winners = shuffled.slice(0, giveaway.winnersCount);
  }

  const winnerMentions = winners.length > 0 ? winners.map(id => `<@${id}>`).join(', ') : 'Personne n\'a participé 😢';

  try {
    const msg = await channel.messages.fetch(giveaway.messageId);
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🎉 Giveaway Terminé')
      .setDescription(
        `**${giveaway.prize}**\n\n` +
        `**Gagnant(s) :** ${winnerMentions}\n\n` +
        `Total participants : **${participants.length}**`
      )
      .setFooter({ text: 'Poulet Factory • Giveaway' })
      .setTimestamp();

    const disabledRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`giveaway_join_${giveawayId}`)
        .setLabel('🎉 Participer')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(true),
    );

    await msg.edit({ embeds: [embed], components: [disabledRow] });

    if (winners.length > 0) {
      await channel.send({
        content: `🎉 Félicitations ${winnerMentions} ! Vous avez gagné **${giveaway.prize}** !`,
      });
    }
  } catch (e) {}
}

function parseDuration(str) {
  const match = str.match(/^(\d+)(m|h|d|min|mins|heure|heures|h|jour|jours|j)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  if (unit === 'm' || unit === 'min' || unit === 'mins') return val;
  if (unit === 'h' || unit === 'heure' || unit === 'heures') return val * 60;
  if (unit === 'd' || unit === 'j' || unit === 'jour' || unit === 'jours') return val * 1440;
  return null;
}

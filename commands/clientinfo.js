const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  data: { name: 'clientinfo' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utilisateur');
    const user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(targetUser.id);

    if (!user) {
      return interaction.reply({ content: '❌ Cet utilisateur n\'a pas encore de compte.', ephemeral: true });
    }

    const orders = db.prepare('SELECT * FROM orders WHERE discordId = ? ORDER BY createdAt DESC LIMIT 10').all(targetUser.id);
    const transactions = db.prepare('SELECT * FROM transactions WHERE discordId = ? ORDER BY createdAt DESC LIMIT 10').all(targetUser.id);

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle(`📋 Informations Client`)
      .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Utilisateur', value: `${targetUser.tag} (<@${targetUser.id}>)`, inline: false },
        { name: '🆔 ID', value: `\`${targetUser.id}\``, inline: true },
        { name: '💰 Solde', value: `${user.balance.toFixed(2)}€`, inline: true },
        { name: '📅 Inscrit depuis', value: user.createdAt, inline: true },
        { name: '📦 Commandes totales', value: `${orders.length}`, inline: true },
      )
      .setFooter({ text: 'Poulet Factory • Administration' })
      .setTimestamp();

    if (orders.length > 0) {
      let ordersText = orders.slice(0, 5).map(o =>
        `**#${o.id}** - ${o.productName} - ${o.price.toFixed(2)}€ - ${o.status === 'completed' ? '✅' : '⏳'}`
      ).join('\n');
      embed.addFields({ name: '📋 Dernières commandes', value: ordersText, inline: false });
    }

    if (transactions.length > 0) {
      let txText = transactions.slice(0, 5).map(t =>
        `**${t.type}** - ${t.amount.toFixed(2)}€ - ${t.method || 'N/A'} - ${t.status === 'completed' ? '✅' : t.status === 'pending' ? '⏳' : '❌'}`
      ).join('\n');
      embed.addFields({ name: '💳 Dernières transactions', value: txText, inline: false });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  data: { name: 'removebalance' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utilisateur');
    const amount = interaction.options.getNumber('montant');

    if (amount <= 0) {
      return interaction.reply({ content: '❌ Le montant doit être positif.', ephemeral: true });
    }

    const user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(targetUser.id);
    if (!user || user.balance < amount) {
      return interaction.reply({ content: '❌ Solde insuffisant.', ephemeral: true });
    }

    db.prepare('UPDATE users SET balance = balance - ? WHERE discordId = ?').run(amount, targetUser.id);

    db.prepare(
      'INSERT INTO transactions (discordId, amount, type, method, status) VALUES (?, ?, ?, ?, ?)'
    ).run(targetUser.id, amount, 'admin_remove', 'admin', 'completed');

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Solde Retiré')
      .setDescription(`${amount.toFixed(2)}€ ont été retirés du compte de ${targetUser.tag}`)
      .addFields(
        { name: '👤 Utilisateur', value: `<@${targetUser.id}>`, inline: true },
        { name: '💰 Montant retiré', value: `${amount.toFixed(2)}€`, inline: true },
        { name: '💳 Nouveau solde', value: `${(user.balance - amount).toFixed(2)}€`, inline: true },
        { name: '🛠️ Admin', value: `<@${interaction.user.id}>`, inline: true },
      )
      .setFooter({ text: 'Poulet Factory • Administration' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('💰 Solde Débité')
        .setDescription(`Votre solde Poulet Factory a été débité de **${amount.toFixed(2)}€**`)
        .addFields(
          { name: '💰 Nouveau solde', value: `${(user.balance - amount).toFixed(2)}€`, inline: true },
        )
        .setFooter({ text: 'Poulet Factory' })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (e) {
      // DM closed, ignore
    }
  },
};

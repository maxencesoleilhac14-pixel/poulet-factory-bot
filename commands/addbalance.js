const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  data: { name: 'addbalance' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
    }

    const targetUser = interaction.options.getUser('utilisateur');
    const amount = interaction.options.getNumber('montant');

    if (amount <= 0) {
      return interaction.reply({ content: '❌ Le montant doit être positif.', ephemeral: true });
    }

    let user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(targetUser.id);
    if (!user) {
      db.prepare('INSERT INTO users (discordId, balance) VALUES (?, ?)').run(targetUser.id, 0);
      user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(targetUser.id);
    }

    db.prepare('UPDATE users SET balance = balance + ? WHERE discordId = ?').run(amount, targetUser.id);

    // Log transaction
    db.prepare(
      'INSERT INTO transactions (discordId, amount, type, method, status) VALUES (?, ?, ?, ?, ?)'
    ).run(targetUser.id, amount, 'admin_add', 'admin', 'completed');

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ Solde Ajouté')
      .setDescription(`${amount.toFixed(2)}€ ont été ajoutés au compte de ${targetUser.tag}`)
      .addFields(
        { name: '👤 Utilisateur', value: `<@${targetUser.id}>`, inline: true },
        { name: '💰 Montant ajouté', value: `${amount.toFixed(2)}€`, inline: true },
        { name: '💳 Nouveau solde', value: `${(user.balance + amount).toFixed(2)}€`, inline: true },
        { name: '🛠️ Admin', value: `<@${interaction.user.id}>`, inline: true },
      )
      .setFooter({ text: 'Poulet Factory • Administration' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });

    // Notify user
    try {
      const dmEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('💰 Solde Crédité')
        .setDescription(`Votre solde Poulet Factory a été crédité de **${amount.toFixed(2)}€** !`)
        .addFields(
          { name: '💰 Nouveau solde', value: `${(user.balance + amount).toFixed(2)}€`, inline: true },
        )
        .setFooter({ text: 'Poulet Factory' })
        .setTimestamp();

      await targetUser.send({ embeds: [dmEmbed] });
    } catch (e) {
      // DM closed, ignore
    }
  },
};

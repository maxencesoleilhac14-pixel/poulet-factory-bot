const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'ban' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const user = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison';

    if (!user) return interaction.reply({ content: '❌ Utilisateur invalide.', ephemeral: true });

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!member.bannable) return interaction.reply({ content: '❌ Impossible de bannir ce membre.', ephemeral: true });

    await member.ban({ reason });

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🔨 Bannissement')
      .setDescription(`${user.tag} a été banni`)
      .addFields(
        { name: '👤 Utilisateur', value: `<@${user.id}>`, inline: true },
        { name: '🛠️ Modérateur', value: `<@${interaction.user.id}>`, inline: true },
        { name: '📝 Raison', value: reason, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'kick' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const user = interaction.options.getUser('utilisateur');
    const reason = interaction.options.getString('raison') || 'Aucune raison';

    if (!user) return interaction.reply({ content: '❌ Utilisateur invalide.', ephemeral: true });

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!member.kickable) return interaction.reply({ content: '❌ Impossible d\'expulser ce membre.', ephemeral: true });

    await member.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(0xFFA500)
      .setTitle('👢 Expulsion')
      .setDescription(`${user.tag} a été expulsé`)
      .addFields(
        { name: '👤 Utilisateur', value: `<@${user.id}>`, inline: true },
        { name: '🛠️ Modérateur', value: `<@${interaction.user.id}>`, inline: true },
        { name: '📝 Raison', value: reason, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

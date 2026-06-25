const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'unlock' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const channel = interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: true,
    });

    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🔓 Salon déverrouillé')
      .setDescription(`Ce salon a été déverrouillé par <@${interaction.user.id}>`)
      .addFields(
        { name: '🔓 Statut', value: 'Ouvert', inline: true },
        { name: '🛠️ Modérateur', value: `<@${interaction.user.id}>`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

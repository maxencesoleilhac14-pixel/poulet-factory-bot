const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'lock' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const channel = interaction.channel;

    await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, {
      SendMessages: false,
    });

    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('🔒 Salon verrouillé')
      .setDescription(`Ce salon a été verrouillé par <@${interaction.user.id}>`)
      .addFields(
        { name: '🔒 Statut', value: 'Fermé', inline: true },
        { name: '🛠️ Modérateur', value: `<@${interaction.user.id}>`, inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

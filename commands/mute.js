const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'mute' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const user = interaction.options.getUser('utilisateur');
    const duree = interaction.options.getNumber('duree');
    const raison = interaction.options.getString('raison') || 'Aucune raison';

    if (!user) return interaction.reply({ content: '❌ Utilisateur invalide.', ephemeral: true });

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) return interaction.reply({ content: '❌ Membre introuvable.', ephemeral: true });
    if (!member.moderatable) return interaction.reply({ content: '❌ Impossible de rendre muet ce membre.', ephemeral: true });

    const durationMs = duree * 60 * 1000;
    await member.timeout(durationMs, raison);

    const embed = new EmbedBuilder()
      .setColor(0xFFD700)
      .setTitle('🔇 Mute')
      .setDescription(`${user.tag} a été rendu muet`)
      .addFields(
        { name: '👤 Utilisateur', value: `<@${user.id}>`, inline: true },
        { name: '⏱️ Durée', value: `${duree} minute(s)`, inline: true },
        { name: '🛠️ Modérateur', value: `<@${interaction.user.id}>`, inline: true },
        { name: '📝 Raison', value: raison, inline: false },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'verifypanel' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId) && !interaction.member.roles.cache.has(config.fondaRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('✅ Vérification Temporaire')
      .setDescription(
        'Clique sur le bouton ci-dessous pour obtenir ton accès temporaire au serveur.\n\n' +
        '📌 **Note :** Un vérificateur pourra te demander de te revérifier plus tard.'
      )
      .setFooter({ text: 'Poulet Factory • Vérification' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('verify_temp')
        .setLabel('✅ Se vérifier')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ content: '✅ Panel de vérification posté !', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },
};

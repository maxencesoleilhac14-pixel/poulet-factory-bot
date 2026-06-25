const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'panel' },
  async execute(interaction) {
    const icon = interaction.guild?.iconURL({ dynamic: true }) || interaction.client.user.displayAvatarURL();

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('🍗 Poulet Factory')
      .setDescription(
        'Bienvenue dans l\'univers **Poulet Factory** !\n\n' +
        '📱 **Comment ça marche ?**\n' +
        '• La commande se fait simplement avec un **numéro vierge** qui n\'a jamais été utilisé sur KFC.\n' +
        '• Les comptes sont garantis **15 minutes** (délai d\'attente possible).\n' +
        '• Nous conseillons de **prendre le compte directement sur place** après achat.\n\n' +
        '💳 **Compte Client** : rechargez votre solde et consultez votre historique.\n' +
        '🍗 **Boutique Poulet** : commandez vos accès KFC.'
      )
      .setThumbnail(icon)
      .setFooter({ text: 'Poulet Factory • Qualité Premium', iconURL: icon })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('panel_shop')
        .setLabel('🍗 Boutique Poulet')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('panel_account')
        .setLabel('💳 Compte Client')
        .setStyle(ButtonStyle.Success),
    );

    await interaction.reply({ content: '✅ Panel posté avec succès !', ephemeral: true });
    await interaction.channel.send({ embeds: [embed], components: [row] });
  },
};

const { EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'annoce' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const titre = interaction.options.getString('titre');
    const message = interaction.options.getString('message');
    const chenal = interaction.options.getChannel('salon') || interaction.channel;

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle(titre)
      .setDescription(message)
      .setFooter({ text: `Annonce par ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp();

    await chenal.send({ embeds: [embed] });

    await interaction.reply({
      content: `✅ Annonce envoyée dans ${chenal}`,
      ephemeral: true,
    });
  },
};

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: { name: 'nuke' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const channel = interaction.channel;

    const confirmEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('☢️ Nuke du salon')
      .setDescription(`Êtes-vous sûr de vouloir **nuke** ${channel} ?\nTous les messages seront supprimés.`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('confirm_nuke')
        .setLabel('✅ Confirmer')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('cancel_nuke')
        .setLabel('❌ Annuler')
        .setStyle(ButtonStyle.Secondary),
    );

    const msg = await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true });

    const collector = msg.createMessageComponentCollector({ time: 15000 });

    collector.on('collect', async (i) => {
      if (i.customId === 'cancel_nuke') {
        return i.update({ content: '❌ Nuke annulé.', embeds: [], components: [] });
      }

      if (i.customId === 'confirm_nuke') {
        await i.update({ content: '☢️ Nuke en cours...', embeds: [], components: [] });
        try {
          const position = channel.position;
          const topic = channel.topic;
          const nsfw = channel.nsfw;
          const parentId = channel.parentId;
          const name = channel.name;
          const permissions = channel.permissionOverwrites.cache;

          await channel.delete();
          const newChannel = await interaction.guild.channels.create({
            name,
            type: channel.type,
            parent: parentId,
            topic,
            nsfw,
            position,
            permissionOverwrites: permissions,
          });

          const doneEmbed = new EmbedBuilder()
            .setColor(parseInt(config.colorGold.replace('#', ''), 16))
            .setTitle('☢️ Salon nuké')
            .setDescription(`Ce salon a été **nuké** par <@${interaction.user.id}>`)
            .setTimestamp();

          await newChannel.send({ embeds: [doneEmbed] });
        } catch (e) {
          console.error(e);
        }
      }
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await interaction.editReply({ content: '⏱️ Temps écoulé.', embeds: [], components: [] }).catch(() => {});
      }
    });
  },
};

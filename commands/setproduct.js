const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  data: { name: 'setproduct' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
    }

    const products = db.prepare('SELECT * FROM products').all();

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('⚙️ Gestion des Produits')
      .setDescription('Gérez les produits de la boutique :')
      .setFooter({ text: 'Poulet Factory • Administration' })
      .setTimestamp();

    for (const p of products) {
      embed.addFields({
        name: `#${p.id} - ${p.name}`,
        value: `💰 Prix: **${p.price.toFixed(2)}€** | 📦 Stock: **${p.stock}**\n${p.description || 'Aucune description'}`,
        inline: false,
      });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('add_product_btn')
        .setLabel('➕ Ajouter un produit')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('refresh_products')
        .setLabel('🔄 Rafraîchir')
        .setStyle(ButtonStyle.Secondary),
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};

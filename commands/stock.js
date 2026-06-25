const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  data: { name: 'stock' },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Vous n\'avez pas la permission d\'utiliser cette commande.', ephemeral: true });
    }

    const products = db.prepare('SELECT * FROM products').all();

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('📦 Stock Poulet Factory')
      .setDescription('Liste des produits et leurs stocks :')
      .setFooter({ text: 'Poulet Factory • Gestion des stocks' })
      .setTimestamp();

    for (const p of products) {
      const stockEmoji = p.stock > 10 ? '✅' : p.stock > 0 ? '⚠️' : '❌';
      embed.addFields({
        name: `#${p.id} - ${p.name}`,
        value: `💰 Prix: **${p.price.toFixed(2)}€** | 📦 Stock: **${p.stock}** ${stockEmoji}\n${p.description || 'Aucune description'}`,
        inline: false,
      });
    }

    if (products.length === 0) {
      embed.setDescription('📭 Aucun produit en stock.');
    }

    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    embed.addFields({ name: '💰 Valeur totale du stock', value: `${totalValue.toFixed(2)}€`, inline: false });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('admin_product_select_edit')
      .setPlaceholder('Modifier un produit...')
      .addOptions(
        products.map(p =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`#${p.id} - ${p.name}`)
            .setDescription(`Prix: ${p.price.toFixed(2)}€ | Stock: ${p.stock}`)
            .setValue(p.id.toString())
        )
      );

    const deleteMenu = new StringSelectMenuBuilder()
      .setCustomId('admin_product_select_delete')
      .setPlaceholder('Supprimer un produit...')
      .addOptions(
        products.map(p =>
          new StringSelectMenuOptionBuilder()
            .setLabel(`#${p.id} - ${p.name}`)
            .setDescription(`Prix: ${p.price.toFixed(2)}€ | Stock: ${p.stock}`)
            .setValue(p.id.toString())
        )
      );

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const row2 = new ActionRowBuilder().addComponents(deleteMenu);

    await interaction.reply({ embeds: [embed], components: [row, row2], ephemeral: true });
  },
};

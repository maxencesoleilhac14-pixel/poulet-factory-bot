const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  PermissionFlagsBits,
  ChannelType,
  StringSelectMenuOptionBuilder,
} = require('discord.js');
const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    try {
      if (interaction.isChatInputCommand()) {
        await handleCommand(interaction, client);
        return;
      }
      if (interaction.isButton()) {
        await handleButton(interaction, client);
        return;
      }
      if (interaction.isStringSelectMenu()) {
        await handleSelectMenu(interaction, client);
        return;
      }
      if (interaction.isModalSubmit()) {
        await handleModal(interaction, client);
        return;
      }
    } catch (error) {
      console.error('Erreur interaction:', error);
      try {
        const msg = { content: '❌ Une erreur est survenue. Contacte un admin.', ephemeral: true };
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp(msg);
        } else {
          await interaction.reply(msg);
        }
      } catch (e) {}
    }
  },
};

async function handleCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({
      content: 'Une erreur est survenue lors de l\'exécution de la commande.',
      ephemeral: true,
    });
  }
}

async function handleButton(interaction, client) {
  const { customId } = interaction;

  if (customId === 'panel_shop') {
    return showProductSelection(interaction);
  }
  if (customId === 'panel_account') {
    return showAccount(interaction);
  }

  if (customId.startsWith('recharge_')) {
    const method = customId.split('_')[1];
    return showRechargeModal(interaction, method);
  }

  if (customId.startsWith('validate_')) {
    const orderId = customId.split('_')[1];
    if (!interaction.member.roles.cache.has(config.cuistotRoleId) && !interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée. Seuls les Cuistots peuvent valider les commandes.', ephemeral: true });
    }
    return showValidateModal(interaction, orderId);
  }

  if (customId.startsWith('close_')) {
    const orderId = customId.split('_')[1];
    return closeTicket(interaction, orderId);
  }

  if (customId === 'historique_comptes') {
    return showAccountHistory(interaction);
  }

  if (customId === 'add_product_btn') {
    return showAddProductModal(interaction);
  }

  if (customId === 'refresh_products') {
    const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    return interaction.update({ embeds: [embed], components: [row] });
  }

  if (customId.startsWith('confirm_recharge_')) {
    const txId = customId.split('_')[2];
    return confirmRecharge(interaction, txId);
  }

  if (customId.startsWith('check_crypto_')) {
    const parts = customId.split('_');
    const txId = parts[2];
    const trackId = parts.slice(3).join('_');
    return checkCryptoPayment(interaction, txId, trackId);
  }

  if (customId.startsWith('ping_admin_')) {
    const parts = customId.split('_');
    const txId = parts[2];
    const method = parts[3] || 'paypal';
    return showClientPaymentModal(interaction, txId, method);
  }

  if (customId.startsWith('give_paypal_')) {
    const txId = customId.split('_')[2];
    return showPaypalModal(interaction, txId);
  }

  if (customId.startsWith('accept_recharge_')) {
    const txId = customId.split('_')[2];
    return acceptRecharge(interaction, txId);
  }

  if (customId.startsWith('refuse_recharge_')) {
    const txId = customId.split('_')[2];
    return refuseRecharge(interaction, txId);
  }

  if (customId.startsWith('delier_numero_')) {
    const orderId = customId.split('_')[2];
    return delierNumero(interaction, orderId);
  }

  if (customId.startsWith('delier_cart_')) {
    const orderId = customId.split('_')[2];
    return delierCartItem(interaction, orderId);
  }

  if (customId.startsWith('sav_')) {
    const orderId = customId.split('_')[1];
    return showSavModal(interaction, orderId);
  }

  if (customId.startsWith('close_sav_')) {
    const orderId = customId.split('_')[2];
    return closeSavTicket(interaction, orderId);
  }

  if (customId.startsWith('giveaway_join_')) {
    const giveawayId = customId.split('_')[2];
    return joinGiveaway(interaction, giveawayId);
  }

  if (customId.startsWith('fermer_ticket_')) {
    const orderId = customId.split('_')[2];
    return fermerTicket(interaction, orderId);
  }

  if (customId.startsWith('refuse_order_')) {
    const orderId = customId.split('_')[2];
    if (!interaction.member.roles.cache.has(config.cuistotRoleId) && !interaction.member.roles.cache.has(config.adminRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée. Seuls les Cuistots peuvent refuser des commandes.', ephemeral: true });
    }
    return refuseOrder(interaction, orderId);
  }

  if (customId.startsWith('delier_')) {
    const txId = customId.split('_')[1];
    return showDelierModal(interaction, txId);
  }

  if (customId === 'verify_temp') {
    return handleTempVerification(interaction);
  }

  if (customId.startsWith('block_verify_')) {
    const userId = customId.split('_')[2];
    return blockVerifyFromPanel(interaction, userId);
  }

  if (customId === 'view_cart') {
    return showCart(interaction);
  }

  if (customId.startsWith('add_cart_')) {
    const productId = customId.split('_')[2];
    return addToCart(interaction, productId);
  }

  if (customId.startsWith('remove_cart_')) {
    const cartId = customId.split('_')[2];
    return removeFromCart(interaction, cartId);
  }

  if (customId === 'clear_cart') {
    return clearCart(interaction);
  }

  if (customId === 'checkout_cart') {
    return showCartOrderModal(interaction);
  }

  if (customId === 'back_shop') {
    return showProductSelection(interaction);
  }

}

async function handleSelectMenu(interaction, client) {
  if (interaction.customId === 'product_select') {
    const productId = interaction.values[0];
    return showProductInfo(interaction, productId);
  }

  if (interaction.customId.startsWith('admin_product_select_')) {
    const action = interaction.customId.split('_')[3];
    const productId = interaction.values[0];
    if (action === 'delete') {
      return deleteProduct(interaction, productId);
    }
    return showEditProductModal(interaction, productId);
  }
}

async function handleModal(interaction, client) {
  if (interaction.customId.startsWith('order_')) {
    const productId = interaction.customId.split('_')[1];
    return processOrder(interaction, productId);
  }

  if (interaction.customId.startsWith('recharge_modal_')) {
    const method = interaction.customId.split('_')[2];
    return processRecharge(interaction, method);
  }

  if (interaction.customId.startsWith('validate_ticket_')) {
    const orderId = interaction.customId.split('_')[2];
    return validateOrder(interaction, orderId);
  }

  if (interaction.customId === 'edit_product') {
    return saveEditedProduct(interaction);
  }

  if (interaction.customId === 'add_product') {
    return saveNewProduct(interaction);
  }

  if (interaction.customId.startsWith('paypal_name_')) {
    const txId = interaction.customId.split('_')[2];
    return savePaypalName(interaction, txId);
  }

  if (interaction.customId.startsWith('client_paypal_')) {
    const parts = interaction.customId.split('_');
    const txId = parts[2];
    const method = parts[3] || 'paypal';
    return createRechargeTicketFromModal(interaction, txId, method);
  }

  if (interaction.customId.startsWith('sav_reason_')) {
    const orderId = interaction.customId.split('_')[2];
    return openSavTicket(interaction, orderId);
  }

  if (interaction.customId.startsWith('delier_confirm_')) {
    const txId = interaction.customId.split('_')[2];
    return processDelier(interaction, txId);
  }

  if (interaction.customId === 'cart_checkout') {
    return processFullCart(interaction);
  }
}

// ─────────────────────────────────────────────
// PANEL
// ─────────────────────────────────────────────

async function showPanel(interaction) {
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

  await interaction.reply({ embeds: [embed], components: [row] });
}

// ─────────────────────────────────────────────
// PRODUCT SELECTION
// ─────────────────────────────────────────────

async function showProductSelection(interaction) {
  const products = db.prepare('SELECT * FROM products WHERE stock > 0').all();

  if (products.length === 0) {
    return interaction.reply({
      content: '❌ Aucun produit disponible pour le moment.',
      ephemeral: true,
    });
  }

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('product_select')
    .setPlaceholder('Choisissez un produit')
    .addOptions(
      products.map(p =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${p.name} - ${p.price.toFixed(2)}€`)
          .setDescription(`Stock: ${p.stock} | ${p.description || 'Produit Poulet Factory'}`)
          .setValue(p.id.toString())
      )
    );

  const cartCount = db.prepare('SELECT COUNT(*) as count FROM carts WHERE discordId = ?').get(interaction.user.id).count;

  const row = new ActionRowBuilder().addComponents(selectMenu);

  const row2 = cartCount > 0
    ? new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('view_cart')
          .setLabel(`🛒 Voir le panier (${cartCount})`)
          .setStyle(ButtonStyle.Secondary),
      )
    : null;

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('🍗 Boutique Poulet')
    .setDescription('Sélectionnez un produit dans le menu ci-dessous :')
    .setFooter({ text: 'Poulet Factory' });

  await interaction.reply({ embeds: [embed], components: row2 ? [row, row2] : [row], ephemeral: true });
}

// ─────────────────────────────────────────────
// PRODUCT INFO (CART / BUY)
// ─────────────────────────────────────────────

async function showProductInfo(interaction, productId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product || product.stock <= 0) {
    return interaction.reply({
      content: '❌ Ce produit n\'est plus disponible.',
      ephemeral: true,
    });
  }

  const cartCount = db.prepare('SELECT COUNT(*) as count FROM carts WHERE discordId = ?').get(interaction.user.id).count;

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle(product.name)
    .setDescription(product.description || 'Produit Poulet Factory')
    .addFields(
      { name: '💰 Prix', value: `${product.price.toFixed(2)}€`, inline: true },
      { name: '📦 Stock', value: `${product.stock}`, inline: true },
      { name: '🛒 Ton panier', value: `${cartCount} article(s)`, inline: true },
    )
    .setFooter({ text: 'Poulet Factory' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`add_cart_${productId}`)
      .setLabel('🛒 Ajouter au panier')
      .setStyle(ButtonStyle.Success),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('back_shop')
      .setLabel('⬅️ Retour')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('view_cart')
      .setLabel(`🛒 Panier (${cartCount})`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(cartCount === 0),
  );

  await interaction.update({ embeds: [embed], components: [row, row2] });
}

// ─────────────────────────────────────────────
// CART
// ─────────────────────────────────────────────

async function addToCart(interaction, productId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product || product.stock <= 0) {
    return interaction.reply({ content: '❌ Ce produit n\'est plus disponible.', ephemeral: true });
  }

  const cartCount = db.prepare('SELECT COUNT(*) as count FROM carts WHERE discordId = ?').get(interaction.user.id).count;
  if (cartCount >= 20) {
    return interaction.reply({ content: '❌ Maximum 20 articles dans le panier.', ephemeral: true });
  }

  db.prepare('INSERT INTO carts (discordId, productId, productName, price) VALUES (?, ?, ?, ?)')
    .run(interaction.user.id, productId, product.name, product.price);

  const newCount = cartCount + 1;

  // Update the product info embed with new cart count
  const currentEmbed = interaction.message.embeds[0];
  const embed = EmbedBuilder.from(currentEmbed)
    .spliceFields(2, 1, { name: '🛒 Ton panier', value: `${newCount} article(s)`, inline: true });

  const row = ActionRowBuilder.from(interaction.message.components[0]);

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('back_shop')
      .setLabel('⬅️ Retour')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('view_cart')
      .setLabel(`🛒 Panier (${newCount})`)
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.update({ embeds: [embed], components: [row, row2] });
  await interaction.followUp({
    content: `✅ **${product.name}** ajouté au panier !`,
    ephemeral: true,
  });
}

async function showCart(interaction) {
  const items = db.prepare('SELECT * FROM carts WHERE discordId = ? ORDER BY addedAt ASC').all(interaction.user.id);

  if (items.length === 0) {
    const emptyEmbed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('🛒 Ton Panier')
      .setDescription('Ton panier est vide. Ajoute des articles depuis la boutique !')
      .setFooter({ text: 'Poulet Factory' });

    const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('back_shop')
        .setLabel('⬅️ Retour à la boutique')
        .setStyle(ButtonStyle.Primary),
    );

    return interaction.update({ embeds: [emptyEmbed], components: [backRow] });
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);

  const itemsList = items.map((item, i) =>
    `**${i + 1}.** ${item.productName} — 💰 ${item.price.toFixed(2)}€`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('🛒 Ton Panier')
    .setDescription(`${itemsList}\n\n💵 **Total : ${total.toFixed(2)}€**`)
    .setFooter({ text: 'Poulet Factory • Panier' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('checkout_cart')
      .setLabel('✅ Commander le panier')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('clear_cart')
      .setLabel('🗑️ Vider le panier')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('back_shop')
      .setLabel('⬅️ Retour boutique')
      .setStyle(ButtonStyle.Secondary),
  );

  // Build remove buttons (max 5 per row)
  const removeRow = new ActionRowBuilder();
  for (const item of items.slice(0, 5)) {
    removeRow.addComponents(
      new ButtonBuilder()
        .setCustomId(`remove_cart_${item.id}`)
        .setLabel(`❌ ${item.productName}`)
        .setStyle(ButtonStyle.Danger),
    );
  }

  const components = removeRow.components.length > 0 ? [row, removeRow] : [row];
  await interaction.update({ embeds: [embed], components });
}

async function removeFromCart(interaction, cartId) {
  const item = db.prepare('SELECT * FROM carts WHERE id = ? AND discordId = ?').get(cartId, interaction.user.id);
  if (!item) {
    return interaction.reply({ content: '❌ Article introuvable dans ton panier.', ephemeral: true });
  }

  db.prepare('DELETE FROM carts WHERE id = ?').run(cartId);

  const remaining = db.prepare('SELECT COUNT(*) as count FROM carts WHERE discordId = ?').get(interaction.user.id).count;

  if (remaining === 0) {
    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('🛒 Panier vide')
      .setDescription(`❌ **${item.productName}** retiré.\nTon panier est maintenant vide.`)
      .setFooter({ text: 'Poulet Factory' });

    const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('back_shop')
        .setLabel('⬅️ Retour à la boutique')
        .setStyle(ButtonStyle.Primary),
    );

    await interaction.update({ embeds: [embed], components: [backRow] });
    await interaction.followUp({ content: `❌ **${item.productName}** retiré du panier.`, ephemeral: true });
  } else {
    // Refresh cart view
    const items = db.prepare('SELECT * FROM carts WHERE discordId = ? ORDER BY addedAt ASC').all(interaction.user.id);
    const total = items.reduce((sum, i) => sum + i.price, 0);
    const itemsList = items.map((it, i) =>
      `**${i + 1}.** ${it.productName} — 💰 ${it.price.toFixed(2)}€`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('🛒 Ton Panier')
      .setDescription(`${itemsList}\n\n💵 **Total : ${total.toFixed(2)}€**`)
      .setFooter({ text: 'Poulet Factory • Panier' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('checkout_cart')
        .setLabel('✅ Commander le panier')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('clear_cart')
        .setLabel('🗑️ Vider le panier')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('back_shop')
        .setLabel('⬅️ Retour boutique')
        .setStyle(ButtonStyle.Secondary),
    );

    const removeRow = new ActionRowBuilder();
    for (const it of items.slice(0, 5)) {
      removeRow.addComponents(
        new ButtonBuilder()
          .setCustomId(`remove_cart_${it.id}`)
          .setLabel(`❌ ${it.productName}`)
          .setStyle(ButtonStyle.Danger),
      );
    }

    const components = removeRow.components.length > 0 ? [row, removeRow] : [row];
    await interaction.update({ embeds: [embed], components });
    await interaction.followUp({ content: `❌ **${item.productName}** retiré du panier.`, ephemeral: true });
  }
}

async function clearCart(interaction) {
  db.prepare('DELETE FROM carts WHERE discordId = ?').run(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('🛒 Panier vidé')
    .setDescription('Ton panier a été vidé avec succès.')
    .setFooter({ text: 'Poulet Factory' });

  const backRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('back_shop')
      .setLabel('⬅️ Retour à la boutique')
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.update({ embeds: [embed], components: [backRow] });
  await interaction.followUp({ content: '🗑️ Panier vidé avec succès.', ephemeral: true });
}

async function showCartOrderModal(interaction) {
  const items = db.prepare('SELECT * FROM carts WHERE discordId = ? ORDER BY addedAt ASC').all(interaction.user.id);
  if (items.length === 0) {
    return interaction.reply({ content: '🛒 Ton panier est vide.', ephemeral: true });
  }

  const total = items.reduce((sum, item) => sum + item.price, 0);

  let user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(interaction.user.id);
  if (!user) {
    db.prepare('INSERT INTO users (discordId, balance) VALUES (?, ?)').run(interaction.user.id, 0);
    user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(interaction.user.id);
  }

  if (user.balance < total) {
    return interaction.reply({
      content: `❌ Solde insuffisant. Total panier: **${total.toFixed(2)}€** | Ton solde: **${user.balance.toFixed(2)}€**\nIl te manque **${(total - user.balance).toFixed(2)}€**.`,
      ephemeral: true,
    });
  }

  // Check stock for all items first
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
    if (!product || product.stock <= 0) {
      return interaction.reply({
        content: `❌ **${item.productName}** n'est plus en stock. Commande annulée.`,
        ephemeral: true,
      });
    }
  }

  // Show ONE modal for the whole cart
  const modal = new ModalBuilder()
    .setCustomId('cart_checkout')
    .setTitle(`🛒 Panier (${items.length} art. - ${total.toFixed(2)}€)`);

  const nameInput = new TextInputBuilder()
    .setCustomId('buyer_name')
    .setLabel('Nom')
    .setPlaceholder('Votre nom de famille')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(50);

  const firstNameInput = new TextInputBuilder()
    .setCustomId('buyer_firstname')
    .setLabel('Prénom')
    .setPlaceholder('Votre prénom')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(50);

  const phoneInput = new TextInputBuilder()
    .setCustomId('buyer_phone')
    .setLabel('📞 Numéro de téléphone')
    .setPlaceholder('Votre numéro (ex: 0612345678)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(20);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(firstNameInput),
    new ActionRowBuilder().addComponents(phoneInput),
  );

  await interaction.showModal(modal);
}

async function processFullCart(interaction) {
  const items = db.prepare('SELECT * FROM carts WHERE discordId = ? ORDER BY addedAt ASC').all(interaction.user.id);
  if (items.length === 0) {
    return interaction.reply({ content: '🛒 Ton panier est vide.', ephemeral: true });
  }

  const buyerName = interaction.fields.getTextInputValue('buyer_name');
  const buyerFirstName = interaction.fields.getTextInputValue('buyer_firstname');
  const buyerPhone = interaction.fields.getTextInputValue('buyer_phone');

  const total = items.reduce((sum, item) => sum + item.price, 0);

  let user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(interaction.user.id);
  if (!user || user.balance < total) {
    return interaction.reply({
      content: '❌ Solde insuffisant. Commande annulée.',
      ephemeral: true,
    });
  }

  // Re-check stock
  for (const item of items) {
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.productId);
    if (!product || product.stock <= 0) {
      return interaction.reply({
        content: `❌ **${item.productName}** n'est plus en stock. Commande annulée.`,
        ephemeral: true,
      });
    }
  }

  // Deduct total balance
  db.prepare('UPDATE users SET balance = balance - ? WHERE discordId = ?').run(total, interaction.user.id);

  const orderIds = [];

  // Create all orders with the same phone
  for (const item of items) {
    db.prepare('UPDATE products SET stock = stock - 1 WHERE id = ?').run(item.productId);

    const orderResult = db.prepare(
      'INSERT INTO orders (discordId, productName, price, buyerName, buyerFirstName, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(interaction.user.id, item.productName, item.price, buyerName, buyerFirstName, buyerPhone, 'pending');

    orderIds.push(orderResult.lastInsertRowid);
  }

  // Create ONE ticket for all orders
  const category = interaction.guild.channels.cache.get(config.ticketCategoryId);
  if (!category) {
    return interaction.reply({ content: '❌ Catégorie de tickets introuvable.', ephemeral: true });
  }

  const ticketName = items.length === 1
    ? `ticket-${buyerFirstName.toLowerCase()}-${buyerName.toLowerCase()}`
    : `panier-${buyerFirstName.toLowerCase()}-${buyerName.toLowerCase()}`;

  const ticketChannel = await interaction.guild.channels.create({
    name: ticketName,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: config.cuistotRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: config.adminRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ],
  });

  // Link all orders to this ticket
  for (const oid of orderIds) {
    db.prepare('UPDATE orders SET channelId = ? WHERE id = ?').run(ticketChannel.id, oid);
  }

  // Build embed
  const itemsList = items.map((item, i) =>
    `**#${orderIds[i]}** — ${item.productName} — ${item.price.toFixed(2)}€`
  ).join('\n');

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle(items.length > 1 ? '🛒 Commande Panier' : '🍗 Nouvelle Commande')
    .setDescription(items.length > 1 ? `Panier de **${items.length}** articles` : 'Commande d\'un article')
    .addFields(
      { name: '👤 Client', value: `<@${interaction.user.id}>`, inline: true },
      { name: '💰 Total', value: `${total.toFixed(2)}€`, inline: true },
      { name: '📝 Nom', value: `${buyerFirstName} ${buyerName}`, inline: true },
      { name: '📞 Téléphone', value: buyerPhone, inline: true },
      { name: '📦 Articles', value: itemsList, inline: false },
      { name: '📅 Date', value: new Date().toLocaleString('fr-FR'), inline: false },
    )
    .setFooter({ text: 'Poulet Factory • Ticket de commande' })
    .setTimestamp();

  const firstOrderId = orderIds[0];
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`validate_${firstOrderId}`)
      .setLabel('✅ Valider commande')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`refuse_order_${firstOrderId}`)
      .setLabel('❌ Refuser & Rembourser')
      .setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({
    content: `<@&${config.cuistotRoleId}> Nouvelle commande ${items.length > 1 ? `panier (${items.length} articles)` : ''} à préparer !`,
    embeds: [embed],
    components: [row],
  });

  db.prepare('DELETE FROM carts WHERE discordId = ?').run(interaction.user.id);

  await interaction.reply({
    content: `✅ Commande créée !\n📋 Ticket : ${ticketChannel}\n📌 **Même numéro** pour tous les articles. Délie entre chaque pour passer au suivant.`,
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────
// ORDER MODAL
// ─────────────────────────────────────────────

async function showOrderModal(interaction, productId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product || product.stock <= 0) {
    return interaction.reply({
      content: '❌ Ce produit n\'est plus disponible.',
      ephemeral: true,
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`order_${productId}`)
    .setTitle(`Commande - ${product.name}`);

  const nameInput = new TextInputBuilder()
    .setCustomId('buyer_name')
    .setLabel('Nom')
    .setPlaceholder('Votre nom de famille')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(50);

  const firstNameInput = new TextInputBuilder()
    .setCustomId('buyer_firstname')
    .setLabel('Prénom')
    .setPlaceholder('Votre prénom')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(50);

  const phoneInput = new TextInputBuilder()
    .setCustomId('buyer_phone')
    .setLabel('Numéro de téléphone')
    .setPlaceholder('Votre numéro (ex: 0612345678)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(20);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(firstNameInput),
    new ActionRowBuilder().addComponents(phoneInput),
  );

  await interaction.showModal(modal);
}

async function processOrder(interaction, productId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);
  if (!product || product.stock <= 0) {
    return interaction.reply({
      content: '❌ Ce produit n\'est plus disponible.',
      ephemeral: true,
    });
  }

  const buyerName = interaction.fields.getTextInputValue('buyer_name');
  const buyerFirstName = interaction.fields.getTextInputValue('buyer_firstname');
  const buyerPhone = interaction.fields.getTextInputValue('buyer_phone');

  // Check if phone already used (pending = ticket ouvert, completed = pas encore délié)
  const existingOrder = db.prepare("SELECT * FROM orders WHERE phone = ? AND status IN ('pending', 'completed')").get(buyerPhone);
  if (existingOrder) {
    return interaction.reply({
      content: `❌ Ce numéro (**${buyerPhone}**) est déjà lié à la commande #${existingOrder.id}.\nVeuillez **délier** votre numéro depuis le ticket existant ou utiliser un autre numéro.`,
      ephemeral: true,
    });
  }

  // Check or create user
  let user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(interaction.user.id);
  if (!user) {
    db.prepare('INSERT INTO users (discordId, balance) VALUES (?, ?)').run(interaction.user.id, 0);
    user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(interaction.user.id);
  }

  // Check balance
  if (user.balance < product.price) {
    return interaction.reply({
      content: `❌ Solde insuffisant. Il vous manque ${(product.price - user.balance).toFixed(2)}€.\nUtilisez **Compte Client** pour recharger.`,
      ephemeral: true,
    });
  }

  // Deduct balance
  db.prepare('UPDATE users SET balance = balance - ? WHERE discordId = ?').run(product.price, interaction.user.id);

  // Create order
  const orderResult = db.prepare(
    'INSERT INTO orders (discordId, productName, price, buyerName, buyerFirstName, phone, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(interaction.user.id, product.name, product.price, buyerName, buyerFirstName, buyerPhone, 'pending');

  const orderId = orderResult.lastInsertRowid;

  // Update stock
  db.prepare('UPDATE products SET stock = stock - 1 WHERE id = ?').run(productId);

  // Create private ticket channel
  const category = interaction.guild.channels.cache.get(config.ticketCategoryId);
  if (!category) {
    return interaction.reply({
      content: '❌ Erreur de configuration : catégorie de tickets introuvable.',
      ephemeral: true,
    });
  }

  const ticketChannel = await interaction.guild.channels.create({
    name: `ticket-${buyerFirstName.toLowerCase()}-${buyerName.toLowerCase()}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: config.cuistotRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: config.adminRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  // Update order with channelId
  db.prepare('UPDATE orders SET channelId = ? WHERE id = ?').run(ticketChannel.id, orderId);

  // Send order info to ticket
  const orderEmbed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('🍗 Nouvelle Commande')
    .setDescription('Un client a passé une nouvelle commande !')
    .addFields(
      { name: '👤 Client', value: `<@${interaction.user.id}>`, inline: true },
      { name: '📦 Produit', value: product.name, inline: true },
      { name: '💰 Prix', value: `${product.price.toFixed(2)}€`, inline: true },
      { name: '📝 Nom', value: `${buyerFirstName} ${buyerName}`, inline: true },
      { name: '📞 Téléphone', value: buyerPhone, inline: true },
      { name: '🆔 Commande', value: `#${orderId}`, inline: true },
      { name: '📅 Date', value: new Date().toLocaleString('fr-FR'), inline: false },
    )
    .setFooter({ text: 'Poulet Factory • Ticket de commande' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`validate_${orderId}`)
      .setLabel('✅ Valider commande')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`refuse_order_${orderId}`)
      .setLabel('❌ Refuser & Rembourser')
      .setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({
    content: `<@&${config.cuistotRoleId}> Nouvelle commande à préparer !`,
    embeds: [orderEmbed],
    components: [row],
  });

  await interaction.reply({
    content: `✅ Votre commande a été créée avec succès ! Rendez-vous dans votre ticket : ${ticketChannel}`,
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────
// ACCOUNT
// ─────────────────────────────────────────────

async function showAccount(interaction) {
  let user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(interaction.user.id);
  if (!user) {
    db.prepare('INSERT INTO users (discordId, balance) VALUES (?, ?)').run(interaction.user.id, 0);
    user = db.prepare('SELECT * FROM users WHERE discordId = ?').get(interaction.user.id);
  }

  const orderCount = db.prepare('SELECT COUNT(*) as count FROM orders WHERE discordId = ?').get(interaction.user.id);
  const pendingRecharges = db.prepare(
    'SELECT COUNT(*) as count FROM transactions WHERE discordId = ? AND type = ? AND status = ?'
  ).get(interaction.user.id, 'recharge', 'pending');
  const recentOrders = db.prepare('SELECT * FROM orders WHERE discordId = ? ORDER BY createdAt DESC LIMIT 5').all(interaction.user.id);

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('💳 Compte Client')
    .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
    .addFields(
      { name: '🆔 ID Discord', value: `\`${interaction.user.id}\``, inline: false },
      { name: '👤 Pseudo', value: interaction.user.tag, inline: true },
      { name: '💰 Solde disponible', value: `${user.balance.toFixed(2)}€`, inline: true },
      { name: '📦 Commandes', value: `${orderCount.count}`, inline: true },
      { name: '⏳ Recharges en attente', value: `${pendingRecharges.count}`, inline: true },
    )
    .setFooter({ text: 'Poulet Factory • Compte Client' })
    .setTimestamp();

  if (recentOrders.length > 0) {
    const statusIcon = s => s === 'closed' ? '✅' : s === 'completed' ? '☑️' : s === 'refused' ? '❌' : '⏳';
    const historyText = recentOrders.map(o =>
      `**#${o.id}** - ${o.productName} - ${o.price.toFixed(2)}€ - ${statusIcon(o.status)}`
    ).join('\n');
    embed.addFields({ name: '📋 Dernières commandes', value: historyText, inline: false });
  }

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('recharge_paypal')
      .setLabel('💳 PayPal')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('recharge_crypto')
      .setLabel('₿ Crypto')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('recharge_revolut')
      .setLabel('💶 Revolut')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('recharge_paysafecard')
      .setLabel('🎫 Paysafecard')
      .setStyle(ButtonStyle.Primary),
  );

  const cartCount = db.prepare('SELECT COUNT(*) as count FROM carts WHERE discordId = ?').get(interaction.user.id).count;

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('historique_comptes')
      .setLabel('📋 Historique des comptes')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('view_cart')
      .setLabel(`🛒 Panier (${cartCount})`)
      .setStyle(ButtonStyle.Primary)
      .setDisabled(cartCount === 0),
  );

  await interaction.reply({ embeds: [embed], components: [row, row2], ephemeral: true });
}

async function showAccountHistory(interaction) {
  const statusIcon = s => s === 'closed' ? '✅' : s === 'completed' ? '☑️' : s === 'refused' ? '❌' : '⏳';
  const statusLabel = s => s === 'completed' ? 'En attente de déliage' : s === 'closed' ? 'Terminé' : s === 'refused' ? 'Annulé' : 'En cours';

  const orders = db.prepare('SELECT * FROM orders WHERE discordId = ? AND accountInfo IS NOT NULL ORDER BY createdAt DESC').all(interaction.user.id);

  if (orders.length === 0) {
    return interaction.reply({
      content: '📋 Vous n\'avez pas encore de comptes dans votre historique.',
      ephemeral: true,
    });
  }

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('📋 Historique des comptes')
    .setDescription('Tous les comptes que vous avez commandés :')
    .setFooter({ text: 'Poulet Factory • Historique' })
    .setTimestamp();

  for (const o of orders.slice(0, 10)) {
    const isPhone = /^[\d\s\+\-\(\)]{6,20}$/.test((o.accountInfo || '').trim());
    const accountDisplay = isPhone
      ? `[📞 ${o.accountInfo.trim()}](tel:${o.accountInfo.trim().replace(/\s/g, '')})`
      : `\`${o.accountInfo}\``;
    embed.addFields({
      name: `#${o.id} - ${o.productName} ${statusIcon(o.status)}`,
      value: `📦 ${o.productName} — ${o.price.toFixed(2)}€\n🔑 ${accountDisplay}\n📌 ${statusLabel(o.status)}`,
      inline: false,
    });
  }

  if (orders.length > 10) {
    embed.setFooter({ text: `Poulet Factory • ${orders.length} comptes au total (10 affichés)` });
  }

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function showRechargeModal(interaction, method) {
  const methodMap = {
    paypal: '💳 PayPal',
    crypto: '₿ Crypto',
    revolut: '💶 Revolut',
    paysafecard: '🎫 Paysafecard',
  };

  const modal = new ModalBuilder()
    .setCustomId(`recharge_modal_${method}`)
    .setTitle(`Recharge - ${methodMap[method] || method}`);

  const amountInput = new TextInputBuilder()
    .setCustomId('recharge_amount')
    .setLabel('Montant à recharger (€)')
    .setPlaceholder('Ex: 20.00')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(10);

  modal.addComponents(new ActionRowBuilder().addComponents(amountInput));

  await interaction.showModal(modal);
}

async function processRecharge(interaction, method) {
  const amountStr = interaction.fields.getTextInputValue('recharge_amount');
  const amount = parseFloat(amountStr);

  if (isNaN(amount) || amount <= 0) {
    return interaction.reply({
      content: '❌ Montant invalide. Veuillez entrer un nombre positif.',
      ephemeral: true,
    });
  }
  if (amount > 500) {
    return interaction.reply({
      content: '❌ Le montant maximum par recharge est de 500€.',
      ephemeral: true,
    });
  }

  const methodNames = { paypal: 'PayPal', crypto: 'Crypto', revolut: 'Revolut', paysafecard: 'Paysafecard' };
  const methodEmojis = { paypal: '💳', crypto: '₿', revolut: '💶', paysafecard: '🎫' };

  const tx = db.prepare(
    'INSERT INTO transactions (discordId, amount, type, method, status) VALUES (?, ?, ?, ?, ?)'
  ).run(interaction.user.id, amount, 'recharge', method, 'pending');

  if (method === 'crypto') {
    const oxapay = require('../services/oxapay');
    const orderId = `pf-${tx.lastInsertRowid}-${Date.now()}`;

    const result = await oxapay.createInvoice(amount, orderId, `Recharge Poulet Factory #${tx.lastInsertRowid}`);

    if (result.success) {
      db.prepare(
        'UPDATE transactions SET status = ?, method = ? WHERE id = ?'
      ).run('pending_crypto', `crypto_${result.trackId}`, tx.lastInsertRowid);

      const embed = new EmbedBuilder()
        .setColor(parseInt(config.colorGold.replace('#', ''), 16))
        .setTitle('₿ Paiement Crypto')
        .setDescription(
          'Clique sur le lien ci-dessous pour payer en crypto :\n\n' +
          '⚠️ **IMPORTANT :**\n' +
          '• Reste sur la page de paiement jusqu\'à ce que le message de confirmation apparaisse sur le serveur\n' +
          '• Attends bien la **validation blockchain** avant de fermer quoi que ce soit\n' +
          '• Si tu fermes avant la validation, **tu perds ton argent** et nous ne pouvons rien y faire\n\n' +
          '✅ Une fois le paiement confirmé, clique sur **"🔄 Vérifier paiement"** ci-dessous'
        )
        .addFields(
          { name: '💰 Montant', value: `${amount.toFixed(2)}€`, inline: true },
          { name: '⏳ Expiration', value: `${config.oxapay.lifetime} minutes`, inline: true },
          { name: '🔗 Lien de paiement', value: `[Clique ici pour payer](${result.payLink})`, inline: false },
        )
        .setFooter({ text: 'Poulet Factory • Paiement Crypto' })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(result.payLink)
          .setLabel('₿ Payer en Crypto'),
        new ButtonBuilder()
          .setCustomId(`check_crypto_${tx.lastInsertRowid}_${result.trackId}`)
          .setLabel('🔄 Vérifier paiement')
          .setStyle(ButtonStyle.Secondary),
      );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
      return; // Crypto = auto, pas de ping admin
    } else {
      await interaction.reply({
        content: `❌ Erreur lors de la création du paiement crypto : ${result.error}`,
        ephemeral: true,
      });
    }
  } else {
    const paymentConfig = method === 'paysafecard' ? config.paysafecard : (method === 'paypal' ? config.paypal : config.revolut);

    const embedFields = [
      { name: '📋 Instructions', value: paymentConfig.text, inline: false },
      { name: '💰 Montant', value: `${amount.toFixed(2)}€`, inline: true },
      { name: '🆔 Transaction', value: `#${tx.lastInsertRowid}`, inline: true },
      { name: '📌 Important', value: 'Après le paiement, ping un admin avec l\'ID de transaction pour valider.', inline: false },
    ];
    if (paymentConfig.link) {
      embedFields.splice(1, 0, { name: '🔗 Lien', value: paymentConfig.link, inline: false });
    }

    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle(`${methodEmojis[method]} Paiement ${methodNames[method]}`)
      .setDescription(`Recharge de **${amount.toFixed(2)}€**`)
      .addFields(embedFields)
      .setFooter({ text: `Poulet Factory • ${methodNames[method]}` })
      .setTimestamp();

    const resultRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`ping_admin_${tx.lastInsertRowid}_${method}`)
        .setLabel('🆘 Ping Admin')
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.reply({ embeds: [embed], components: [resultRow], ephemeral: true });

    if (interaction.guild) {
      const adminChannel = interaction.guild.channels.cache.find(c => c.name === 'admin-logs');
      const adminRole = interaction.guild.roles.cache.get(config.adminRoleId);

      if (adminChannel) {
        const alertEmbedFields = [
          { name: '👤 Client', value: `<@${interaction.user.id}>`, inline: true },
          { name: '💰 Montant', value: `${amount.toFixed(2)}€`, inline: true },
          { name: '💳 Méthode', value: methodNames[method], inline: true },
          { name: '🆔 Transaction', value: `#${tx.lastInsertRowid}`, inline: false },
        ];
        if (paymentConfig.link) {
          alertEmbedFields.splice(3, 0, { name: '🔗 Lien', value: paymentConfig.link, inline: false });
        }

        const alertEmbed = new EmbedBuilder()
          .setColor(parseInt(config.colorGold.replace('#', ''), 16))
          .setTitle(`${methodEmojis[method]} Demande de Recharge ${methodNames[method]}`)
          .setDescription(`<@${interaction.user.id}> veut recharger ${amount.toFixed(2)}€`)
          .addFields(alertEmbedFields)
          .setTimestamp();

        const confirmRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId(`confirm_recharge_${tx.lastInsertRowid}`)
            .setLabel('✅ Confirmer paiement')
            .setStyle(ButtonStyle.Success),
        );

        await adminChannel.send({
          content: adminRole ? `<@&${config.adminRoleId}>` : '',
          embeds: [alertEmbed],
          components: [confirmRow],
        });
      }
    }
  }
}

// ─────────────────────────────────────────────
// TICKET: VALIDATE
// ─────────────────────────────────────────────

async function showValidateModal(interaction, orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return interaction.reply({
      content: '❌ Commande introuvable.',
      ephemeral: true,
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`validate_ticket_${orderId}`)
    .setTitle('✅ Valider la commande');

  const accountInput = new TextInputBuilder()
    .setCustomId('account_info')
    .setLabel('Compte Poulet à envoyer')
    .setPlaceholder('Entrez les identifiants du compte poulet...')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(5)
    .setMaxLength(1000);

  modal.addComponents(new ActionRowBuilder().addComponents(accountInput));

  await interaction.showModal(modal);
}

async function validateOrder(interaction, orderId) {
  if (!interaction.member.roles.cache.has(config.cuistotRoleId) && !interaction.member.roles.cache.has(config.adminRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }

  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return interaction.reply({
      content: '❌ Commande introuvable.',
      ephemeral: true,
    });
  }

  const accountInfo = interaction.fields.getTextInputValue('account_info');

  // Get payment method from user's last completed transaction
  const lastTx = db.prepare(
    "SELECT method FROM transactions WHERE discordId = ? AND status = ? ORDER BY createdAt DESC LIMIT 1"
  ).get(order.discordId, 'completed');
  const paymentMethod = lastTx ? lastTx.method : 'solde';
  db.prepare('UPDATE orders SET status = ?, accountInfo = ?, completedAt = datetime(\'now\'), paymentMethod = ? WHERE id = ?')
    .run('completed', accountInfo, paymentMethod || 'solde', orderId);

  try {
    const customer = await interaction.client.users.fetch(order.discordId);
    const member = await interaction.guild.members.fetch(order.discordId);
    const fideleRole = interaction.guild.roles.cache.get('1519525206022946969');
    if (fideleRole && member) {
      await member.roles.add(fideleRole).catch(() => {});
    }
  } catch (e) {}

  const isPhone = /^[\d\s\+\-\(\)]{6,20}$/.test(accountInfo.trim());
  const accountDisplay = isPhone
    ? `[📞 ${accountInfo.trim()}](tel:${accountInfo.trim().replace(/\s/g, '')})`
    : accountInfo;

  // Check if there are more pending orders in the same channel (multi-item cart)
  const pendingCount = db.prepare(
    "SELECT COUNT(*) as count FROM orders WHERE channelId = ? AND discordId = ? AND status = 'pending'"
  ).get(order.channelId, order.discordId).count;

  const isLastItem = pendingCount === 0;
  const delierLabel = isLastItem ? '🔗 Délier son numéro & Fermer' : '🔗 Délier son numéro & Prendre le suivant';
  const delierCustomId = isLastItem ? `delier_numero_${orderId}` : `delier_cart_${orderId}`;

  const validatedEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Commande Validée')
    .setDescription(`La commande **#${orderId}** a été validée par <@${interaction.user.id}>`)
    .addFields(
      { name: '📦 Produit', value: order.productName, inline: true },
      { name: '💰 Prix', value: `${order.price.toFixed(2)}€`, inline: true },
      { name: '🔑 Compte Poulet', value: accountDisplay, inline: false },
    )
    .setFooter({ text: 'Poulet Factory • Commande terminée' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(delierCustomId)
      .setLabel(delierLabel)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`sav_${orderId}`)
      .setLabel('🔧 SAV')
      .setStyle(ButtonStyle.Primary),
  );

  await interaction.update({ embeds: [validatedEmbed], components: [row] });

  const phoneLink = isPhone
    ? `📞 **Compte :** [${accountInfo.trim()}](${`tel:${accountInfo.trim().replace(/\s/g, '')}`})`
    : `🔑 **Compte :** ${accountInfo}`;

  const dmContent = isLastItem
    ? `<@${order.discordId}> Votre compte est disponible ci-dessus !\n${phoneLink}\n\n` +
      `⚠️ **Important :** Pour pouvoir réutiliser le même numéro plus tard, vous devez cliquer sur **"🔗 Délier son numéro & Fermer"** au-dessus.\n` +
      `Tant que vous ne cliquez pas sur ce bouton, votre numéro reste lié à cette commande.\n\n` +
      `Bon appétit 🍗 N'oubliez pas de laisser un avis dans <#1519316498882232330> !`
    : `<@${order.discordId}> Compte **${order.productName}** disponible !\n${phoneLink}\n\n` +
      `📌 Clique sur **"🔗 Délier son numéro & Prendre le suivant"** pour libérer le numéro et passer au compte suivant.`;

  await interaction.channel.send({ content: dmContent });
}

// ─────────────────────────────────────────────
// TICKET: CLOSE
// ─────────────────────────────────────────────

async function closeTicket(interaction, orderId) {
  if (!interaction.member.roles.cache.has(config.cuistotRoleId) && !interaction.member.roles.cache.has(config.adminRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);

  const confirmEmbed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('❌ Fermeture du ticket')
    .setDescription('Le ticket va être fermé dans **5 secondes**...')
    .setFooter({ text: 'Poulet Factory' });

  await interaction.update({ embeds: [confirmEmbed], components: [] });

  setTimeout(async () => {
    try {
      const channel = interaction.guild.channels.cache.get(interaction.channelId);
      if (channel) await channel.delete();
    } catch (e) {
      console.error('Erreur lors de la suppression du ticket:', e);
    }
  }, 5000);
}

async function delierNumero(interaction, orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return interaction.reply({ content: '❌ Commande introuvable.', ephemeral: true });

  if (interaction.user.id !== order.discordId) {
    return interaction.reply({ content: '❌ Seul le client peut délier son numéro.', ephemeral: true });
  }

  const channel = interaction.channel;
  const customerId = order.discordId;
  const reviewChannelId = '1519316498882232330';

  // Libérer le numéro pour réutilisation
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('closed', orderId);

  await channel.permissionOverwrites.edit(customerId, {
    ViewChannel: false,
  });

  const oldRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`delier_numero_${orderId}`)
      .setLabel('🔗 Délier son numéro & Fermer')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`sav_${orderId}`)
      .setLabel('🔧 SAV')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
  );
  try { await interaction.message.edit({ components: [oldRow] }); } catch (e) {}

  await interaction.reply({
    content: `✅ Vous avez été délié du ticket. Laissez un avis dans <#${reviewChannelId}> et profitez de votre compte ! Bon appétit 🍗`,
    ephemeral: true,
  });

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('🔗 Client délié')
    .setDescription(`<@${customerId}> a été retiré du ticket.`)
    .addFields(
      { name: '📞 Numéro', value: `\`${order.phone}\``, inline: true },
      { name: '📦 Produit', value: order.productName, inline: true },
      { name: '📌 Action requise', value: 'Délie le numéro du compte client, puis ferme le ticket.', inline: false },
    )
    .setFooter({ text: 'Poulet Factory' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fermer_ticket_${orderId}`)
      .setLabel('✅ Oui, fermer le ticket')
      .setStyle(ButtonStyle.Danger),
  );

  await channel.send({
    content: `<@&${config.cuistotRoleId}> Le client a été expulsé du ticket.\n📞 **Numéro à délier :** \`${order.phone}\`\nPuis confirme la fermeture.`,
    embeds: [embed],
    components: [row],
  });
}

async function fermerTicket(interaction, orderId) {
  if (!interaction.member.roles.cache.has(config.cuistotRoleId) && !interaction.member.roles.cache.has(config.adminRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }

  db.prepare('UPDATE orders SET status = ? WHERE id = ? AND status NOT IN (?)').run('closed', orderId, 'refused');

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('❌ Fermeture du ticket')
    .setDescription('Le ticket va être fermé dans **5 secondes**...')
    .setFooter({ text: 'Poulet Factory' });

  await interaction.update({ embeds: [embed], components: [] });

  setTimeout(async () => {
    try {
      const ch = interaction.channel;
      if (ch && ch.deletable) await ch.delete();
    } catch (e) {}
  }, 5000);
}

async function delierCartItem(interaction, orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return interaction.reply({ content: '❌ Commande introuvable.', ephemeral: true });

  if (interaction.user.id !== order.discordId) {
    return interaction.reply({ content: '❌ Seul le client peut délier son numéro.', ephemeral: true });
  }

  // Free the phone
  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('closed', orderId);

  db.prepare('DELETE FROM carts WHERE discordId = ?').run(interaction.user.id);

  // Disable old buttons
  const oldRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`delier_cart_${orderId}`)
      .setLabel('🔗 Délier son numéro & Prendre le suivant')
      .setStyle(ButtonStyle.Danger)
      .setDisabled(true),
    new ButtonBuilder()
      .setCustomId(`sav_${orderId}`)
      .setLabel('🔧 SAV')
      .setStyle(ButtonStyle.Primary)
      .setDisabled(true),
  );
  try { await interaction.message.edit({ components: [oldRow] }); } catch (e) {}

  await interaction.reply({
    content: `✅ Numéro **${order.phone}** libéré ! Passage au compte suivant...`,
    ephemeral: true,
  });

  // Find the next pending order in the same channel
  const nextOrder = db.prepare(
    "SELECT * FROM orders WHERE channelId = ? AND discordId = ? AND status = 'pending' ORDER BY id ASC LIMIT 1"
  ).get(interaction.channelId, order.discordId);

  if (nextOrder) {
    const embed = new EmbedBuilder()
      .setColor(parseInt(config.colorGold.replace('#', ''), 16))
      .setTitle('🔄 Prêt pour le compte suivant')
      .setDescription(`Le numéro **${order.phone}** a été libéré.`)
      .addFields(
        { name: '📦 Prochain article', value: nextOrder.productName, inline: true },
        { name: '💰 Prix', value: `${nextOrder.price.toFixed(2)}€`, inline: true },
        { name: '📞 Téléphone', value: nextOrder.phone, inline: true },
      )
      .setFooter({ text: 'Poulet Factory' })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`validate_${nextOrder.id}`)
        .setLabel('✅ Valider commande')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId(`refuse_order_${nextOrder.id}`)
        .setLabel('❌ Refuser & Rembourser')
        .setStyle(ButtonStyle.Danger),
    );

    await interaction.channel.send({
      content: `<@&${config.cuistotRoleId}> Le client a libéré son numéro, vous pouvez valider le **${nextOrder.productName}** !`,
      embeds: [embed],
      components: [row],
    });
  }
}

async function refuseOrder(interaction, orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) return interaction.reply({ content: '❌ Commande introuvable.', ephemeral: true });
  if (order.status !== 'pending') return interaction.reply({ content: '❌ Commande déjà traitée.', ephemeral: true });

  db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('refused', orderId);

  db.prepare('UPDATE users SET balance = balance + ? WHERE discordId = ?').run(order.price, order.discordId);

  const product = db.prepare('SELECT id FROM products WHERE name = ?').get(order.productName);
  if (product) {
    db.prepare('UPDATE products SET stock = stock + 1 WHERE id = ?').run(product.id);
  }

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('❌ Commande Refusée')
    .setDescription(`Commande **#${orderId}** refusée par <@${interaction.user.id}>`)
    .addFields(
      { name: '👤 Client', value: `<@${order.discordId}>`, inline: true },
      { name: '📦 Produit', value: order.productName, inline: true },
      { name: '💰 Remboursé', value: `${order.price.toFixed(2)}€`, inline: true },
    )
    .setFooter({ text: 'Poulet Factory' })
    .setTimestamp();

  await interaction.update({ embeds: [embed], components: [] });

  try {
    const user = await interaction.client.users.fetch(order.discordId);
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Commande Refusée')
      .setDescription(`Votre commande **${order.productName}** a été refusée.`)
      .addFields(
        { name: '💰 Remboursement', value: `${order.price.toFixed(2)}€ crédité sur votre solde`, inline: false },
      )
      .setFooter({ text: 'Poulet Factory' })
      .setTimestamp();
    await user.send({ embeds: [dmEmbed] });
  } catch (e) {}

  setTimeout(async () => {
    try {
      const ch = interaction.channel;
      if (ch && ch.deletable) await ch.delete();
    } catch (e) {}
  }, 3000);
}

async function deleteProduct(interaction, productId) {
  db.prepare('DELETE FROM products WHERE id = ?').run(productId);
  await interaction.reply({
    content: '✅ Produit supprimé avec succès !',
    ephemeral: true,
  });
}

// ─────────────────────────────────────────────
// ADMIN: EDIT PRODUCT MODAL
// ─────────────────────────────────────────────

async function showEditProductModal(interaction, productId) {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(productId);

  const modal = new ModalBuilder()
    .setCustomId('edit_product')
    .setTitle(`Modifier le produit #${productId}`);

  const nameInput = new TextInputBuilder()
    .setCustomId('edit_name')
    .setLabel('Nom du produit')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(product.name);

  const priceInput = new TextInputBuilder()
    .setCustomId('edit_price')
    .setLabel('Prix (€)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(product.price.toString());

  const stockInput = new TextInputBuilder()
    .setCustomId('edit_stock')
    .setLabel('Stock')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(product.stock.toString());

  const descInput = new TextInputBuilder()
    .setCustomId('edit_description')
    .setLabel('Description')
    .setStyle(TextInputStyle.Short)
    .setRequired(false)
    .setValue(product.description || '');

  const idInput = new TextInputBuilder()
    .setCustomId('edit_id')
    .setLabel('ID (ne pas modifier)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setValue(productId.toString());

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(priceInput),
    new ActionRowBuilder().addComponents(stockInput),
    new ActionRowBuilder().addComponents(descInput),
    new ActionRowBuilder().addComponents(idInput),
  );

  await interaction.showModal(modal);
}

async function saveEditedProduct(interaction) {
  const id = interaction.fields.getTextInputValue('edit_id');
  const name = interaction.fields.getTextInputValue('edit_name');
  const price = parseFloat(interaction.fields.getTextInputValue('edit_price'));
  const stock = parseInt(interaction.fields.getTextInputValue('edit_stock'));
  const description = interaction.fields.getTextInputValue('edit_description') || '';

  if (isNaN(price) || price <= 0) {
    return interaction.reply({ content: '❌ Prix invalide.', ephemeral: true });
  }
  if (isNaN(stock) || stock < 0) {
    return interaction.reply({ content: '❌ Stock invalide.', ephemeral: true });
  }

  db.prepare('UPDATE products SET name = ?, price = ?, stock = ?, description = ? WHERE id = ?')
    .run(name, price, stock, description, id);

  await interaction.reply({
    content: `✅ Produit **${name}** mis à jour avec succès !`,
    ephemeral: true,
  });
}

async function saveNewProduct(interaction) {
  const name = interaction.fields.getTextInputValue('new_name');
  const price = parseFloat(interaction.fields.getTextInputValue('new_price'));
  const stock = parseInt(interaction.fields.getTextInputValue('new_stock'));
  const description = interaction.fields.getTextInputValue('new_description') || '';

  if (isNaN(price) || price <= 0) {
    return interaction.reply({ content: '❌ Prix invalide.', ephemeral: true });
  }
  if (isNaN(stock) || stock < 0) {
    return interaction.reply({ content: '❌ Stock invalide.', ephemeral: true });
  }

  db.prepare('INSERT INTO products (name, price, stock, description) VALUES (?, ?, ?, ?)')
    .run(name, price, stock, description);

  await interaction.reply({
    content: `✅ Produit **${name}** ajouté avec succès !`,
    ephemeral: true,
  });
}

async function confirmRecharge(interaction, txId) {
  if (!interaction.member.roles.cache.has(config.adminRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }

  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  if (!tx) {
    return interaction.reply({ content: '❌ Transaction introuvable.', ephemeral: true });
  }
  if (tx.status !== 'pending') {
    return interaction.reply({ content: '❌ Cette transaction a déjà été traitée.', ephemeral: true });
  }

  db.prepare('UPDATE users SET balance = balance + ? WHERE discordId = ?').run(tx.amount, tx.discordId);
  db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('completed', txId);

  const user = await interaction.client.users.fetch(tx.discordId);

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Paiement Confirmé')
    .setDescription(`Recharge de **${tx.amount.toFixed(2)}€** confirmée pour <@${tx.discordId}>`)
    .addFields(
      { name: '👤 Client', value: `<@${tx.discordId}>`, inline: true },
      { name: '💰 Montant', value: `${tx.amount.toFixed(2)}€`, inline: true },
      { name: '💳 Méthode', value: tx.method, inline: true },
      { name: '✅ Validé par', value: `<@${interaction.user.id}>`, inline: true },
    )
    .setTimestamp();

  await interaction.update({ embeds: [embed], components: [] });

  try {
    const dmEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('💰 Recharge Confirmée')
      .setDescription(`Votre recharge de **${tx.amount.toFixed(2)}€** a été confirmée !`)
      .addFields(
        { name: '💳 Méthode', value: tx.method, inline: true },
        { name: '🆔 Transaction', value: `#${txId}`, inline: true },
      )
      .setFooter({ text: 'Poulet Factory' })
      .setTimestamp();
    await user.send({ embeds: [dmEmbed] });
  } catch (e) {}
}

async function checkCryptoPayment(interaction, txId, trackId) {
  const oxapay = require('../services/oxapay');
  const result = await oxapay.checkPayment(trackId);

  if (result.success && result.paid) {
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
    if (tx && tx.status === 'pending_crypto') {
      db.prepare('UPDATE users SET balance = balance + ? WHERE discordId = ?').run(tx.amount, tx.discordId);
      db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('completed', txId);
    }

    return interaction.reply({
      content: `✅ **Paiement confirmé !** ${tx ? tx.amount.toFixed(2) + '€ ont été crédités sur votre compte.' : ''}`,
      ephemeral: true,
    });
  }

  if (result.success && result.status === 'expired') {
    return interaction.reply({
      content: '❌ Ce lien de paiement a expiré. Veuillez générer un nouveau paiement.',
      ephemeral: true,
    });
  }

  await interaction.reply({
    content: `⏳ Paiement en attente... Statut: **${result.status || 'inconnu'}**\nEffectuez le paiement via le lien fourni puis réessayez.`,
    ephemeral: true,
  });
}

async function showRechargeAmountModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('recharge_amount')
    .setTitle('Recharger mon compte');

  const amountInput = new TextInputBuilder()
    .setCustomId('amount')
    .setLabel('Montant à recharger (€)')
    .setPlaceholder('Ex: 20.00')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(1)
    .setMaxLength(10);

  modal.addComponents(new ActionRowBuilder().addComponents(amountInput));

  await interaction.showModal(modal);
}

async function showClientPaymentModal(interaction, txId, method) {
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  if (!tx || tx.status !== 'pending') {
    return interaction.reply({ content: '❌ Cette transaction a déjà été traitée.', ephemeral: true });
  }

  const labels = {
    paypal: { title: 'Votre PayPal', label: 'Votre nom/lien PayPal', placeholder: 'Ex: paypal.me/votrenom' },
    revolut: { title: 'Vos infos Revolut', label: 'Nom & Prénom', placeholder: 'Ex: Dupont Jean' },
    paysafecard: { title: 'Code Paysafecard', label: 'Code du ticket Paysafecard', placeholder: 'Ex: 1234-5678-9012-3456' },
  };
  const info = labels[method] || labels.paypal;

  const modal = new ModalBuilder()
    .setCustomId(`client_paypal_${txId}_${method}`)
    .setTitle(info.title);

  const input = new TextInputBuilder()
    .setCustomId('client_paypal')
    .setLabel(info.label)
    .setPlaceholder(info.placeholder)
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  modal.addComponents(new ActionRowBuilder().addComponents(input));

  await interaction.showModal(modal);
}

async function createRechargeTicketFromModal(interaction, txId, method) {
  const clientPayment = interaction.fields.getTextInputValue('client_paypal');
  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);

  if (!tx) {
    return interaction.reply({ content: '❌ Transaction introuvable.', ephemeral: true });
  }
  if (tx.status !== 'pending' || tx.channelId) {
    return interaction.reply({ content: '❌ Un ticket existe déjà pour cette transaction.', ephemeral: true });
  }

  const guild = interaction.guild || await interaction.client.guilds.fetch(config.guildId);
  if (!guild) {
    return interaction.reply({ content: '❌ Erreur serveur.', ephemeral: true });
  }

  await interaction.deferReply({ ephemeral: true });

  const methodLabels = { paypal: '💳 PayPal', revolut: '💶 Revolut', paysafecard: '🎫 Paysafecard' };
  const fieldLabel = method === 'revolut' ? '💶 Revolut du client' : method === 'paysafecard' ? '🎫 Code Paysafecard' : '💳 PayPal du client';

  const category = interaction.client.channels.cache.get(config.rechargeTicketChannelId);
  if (!category) {
    return interaction.followUp({ content: '❌ Catégorie de recharge introuvable.', ephemeral: true });
  }

  const user = await interaction.client.users.fetch(tx.discordId);

  const ticketChannel = await guild.channels.create({
    name: `recharge-${user.username}-${txId}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: tx.discordId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: config.fondaRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: config.adminRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  db.prepare('UPDATE transactions SET channelId = ? WHERE id = ?').run(ticketChannel.id, txId);

  const isUrl = clientPayment.includes('http') || clientPayment.includes('paypal.me') || clientPayment.includes('.com');
  const paymentDisplay = isUrl ? `[Cliquer ici pour payer](${clientPayment.startsWith('http') ? clientPayment : 'https://' + clientPayment})` : clientPayment;
  const methodName = method === 'revolut' ? 'Revolut' : method === 'paysafecard' ? 'Paysafecard' : 'PayPal';

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('💳 Demande de Recharge')
    .addFields(
      { name: '👤 Client', value: `${user.tag} (\`${tx.discordId}\`)`, inline: false },
      { name: '💰 Montant', value: `${tx.amount.toFixed(2)}€`, inline: true },
      { name: '💳 Méthode', value: tx.method, inline: true },
      { name: '🆔 Transaction', value: `#${txId}`, inline: true },
      { name: fieldLabel, value: paymentDisplay, inline: false },
      { name: '📌 Statut', value: '⏳ En attente de validation...', inline: false },
    )
    .setFooter({ text: 'Poulet Factory • Recharge' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_recharge_${txId}`)
      .setLabel('✅ Accepter')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`refuse_recharge_${txId}`)
      .setLabel('❌ Refuser')
      .setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({
    content: `<@&${config.fondaRoleId}> Demande de recharge de **${tx.amount.toFixed(2)}€** par ${user.tag}\n${methodName} : ${paymentDisplay}`,
    embeds: [embed],
    components: [row],
  });

  await interaction.editReply({
    content: `✅ Votre demande a été envoyée ! Rendez-vous dans votre ticket : ${ticketChannel}`,
    ephemeral: true,
  });
}

async function showPaypalModal(interaction, txId) {
  if (!interaction.member.roles.cache.has(config.adminRoleId) && !interaction.member.roles.cache.has(config.fondaRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId(`paypal_name_${txId}`)
    .setTitle('Votre PayPal');

  const paypalInput = new TextInputBuilder()
    .setCustomId('paypal')
    .setLabel('Votre lien ou email PayPal')
    .setPlaceholder('Ex: paypal.me/votrenom')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  modal.addComponents(new ActionRowBuilder().addComponents(paypalInput));

  await interaction.showModal(modal);
}

async function savePaypalName(interaction, txId) {
  const paypal = interaction.fields.getTextInputValue('paypal');

  const confirmEmbed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('💰 PayPal du Fonda')
    .setDescription(`Le fonda <@${interaction.user.id}> a donné son PayPal :`)
    .addFields(
      { name: '💳 PayPal', value: paypal, inline: false },
      { name: '📌 Instruction', value: 'Envoie le screen du paiement ici pour validation.', inline: false },
    )
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`accept_recharge_${txId}`)
      .setLabel('✅ Accepter')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`refuse_recharge_${txId}`)
      .setLabel('❌ Refuser')
      .setStyle(ButtonStyle.Danger),
  );

  await interaction.update({ embeds: [confirmEmbed], components: [row] });
}

async function acceptRecharge(interaction, txId) {
  if (!interaction.member.roles.cache.has(config.adminRoleId) && !interaction.member.roles.cache.has(config.fondaRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }

  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  if (!tx || tx.status !== 'pending') {
    return interaction.reply({ content: '❌ Transaction déjà traitée.', ephemeral: true });
  }

  db.prepare('UPDATE users SET balance = balance + ? WHERE discordId = ?').run(tx.amount, tx.discordId);
  db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('completed', txId);

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Recharge Acceptée')
    .setDescription(`Recharge de **${tx.amount.toFixed(2)}€** acceptée par <@${interaction.user.id}>`)
    .addFields(
      { name: '💰 Montant crédité', value: `${tx.amount.toFixed(2)}€`, inline: true },
      { name: '✅ Validé par', value: `<@${interaction.user.id}>`, inline: true },
    )
    .setFooter({ text: 'Poulet Factory' })
    .setTimestamp();

  await interaction.update({ embeds: [embed], components: [] });

  try {
    const user = await interaction.client.users.fetch(tx.discordId);
    const dmEmbed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('💰 Recharge Confirmée')
      .setDescription(`Votre recharge de **${tx.amount.toFixed(2)}€** a été acceptée !`)
      .setFooter({ text: 'Poulet Factory' })
      .setTimestamp();
    await user.send({ embeds: [dmEmbed] });
  } catch (e) {}

  setTimeout(async () => {
    try {
      const ch = interaction.channel;
      if (ch && ch.deletable) await ch.delete();
    } catch (e) {}
  }, 3000);
}

async function refuseRecharge(interaction, txId) {
  if (!interaction.member.roles.cache.has(config.adminRoleId) && !interaction.member.roles.cache.has(config.fondaRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }

  const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId);
  if (!tx || tx.status !== 'pending') {
    return interaction.reply({ content: '❌ Transaction déjà traitée.', ephemeral: true });
  }

  db.prepare('UPDATE transactions SET status = ? WHERE id = ?').run('refused', txId);

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('❌ Recharge Refusée')
    .setDescription(`Recharge de **${tx.amount.toFixed(2)}€** refusée par <@${interaction.user.id}>`)
    .setFooter({ text: 'Poulet Factory' })
    .setTimestamp();

  await interaction.update({ embeds: [embed], components: [] });

  try {
    const user = await interaction.client.users.fetch(tx.discordId);
    const dmEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ Recharge Refusée')
      .setDescription(`Votre recharge de **${tx.amount.toFixed(2)}€** a été refusée.`)
      .setFooter({ text: 'Poulet Factory' })
      .setTimestamp();
    await user.send({ embeds: [dmEmbed] });
  } catch (e) {}

  setTimeout(async () => {
    try {
      const ch = interaction.channel;
      if (ch && ch.deletable) await ch.delete();
    } catch (e) {}
  }, 3000);
}

async function showDelierModal(interaction, txId) {
  if (!interaction.member.roles.cache.has(config.cuistotRoleId)) {
    return interaction.reply({ content: '❌ Seul le Cuistot peut fermer ce ticket.', ephemeral: true });
  }

  const modal = new ModalBuilder()
    .setCustomId(`delier_confirm_${txId}`)
    .setTitle('🔗 Délier le numéro ?');

  const reponse = new TextInputBuilder()
    .setCustomId('delier_reponse')
    .setLabel('As-tu délié le numéro ? (oui/non)')
    .setPlaceholder('oui ou non')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMinLength(2)
    .setMaxLength(3);

  modal.addComponents(new ActionRowBuilder().addComponents(reponse));

  await interaction.showModal(modal);
}

async function processDelier(interaction, txId) {
  if (!interaction.member.roles.cache.has(config.cuistotRoleId)) {
    return interaction.reply({ content: '❌ Seul le Cuistot peut fermer ce ticket.', ephemeral: true });
  }

  const reponse = interaction.fields.getTextInputValue('delier_reponse').toLowerCase().trim();

  if (reponse === 'oui') {
    await interaction.reply({ content: '✅ Ticket fermé.', ephemeral: true });
    setTimeout(async () => {
      try {
        const ch = interaction.channel;
        if (ch && ch.deletable) await ch.delete();
      } catch (e) {}
    }, 2000);
  } else {
    await interaction.reply({ content: '❌ Ticket non fermé. Délies d\'abord le numéro.', ephemeral: true });
  }
}

// ─────────────────────────────────────────────
// TEMP VERIFICATION
// ─────────────────────────────────────────────

async function handleTempVerification(interaction) {
  const existing = db.prepare('SELECT * FROM verifications WHERE discordId = ?').get(interaction.user.id);

  if (existing && existing.status === 'blocked') {
    return interaction.reply({
      content: '❌ Votre vérification a été bloquée par un administrateur. Contactez un admin pour être débloqué.',
      ephemeral: true,
    });
  }

  const role = interaction.guild.roles.cache.get(config.tempMemberRoleId);
  if (!role) {
    return interaction.reply({ content: '❌ Rôle temporaire introuvable. Contactez un admin.', ephemeral: true });
  }

  if (interaction.member.roles.cache.has(role.id)) {
    return interaction.reply({ content: '✅ Vous avez déjà le rôle temporaire !', ephemeral: true });
  }

  await interaction.member.roles.add(role);

  if (existing) {
    db.prepare('UPDATE verifications SET status = ? WHERE discordId = ?').run('active', interaction.user.id);
  } else {
    db.prepare('INSERT INTO verifications (discordId, status) VALUES (?, ?)').run(interaction.user.id, 'active');
  }

  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ Vérification Temporaire')
    .setDescription('Tu as bien obtenu l\'accès temporaire au serveur !')
    .addFields(
      { name: '📌 Note', value: 'Un vérificateur pourra te demander de te revérifier plus tard.', inline: false },
    )
    .setFooter({ text: 'Poulet Factory' })
    .setTimestamp();

  await interaction.reply({ embeds: [embed], ephemeral: true });
}

async function blockVerifyFromPanel(interaction, userId) {
  if (!interaction.member.roles.cache.has(config.adminRoleId) && !interaction.member.roles.cache.has(config.fondaRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }

  const member = await interaction.guild.members.fetch(userId).catch(() => null);
  const role = interaction.guild.roles.cache.get(config.tempMemberRoleId);

  if (member && role && member.roles.cache.has(role.id)) {
    await member.roles.remove(role);
  }

  const existing = db.prepare('SELECT * FROM verifications WHERE discordId = ?').get(userId);
  if (existing) {
    db.prepare('UPDATE verifications SET status = ?, blockedAt = datetime(\'now\') WHERE discordId = ?').run('blocked', userId);
  } else {
    db.prepare('INSERT INTO verifications (discordId, status, blockedAt) VALUES (?, ?, datetime(\'now\'))').run(userId, 'blocked');
  }

  await interaction.reply({ content: `✅ Vérification bloquée pour <@${userId}>.`, ephemeral: true });
}

async function showAddProductModal(interaction) {
  const modal = new ModalBuilder()
    .setCustomId('add_product')
    .setTitle('Ajouter un nouveau produit');

  const nameInput = new TextInputBuilder()
    .setCustomId('new_name')
    .setLabel('Nom du produit')
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
    .setMaxLength(100);

  const priceInput = new TextInputBuilder()
    .setCustomId('new_price')
    .setLabel('Prix (€)')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const stockInput = new TextInputBuilder()
    .setCustomId('new_stock')
    .setLabel('Stock initial')
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const descInput = new TextInputBuilder()
    .setCustomId('new_description')
    .setLabel('Description (optionnelle)')
    .setStyle(TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(
    new ActionRowBuilder().addComponents(nameInput),
    new ActionRowBuilder().addComponents(priceInput),
    new ActionRowBuilder().addComponents(stockInput),
    new ActionRowBuilder().addComponents(descInput),
  );

  await interaction.showModal(modal);
}

// ─────────────────────────────────────────────
// SAV TICKET
// ─────────────────────────────────────────────

async function showSavModal(interaction, orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return interaction.reply({ content: '❌ Commande introuvable.', ephemeral: true });
  }

  if (interaction.user.id !== order.discordId) {
    return interaction.reply({ content: '❌ Seul le client peut ouvrir un ticket SAV.', ephemeral: true });
  }

  if (order.status !== 'completed') {
    return interaction.reply({ content: '❌ Vous ne pouvez ouvrir un SAV que sur une commande validée.', ephemeral: true });
  }

  const completedAt = new Date(order.completedAt + 'Z');
  const now = new Date();
  const diffMs = now - completedAt;
  const diffMinutes = diffMs / 60000;

  if (diffMinutes > 15) {
    return interaction.reply({
      content: '❌ **Garantie dépassée.**\nLe délai de 15 minutes après réception du code est écoulé. Contacte un administrateur si tu as un problème.',
      ephemeral: true,
    });
  }

  if (diffMinutes < 0) {
    return interaction.reply({
      content: '⏳ Le délai d\'attente est en cours. Veuillez patienter encore un peu avant d\'ouvrir un SAV.',
      ephemeral: true,
    });
  }

  const modal = new ModalBuilder()
    .setCustomId(`sav_reason_${orderId}`)
    .setTitle('🔧 Ticket SAV');

  const reasonInput = new TextInputBuilder()
    .setCustomId('sav_reason')
    .setLabel('Raison du SAV')
    .setPlaceholder('Décrivez votre problème (compte non fonctionnel, erreur, etc.)')
    .setStyle(TextInputStyle.Paragraph)
    .setRequired(true)
    .setMinLength(10)
    .setMaxLength(1000);

  modal.addComponents(new ActionRowBuilder().addComponents(reasonInput));

  await interaction.showModal(modal);
}

async function openSavTicket(interaction, orderId) {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
  if (!order) {
    return interaction.reply({ content: '❌ Commande introuvable.', ephemeral: true });
  }

  if (interaction.user.id !== order.discordId) {
    return interaction.reply({ content: '❌ Seul le client peut ouvrir un ticket SAV.', ephemeral: true });
  }

  if (order.status !== 'completed') {
    return interaction.reply({ content: '❌ Vous ne pouvez ouvrir un SAV que sur une commande validée.', ephemeral: true });
  }

  const completedAt = new Date(order.completedAt + 'Z');
  const now = new Date();
  const diffMs = now - completedAt;
  const diffMinutes = diffMs / 60000;

  if (diffMinutes > 15) {
    return interaction.reply({
      content: '❌ **Garantie dépassée.**\nLe délai de 15 minutes après réception du code est écoulé. Contacte un administrateur si tu as un problème.',
      ephemeral: true,
    });
  }

  if (diffMinutes < 0) {
    return interaction.reply({
      content: '⏳ Le délai d\'attente est en cours. Veuillez patienter encore un peu avant d\'ouvrir un SAV.',
      ephemeral: true,
    });
  }

  const category = interaction.guild.channels.cache.get(config.savCategoryId);
  if (!category) {
    return interaction.reply({ content: '❌ Catégorie SAV introuvable. Contacte un admin.', ephemeral: true });
  }

  // Get user's last transaction for payment info
  const lastTx = db.prepare(
    "SELECT * FROM transactions WHERE discordId = ? ORDER BY createdAt DESC LIMIT 1"
  ).get(order.discordId);

  const methodLabels = { paypal: '💳 PayPal', crypto: '₿ Crypto', revolut: '💶 Revolut', admin: '💰 Admin' };
  const paymentMethod = lastTx ? (methodLabels[lastTx.method] || lastTx.method) : 'Solde';

  // Check if the user already has an open SAV ticket for this order
  const existingSav = db.prepare(
    "SELECT * FROM orders WHERE discordId = ? AND productName = ? AND status = 'sav'"
  ).get(order.discordId, order.productName);
  if (existingSav) {
    const ch = interaction.guild.channels.cache.get(existingSav.channelId);
    if (ch) {
      return interaction.reply({
        content: `❌ Un ticket SAV existe déjà : ${ch}`,
        ephemeral: true,
      });
    }
  }

  // Create ticket
  const ticketChannel = await interaction.guild.channels.create({
    name: `sav-${order.buyerFirstName.toLowerCase()}-${order.buyerName.toLowerCase()}`,
    type: ChannelType.GuildText,
    parent: category.id,
    permissionOverwrites: [
      {
        id: interaction.guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: config.savRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: config.adminRoleId,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
    ],
  });

  const reason = interaction.fields.getTextInputValue('sav_reason');
  const remainingMinutes = Math.max(0, Math.ceil(15 - diffMinutes));

  const embed = new EmbedBuilder()
    .setColor(parseInt(config.colorGold.replace('#', ''), 16))
    .setTitle('🔧 Ticket SAV')
    .setDescription(`Ticket de support pour la commande **#${orderId}**`)
    .addFields(
      { name: '👤 Client', value: `<@${order.discordId}> (\`${order.discordId}\`)`, inline: true },
      { name: '📦 Produit', value: order.productName, inline: true },
      { name: '💰 Prix', value: `${order.price.toFixed(2)}€`, inline: true },
      { name: '📝 Nom', value: `${order.buyerFirstName} ${order.buyerName}`, inline: true },
      { name: '📞 Téléphone', value: order.phone, inline: true },
      { name: '💳 Paiement', value: paymentMethod, inline: true },
      { name: '🆔 Commande', value: `#${orderId}`, inline: true },
      { name: '📅 Commande passée le', value: new Date(order.createdAt + 'Z').toLocaleString('fr-FR'), inline: true },
      { name: '✅ Validée le', value: new Date(order.completedAt + 'Z').toLocaleString('fr-FR'), inline: true },
      { name: '⏳ Garantie restante', value: `**${remainingMinutes} minute(s)**`, inline: true },
      { name: '📋 Raison du SAV', value: reason, inline: false },
      { name: '📌 Note', value: 'Le délai d\'attente est normal et peut prendre jusqu\'à quelques minutes. Merci de patienter, un membre du SAV va vous répondre.', inline: false },
    )
    .setFooter({ text: 'Poulet Factory • SAV' })
    .setTimestamp();

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`close_sav_${orderId}`)
      .setLabel('🔒 Fermer le ticket SAV')
      .setStyle(ButtonStyle.Danger),
  );

  await ticketChannel.send({
    content: `<@&${config.savRoleId}> Nouveau ticket SAV pour **${order.buyerFirstName} ${order.buyerName}** (commande #${orderId})`,
    embeds: [embed],
    components: [row],
  });

  await interaction.reply({
    content: `✅ Votre ticket SAV a été créé : ${ticketChannel}\n⏳ Veuillez patienter, un membre de l'équipe va vous répondre.`,
    ephemeral: true,
  });
}

async function closeSavTicket(interaction, orderId) {
  if (!interaction.member.roles.cache.has(config.savRoleId) && !interaction.member.roles.cache.has(config.adminRoleId)) {
    return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
  }

  const embed = new EmbedBuilder()
    .setColor(0xFF0000)
    .setTitle('🔒 Fermeture du ticket SAV')
    .setDescription('Le ticket SAV va être fermé dans **5 secondes**...')
    .setFooter({ text: 'Poulet Factory' });

  await interaction.update({ embeds: [embed], components: [] });

  setTimeout(async () => {
    try {
      const ch = interaction.channel;
      if (ch && ch.deletable) await ch.delete();
    } catch (e) {}
  }, 5000);
}

// ─────────────────────────────────────────────
// GIVEAWAY
// ─────────────────────────────────────────────

async function joinGiveaway(interaction, giveawayId) {
  const giveaway = db.prepare('SELECT * FROM giveaways WHERE id = ?').get(giveawayId);
  if (!giveaway) {
    return interaction.reply({ content: '❌ Giveaway introuvable.', ephemeral: true });
  }

  if (giveaway.status !== 'active') {
    return interaction.reply({ content: '❌ Ce giveaway est déjà terminé.', ephemeral: true });
  }

  const participants = giveaway.participants ? giveaway.participants.split(',').filter(Boolean) : [];

  if (participants.includes(interaction.user.id)) {
    const newParticipants = participants.filter(id => id !== interaction.user.id);
    db.prepare('UPDATE giveaways SET participants = ? WHERE id = ?').run(newParticipants.join(','), giveawayId);

    await interaction.reply({
      content: '❌ Vous avez retiré votre participation au giveaway.',
      ephemeral: true,
    });
  } else {
    participants.push(interaction.user.id);
    db.prepare('UPDATE giveaways SET participants = ? WHERE id = ?').run(participants.join(','), giveawayId);

    await interaction.reply({
      content: '✅ Vous participez au giveaway ! Bonne chance 🎉',
      ephemeral: true,
    });
  }

  const channel = interaction.guild.channels.cache.get(giveaway.channelId);
  if (channel) {
    try {
      const msg = await channel.messages.fetch(giveaway.messageId);
      const current = db.prepare('SELECT participants FROM giveaways WHERE id = ?').get(giveawayId).participants;
      const count = current ? current.split(',').filter(Boolean).length : 0;
      const oldDesc = msg.embeds[0].description;
      const newDesc = oldDesc.replace(/👥 \*\*\d+\*\* participant/, `👥 **${count}** participant`);
      const embed = EmbedBuilder.from(msg.embeds[0]).setDescription(newDesc);
      await msg.edit({ embeds: [embed] });
    } catch (e) {}
  }
}



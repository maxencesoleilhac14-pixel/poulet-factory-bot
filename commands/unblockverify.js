const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  data: {
    name: 'unblockverify',
    description: 'Débloquer la vérification d\'un membre',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur à débloquer',
        required: true,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId) && !interaction.member.roles.cache.has(config.fondaRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const target = interaction.options.getUser('utilisateur');

    const existing = db.prepare('SELECT * FROM verifications WHERE discordId = ?').get(target.id);
    if (existing) {
      db.prepare('UPDATE verifications SET status = ?, blockedAt = NULL WHERE discordId = ?').run('active', target.id);
    }

    await interaction.reply({ content: `✅ Vérification de **${target.tag}** débloquée. Il peut se revérifier.`, ephemeral: true });
  },
};

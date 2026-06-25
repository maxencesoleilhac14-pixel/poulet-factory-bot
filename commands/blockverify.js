const config = require('../config.json');
const db = require('../database/db');

module.exports = {
  data: {
    name: 'blockverify',
    description: 'Bloquer la vérification d\'un membre (retire le rôle temporaire)',
    options: [
      {
        name: 'utilisateur',
        type: 6,
        description: 'L\'utilisateur à bloquer',
        required: true,
      },
    ],
  },
  async execute(interaction) {
    if (!interaction.member.roles.cache.has(config.adminRoleId) && !interaction.member.roles.cache.has(config.fondaRoleId)) {
      return interaction.reply({ content: '❌ Permission refusée.', ephemeral: true });
    }

    const target = interaction.options.getUser('utilisateur');
    const member = await interaction.guild.members.fetch(target.id);

    const role = interaction.guild.roles.cache.get(config.tempMemberRoleId);
    if (role && member.roles.cache.has(role.id)) {
      await member.roles.remove(role);
    }

    const existing = db.prepare('SELECT * FROM verifications WHERE discordId = ?').get(target.id);
    if (existing) {
      db.prepare('UPDATE verifications SET status = ?, blockedAt = datetime(\'now\') WHERE discordId = ?').run('blocked', target.id);
    } else {
      db.prepare('INSERT INTO verifications (discordId, status, blockedAt) VALUES (?, ?, datetime(\'now\'))').run(target.id, 'blocked');
    }

    await interaction.reply({ content: `✅ Vérification de **${target.tag}** bloquée. Rôle temporaire retiré.`, ephemeral: true });
  },
};

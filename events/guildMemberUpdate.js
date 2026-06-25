const config = require('../config.json');

const WELCOME_CHANNEL_ID = '1519315178896883774';
const TRACKED_ROLES = [
  '1519697861531406489',
  '1519701805628526674',
  '1519721242771329074',
];

module.exports = {
  name: 'guildMemberUpdate',
  async execute(oldMember, newMember) {
    if (oldMember.roles.cache.size === newMember.roles.cache.size) return;

    const addedRole = newMember.roles.cache.find(
      role => !oldMember.roles.cache.has(role.id) && TRACKED_ROLES.includes(role.id)
    );
    if (!addedRole) return;

    const channel = newMember.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const memberCount = newMember.guild.memberCount;

    await channel.send({
      content: `<@${newMember.id}> nous a rejoint. Nous sommes désormais **${memberCount}** sur le serveur !`,
      allowedMentions: { parse: [] },
    });
  },
};

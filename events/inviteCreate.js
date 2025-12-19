const { Events } = require('discord.js');

module.exports = {
    name: Events.InviteCreate,
    async execute(invite) {
        const invites = invite.client.invites.get(invite.guild.id);
        if (invites) {
            invites.set(invite.code, invite.uses);
        }
    },
};

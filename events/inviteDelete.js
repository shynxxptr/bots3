const { Events } = require('discord.js');

module.exports = {
    name: Events.InviteDelete,
    async execute(invite) {
        const invites = invite.client.invites.get(invite.guild.id);
        if (invites) {
            invites.delete(invite.code);
        }
    },
};

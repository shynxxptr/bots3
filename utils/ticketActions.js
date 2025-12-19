const { PermissionsBitField } = require('discord.js');
const { getTicketByChannel, closeTicket } = require('./ticketStore');

async function closeTicketChannel(channel, reason = 'closed') {
    const ticket = getTicketByChannel(channel.id);
    if (!ticket) return { ok: false, error: 'not_registered' };
    if (ticket.status !== 'open') return { ok: false, error: 'already_closed' };

    // Lock owner from sending messages (keep view)
    try {
        await channel.permissionOverwrites.edit(ticket.ownerId, { SendMessages: false });
    } catch (err) {
        console.error('Failed to lock ticket channel:', err);
    }

    // Rename to closed-*
    try {
        if (!channel.name.startsWith('closed-')) {
            await channel.setName(`closed-${channel.name}`.slice(0, 100));
        }
    } catch (err) {
        console.error('Failed to rename ticket channel:', err);
    }

    closeTicket(channel.id);

    try {
        await channel.send(`🔒 Ticket ditutup (${reason}). Terima kasih!`);
    } catch (err) {
        console.error('Failed to send close message:', err);
    }

    return { ok: true };
}

async function isTicketOwnerOrStaff(interaction, staffRoleId) {
    const ticket = getTicketByChannel(interaction.channelId);
    if (!ticket) return { ok: false, error: 'not_registered' };

    const isOwner = ticket.ownerId === interaction.user.id;
    const isStaff = !!(staffRoleId && interaction.member?.roles?.cache?.has(staffRoleId));
    const isAdmin = !!interaction.member?.permissions?.has(PermissionsBitField.Flags.Administrator);

    return { ok: isOwner || isStaff || isAdmin, ticket };
}

module.exports = {
    closeTicketChannel,
    isTicketOwnerOrStaff,
};



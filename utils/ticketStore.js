const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/tickets.json');

function loadStore() {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            const initial = { tickets: {}, userToOpenTicket: {} };
            fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load tickets store:', err);
        return { tickets: {}, userToOpenTicket: {} };
    }
}

function saveStore(store) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save tickets store:', err);
    }
}

function getTicketByChannel(channelId) {
    const store = loadStore();
    return store.tickets?.[channelId] || null;
}

function getOpenTicketChannelIdForUser(userId) {
    const store = loadStore();
    const channelId = store.userToOpenTicket?.[userId];
    if (!channelId) return null;
    const ticket = store.tickets?.[channelId];
    if (!ticket || ticket.status !== 'open') return null;
    return channelId;
}

function createTicket(channelId, userId, type) {
    const store = loadStore();
    if (!store.tickets) store.tickets = {};
    if (!store.userToOpenTicket) store.userToOpenTicket = {};

    store.tickets[channelId] = {
        channelId,
        guildId: null,
        ownerId: userId,
        type,
        status: 'open',
        createdAt: Date.now(),
        closedAt: null,
    };
    store.userToOpenTicket[userId] = channelId;

    saveStore(store);
    return store.tickets[channelId];
}

function createTicketWithGuild(channelId, guildId, userId, type) {
    const ticket = createTicket(channelId, userId, type);
    const store = loadStore();
    if (store.tickets?.[channelId]) {
        store.tickets[channelId].guildId = guildId;
        saveStore(store);
        return store.tickets[channelId];
    }
    return ticket;
}

function listOpenTickets() {
    const store = loadStore();
    return Object.values(store.tickets || {}).filter(t => t && t.status === 'open');
}

function closeTicket(channelId) {
    const store = loadStore();
    const ticket = store.tickets?.[channelId];
    if (!ticket) return null;
    ticket.status = 'closed';
    ticket.closedAt = Date.now();
    saveStore(store);
    return ticket;
}

module.exports = {
    STORE_PATH,
    getTicketByChannel,
    getOpenTicketChannelIdForUser,
    createTicket,
    createTicketWithGuild,
    closeTicket,
    listOpenTickets,
};



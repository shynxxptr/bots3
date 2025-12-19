const { Events, Collection } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`Logged in as ${client.user.tag}!`);

        // Cache invites
        for (const guild of client.guilds.cache.values()) {
            try {
                const invites = await guild.invites.fetch();
                const codeUses = new Collection();
                invites.each(inv => codeUses.set(inv.code, inv.uses));
                client.invites.set(guild.id, codeUses);
                console.log(`Cached ${invites.size} invites for guild: ${guild.name}`);
            } catch (e) {
                console.error(`Failed to fetch invites for guild: ${guild.name}`, e);
            }

            // Initialize Server Stats
            const { updateServerStats } = require('../utils/serverStats');
            updateServerStats(guild);

            // Update stats every 6 minutes (Discord rate limit is 2 updates per 10 mins)
            setInterval(() => updateServerStats(guild), 6 * 60 * 1000);
        }

        // Load Menfess Data
        const menfessFeature = require('../utils/menfessFeature.js');
        menfessFeature.loadMenfessDB();
        menfessFeature.readCount();
        menfessFeature.loadTimeouts();

        // ===========================
        // VOICE PAIR STREAK (WIB)
        // ===========================
        const { tickVoicePairStreak, getSettings } = require('../utils/voicePairStreak');
        const vpSettings = getSettings();

        // run once shortly after ready, then every tickSeconds
        setTimeout(() => tickVoicePairStreak(client).catch(() => { }), 10 * 1000);
        setInterval(() => tickVoicePairStreak(client).catch(() => { }), vpSettings.tickSeconds * 1000);

        // ===========================
        // TICKET AUTO-CLOSE (24 HOURS)
        // ===========================
        const { listOpenTickets } = require('../utils/ticketStore');
        const { closeTicketChannel } = require('../utils/ticketActions');

        const sweep = async () => {
            try {
                const cfg = require('../config.json');
                const ticketCfg = cfg.ticket || {};
                const autoHours = Number(ticketCfg.autoCloseHours || 24);
                const autoMs = autoHours * 60 * 60 * 1000;
                const now = Date.now();

                const openTickets = listOpenTickets();
                for (const t of openTickets) {
                    if (!t?.channelId || !t.createdAt) continue;
                    if (now - t.createdAt < autoMs) continue;

                    try {
                        const channel = await client.channels.fetch(t.channelId).catch(() => null);
                        if (!channel || !channel.isTextBased()) continue;

                        // Close only if still open and looks like a ticket channel
                        await closeTicketChannel(channel, `auto-close ${autoHours}h`);
                    } catch (err) {
                        console.error('Ticket auto-close error:', err);
                    }
                }
            } catch (err) {
                console.error('Ticket sweep failed:', err);
            }
        };

        // Run once at boot, then every 10 minutes
        sweep().catch(() => { });
        setInterval(() => sweep().catch(() => { }), 10 * 60 * 1000);

        console.log('Menfess system initialized.');
    },
};

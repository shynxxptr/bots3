const { ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { getWelcomeConfig } = require('./configLoader');

async function updateServerStats(guild) {
    const config = getWelcomeConfig();
    if (!config.serverStats) return;

    let { totalMembersChannelId, onlineMembersChannelId, totalMembersFormat, onlineMembersFormat } = config.serverStats;
    let configUpdated = false;

    // HARDCODED MAIN SERVER ID to prevent multi-guild config conflicts
    const MAIN_GUILD_ID = '1444648380428062822';
    if (guild.id !== MAIN_GUILD_ID) return;

    try {
        // Fetch all members to ensure accurate counts
        await guild.members.fetch();

        // --- Total Members Channel ---
        let totalChannel = totalMembersChannelId ? guild.channels.cache.get(totalMembersChannelId) : null;

        if (!totalChannel) {
            // Create channel if it doesn't exist
            try {
                totalChannel = await guild.channels.create({
                    name: 'Total Siswa: ...',
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        {
                            id: guild.id, // @everyone
                            deny: [PermissionFlagsBits.Connect], // Lock channel
                        },
                    ],
                });
                console.log(`Created Total Members channel: ${totalChannel.name}`);
                config.serverStats.totalMembersChannelId = totalChannel.id;
                configUpdated = true;
            } catch (err) {
                console.error('Failed to create Total Members channel:', err);
            }
        }

        if (totalChannel) {
            const totalCount = guild.memberCount;
            const name = (totalMembersFormat || 'Total Siswa: {count}').replace('{count}', totalCount);
            if (totalChannel.name !== name) {
                await totalChannel.setName(name);
                console.log(`Updated Total Members channel to: ${name}`);
            }
        }

        // --- Online Members Channel ---
        let onlineChannel = onlineMembersChannelId ? guild.channels.cache.get(onlineMembersChannelId) : null;

        if (!onlineChannel) {
            // Create channel if it doesn't exist
            try {
                onlineChannel = await guild.channels.create({
                    name: 'Member Online: ...',
                    type: ChannelType.GuildVoice,
                    permissionOverwrites: [
                        {
                            id: guild.id, // @everyone
                            deny: [PermissionFlagsBits.Connect], // Lock channel
                        },
                    ],
                });
                console.log(`Created Online Members channel: ${onlineChannel.name}`);
                config.serverStats.onlineMembersChannelId = onlineChannel.id;
                configUpdated = true;
            } catch (err) {
                console.error('Failed to create Online Members channel:', err);
            }
        }

        if (onlineChannel) {
            const onlineCount = guild.members.cache.filter(m => !m.user.bot && m.presence && m.presence.status !== 'offline').size;
            const name = (onlineMembersFormat || 'Member Online: {count}').replace('{count}', onlineCount);
            if (onlineChannel.name !== name) {
                await onlineChannel.setName(name);
                console.log(`Updated Online Members channel to: ${name}`);
            }
        }

        // Save config if new channels were created
        if (configUpdated) {
            const configPath = path.join(__dirname, '../config.json');
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
            console.log('Updated config.json with new server stats channel IDs.');
        }

    } catch (error) {
        console.error('Error updating server stats:', error);
    }
}

module.exports = { updateServerStats };

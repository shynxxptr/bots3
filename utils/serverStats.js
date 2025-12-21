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
        // Use cached member count to avoid rate limiting
        // guild.memberCount is already available in cache
        
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
                try {
                    await totalChannel.setName(name);
                    console.log(`Updated Total Members channel to: ${name}`);
                } catch (err) {
                    // Handle rate limit errors gracefully
                    if (err.code === 50035 || err.message?.includes('rate limit')) {
                        console.warn('Rate limited while updating total members channel, will retry later');
                    } else {
                        console.error('Error updating total members channel:', err);
                    }
                }
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
            // Use cached members to avoid rate limiting
            // Only count members that are already in cache
            const onlineCount = guild.members.cache.filter(m => 
                !m.user.bot && 
                m.presence && 
                m.presence.status !== 'offline'
            ).size;
            const name = (onlineMembersFormat || 'Member Online: {count}').replace('{count}', onlineCount);
            if (onlineChannel.name !== name) {
                try {
                    await onlineChannel.setName(name);
                    console.log(`Updated Online Members channel to: ${name}`);
                } catch (err) {
                    // Handle rate limit errors gracefully
                    if (err.code === 50035 || err.message?.includes('rate limit')) {
                        console.warn('Rate limited while updating online members channel, will retry later');
                    } else {
                        console.error('Error updating online members channel:', err);
                    }
                }
            }
        }

        // Save config if new channels were created
        if (configUpdated) {
            const configPath = path.join(__dirname, '../config.json');
            fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
            console.log('Updated config.json with new server stats channel IDs.');
        }

    } catch (error) {
        // Handle rate limit errors gracefully
        if (error.code === 50035 || error.message?.includes('rate limit') || error.data?.retry_after) {
            const retryAfter = error.data?.retry_after || 0;
            console.warn(`Rate limited in server stats update. Retry after: ${retryAfter}s`);
        } else {
            console.error('Error updating server stats:', error);
        }
    }
}

module.exports = { updateServerStats };

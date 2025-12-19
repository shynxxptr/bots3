const { Events } = require('discord.js');
const { addXp } = require('../utils/leveling');

// Map to store join times: userId -> timestamp
const voiceJoinTimes = new Map();

module.exports = {
    name: Events.VoiceStateUpdate,
    async execute(oldState, newState) {
        const userId = newState.member.id;
        const guildId = newState.guild.id;

        // Ignore bots
        if (newState.member.user.bot) return;

        // User Joined a Voice Channel (and wasn't in one before)
        if (!oldState.channelId && newState.channelId) {
            // Check if channel is AFK channel (optional, if guild has one)
            if (newState.guild.afkChannelId && newState.channelId === newState.guild.afkChannelId) return;

            voiceJoinTimes.set(userId, Date.now());
            // console.log(`[VoiceXP] ${newState.member.user.tag} joined voice.`);
        }

        // User Left a Voice Channel (and isn't in one anymore)
        else if (oldState.channelId && !newState.channelId) {
            if (voiceJoinTimes.has(userId)) {
                const joinTime = voiceJoinTimes.get(userId);
                const leaveTime = Date.now();
                const duration = leaveTime - joinTime; // in milliseconds

                // Calculate XP: 50 XP per 5 minutes (300000 ms)
                // Minimum 5 minutes to get XP
                if (duration >= 300000) {
                    const blocks = Math.floor(duration / 300000);
                    const xpToGive = blocks * 50; // 50 XP per 5 mins (equivalent to 10 XP/min)

                    // Add XP
                    const result = addXp(userId, guildId, xpToGive);

                    // Optional: Log or notify (maybe too spammy to notify in chat for voice)
                    // console.log(`[VoiceXP] ${newState.member.user.tag} left voice. Duration: ${minutes}m. XP: +${xpToGive}`);

                    if (result.leveledUp) {
                        // Try to find a general channel to send level up message
                        // Or use the system channel
                        const config = require('../config.json');
                        const channel = config.levelUpChannelId ? newState.guild.channels.cache.get(config.levelUpChannelId) : (newState.guild.systemChannel || newState.guild.channels.cache.find(c => c.name.includes('general') && c.isTextBased()));

                        if (channel) {
                            channel.send(`🎉 Selamat! <@${userId}> naik ke **Level ${result.level}** dari aktivitas voice! 🎤`);
                        }
                    }
                }

                voiceJoinTimes.delete(userId);
            }
        }

        // User Switched Channels (treated as continuous session, or reset? Let's treat as continuous if not AFK)
        else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId) {
            // If moved to AFK, treat as leave
            if (newState.guild.afkChannelId && newState.channelId === newState.guild.afkChannelId) {
                if (voiceJoinTimes.has(userId)) {
                    const joinTime = voiceJoinTimes.get(userId);
                    const duration = Date.now() - joinTime;
                    if (duration >= 300000) {
                        const blocks = Math.floor(duration / 300000);
                        addXp(userId, guildId, blocks * 50);
                    }
                    voiceJoinTimes.delete(userId);
                }
            }
            // If moved FROM AFK, treat as join
            else if (oldState.guild.afkChannelId && oldState.channelId === oldState.guild.afkChannelId) {
                voiceJoinTimes.set(userId, Date.now());
            }
            // Normal switch: do nothing, keep timer running
        }
    },
};

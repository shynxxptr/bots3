const { EmbedBuilder } = require('discord.js');
const { checkAchievement, getAchievement, getUnlockedAchievements, unlockAchievement, syncAchievementsFromExistingData } = require('./achievements');

/**
 * Check for newly unlocked achievements and send notifications
 * @param {object} client - Discord client
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {string} channelId - Channel ID to send notification (optional)
 * @returns {array} Array of newly unlocked achievement IDs
 */
async function checkAndNotifyAchievements(client, guildId, userId, channelId = null) {
    try {
        // First, sync achievements from existing data (only if user has no achievements stored yet)
        // This ensures users with existing data get their achievements auto-unlocked
        const syncedAchievements = syncAchievementsFromExistingData(userId, guildId);
        
        // Get currently stored unlocked achievements (from file)
        const currentUnlocked = getUnlockedAchievements(userId, guildId);
        
        // Get user and member
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return [];
        
        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) return [];
        
        const member = guild.members.cache.get(userId) || await guild.members.fetch(userId).catch(() => null);
        
        // Check all achievements
        const allAchievements = require('./achievements').getAllAchievements();
        const newlyUnlocked = [];
        
        for (const achievementId in allAchievements) {
            const achievement = allAchievements[achievementId];
            const check = checkAchievement(userId, guildId, achievementId);
            
            // If requirement met and not yet stored as unlocked
            if (check.unlocked && !currentUnlocked.includes(achievementId)) {
                // Unlock the achievement (save to file)
                const wasNewlyUnlocked = unlockAchievement(userId, guildId, achievementId);
                if (wasNewlyUnlocked) {
                    newlyUnlocked.push(achievementId);
                    console.log(`🎉 New achievement unlocked: ${achievementId} for user ${userId}`);
                }
            }
        }
        
        // Combine synced and newly unlocked achievements
        const allNewlyUnlocked = [...syncedAchievements, ...newlyUnlocked];
        
        // Send notifications for newly unlocked achievements (but skip notification for synced ones to avoid spam)
        // Only notify for achievements unlocked in this session (not synced from existing data)
        if (newlyUnlocked.length > 0) {
            await sendAchievementNotifications(client, guildId, userId, newlyUnlocked, channelId);
        }
        
        return allNewlyUnlocked;
    } catch (error) {
        console.error('Error checking achievements:', error);
        console.error('Stack:', error.stack);
        return [];
    }
}

/**
 * Send achievement notification messages
 * @param {object} client - Discord client
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {array} achievementIds - Array of achievement IDs
 * @param {string} channelId - Channel ID to send notification (optional)
 */
async function sendAchievementNotifications(client, guildId, userId, achievementIds, channelId = null) {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return;
        
        const user = await client.users.fetch(userId).catch(() => null);
        if (!user) return;
        
        // Get channel
        let channel = null;
        if (channelId) {
            channel = guild.channels.cache.get(channelId);
        }
        
        // Try to get achievement notification channel from config
        if (!channel) {
            const config = require('../config.json');
            const achievementChannelId = config.achievementNotificationChannelId || config.levelUpChannelId;
            if (achievementChannelId) {
                channel = guild.channels.cache.get(achievementChannelId);
            }
        }
        
        // If still no channel, try system channel
        if (!channel) {
            channel = guild.systemChannel;
        }
        
        if (!channel || !channel.isTextBased()) {
            console.log(`No valid channel found for achievement notification for user ${userId}`);
            return;
        }
        
        // Get achievement data
        const allAchievements = require('./achievements').getAllAchievements();
        
        // Create embed for each achievement (or combine if multiple)
        if (achievementIds.length === 1) {
            const achievement = allAchievements[achievementIds[0]];
            if (!achievement) return;
            
            const embed = new EmbedBuilder()
                .setColor(achievement.color || '#5865F2')
                .setTitle(`🏆 Achievement Unlocked!`)
                .setDescription(`Selamat <@${userId}>! Kamu berhasil unlock achievement baru!`)
                .addFields(
                    { name: `${achievement.emoji} ${achievement.name}`, value: achievement.description, inline: false }
                )
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Keep it up! 🎉' });
            
            await channel.send({ embeds: [embed] }).catch(err => {
                console.error('Error sending achievement notification:', err);
            });
        } else {
            // Multiple achievements unlocked
            const achievementList = achievementIds
                .map(id => {
                    const achievement = allAchievements[id];
                    return achievement ? `${achievement.emoji} **${achievement.name}** - ${achievement.description}` : null;
                })
                .filter(Boolean)
                .join('\n');
            
            const embed = new EmbedBuilder()
                .setColor('#FFD700')
                .setTitle(`🏆 Multiple Achievements Unlocked!`)
                .setDescription(`Selamat <@${userId}>! Kamu berhasil unlock **${achievementIds.length}** achievements baru!`)
                .addFields(
                    { name: 'Achievements', value: achievementList, inline: false }
                )
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp()
                .setFooter({ text: 'Keep it up! 🎉' });
            
            await channel.send({ embeds: [embed] }).catch(err => {
                console.error('Error sending achievement notification:', err);
            });
        }
    } catch (error) {
        console.error('Error sending achievement notifications:', error);
    }
}

/**
 * Check achievements when user stats change
 * This should be called after updating stats (voice time, messages, reputation, etc)
 * @param {object} client - Discord client
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 */
async function checkAchievementsOnStatUpdate(client, guildId, userId) {
    // Debounce: Only check once per minute per user to avoid spam
    const cacheKey = `achievement_check_${guildId}_${userId}`;
    const lastCheck = global.achievementCheckCache || {};
    
    const now = Date.now();
    if (lastCheck[cacheKey] && (now - lastCheck[cacheKey]) < 60000) {
        return; // Skip if checked less than 1 minute ago
    }
    
    lastCheck[cacheKey] = now;
    global.achievementCheckCache = lastCheck;
    
    // Check achievements
    await checkAndNotifyAchievements(client, guildId, userId);
}

module.exports = {
    checkAndNotifyAchievements,
    sendAchievementNotifications,
    checkAchievementsOnStatUpdate,
};



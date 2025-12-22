const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/reputation.json');

function loadStore() {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            const initial = { users: {}, cooldowns: {} };
            fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load reputation store:', err);
        return { users: {}, cooldowns: {} };
    }
}

function saveStore(store) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save reputation store:', err);
    }
}

function getUserKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

function getCooldownKey(guildId, giverId, receiverId) {
    return `${guildId}-${giverId}-${receiverId}`;
}

/**
 * Give reputation (poin prestasi) to a user
 * @param {string} guildId - Guild ID
 * @param {string} giverId - User ID yang kasih rep
 * @param {string} receiverId - User ID yang dapat rep
 * @returns {object} Result object
 */
function giveReputation(guildId, giverId, receiverId) {
    const store = loadStore();
    
    // Can't give rep to yourself
    if (giverId === receiverId) {
        return { success: false, error: 'Kamu tidak bisa kasih poin prestasi ke dirimu sendiri!' };
    }
    
    // Check cooldown (24 hours)
    const cooldownKey = getCooldownKey(guildId, giverId, receiverId);
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000; // 24 hours
    
    if (store.cooldowns[cooldownKey]) {
        const lastGiven = store.cooldowns[cooldownKey];
        const timeLeft = cooldownMs - (now - lastGiven);
        
        if (timeLeft > 0) {
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
            return { 
                success: false, 
                error: `Kamu sudah kasih poin prestasi ke user ini hari ini. Coba lagi dalam **${hoursLeft}j ${minutesLeft}m**` 
            };
        }
    }
    
    // Initialize user if not exists
    const userKey = getUserKey(guildId, receiverId);
    if (!store.users[userKey]) {
        store.users[userKey] = {
            guildId,
            userId: receiverId,
            totalRep: 0,
            givenBy: [], // Array of { userId, timestamp }
            createdAt: now,
        };
    }
    
    // Add reputation
    store.users[userKey].totalRep = (store.users[userKey].totalRep || 0) + 1;
    
    // Track who gave it
    store.users[userKey].givenBy.push({
        userId: giverId,
        timestamp: now,
    });
    
    // Update cooldown
    store.cooldowns[cooldownKey] = now;
    
    // Clean old cooldowns (older than 7 days)
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
    for (const key in store.cooldowns) {
        if (store.cooldowns[key] < sevenDaysAgo) {
            delete store.cooldowns[key];
        }
    }
    
    saveStore(store);
    
    return {
        success: true,
        totalRep: store.users[userKey].totalRep,
        uniqueGivers: new Set(store.users[userKey].givenBy.map(g => g.userId)).size,
    };
}

/**
 * Get reputation info for a user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {object|null} User reputation info
 */
function getReputation(guildId, userId) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    const user = store.users[userKey];
    
    if (!user || user.totalRep === 0) {
        return null;
    }
    
    const uniqueGivers = new Set(user.givenBy.map(g => g.userId)).size;
    
    return {
        totalRep: user.totalRep || 0,
        uniqueGivers,
        givenBy: user.givenBy || [],
    };
}

/**
 * Get top users by reputation
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of users to return
 * @returns {array} Array of user reputation data
 */
function getTopReputation(guildId, limit = 10) {
    const store = loadStore();
    const users = Object.values(store.users || {})
        .filter(u => u.guildId === guildId && u.totalRep > 0)
        .sort((a, b) => (b.totalRep || 0) - (a.totalRep || 0))
        .slice(0, limit);
    
    return users.map(u => ({
        userId: u.userId,
        totalRep: u.totalRep || 0,
        uniqueGivers: new Set((u.givenBy || []).map(g => g.userId)).size,
    }));
}

/**
 * Check if user can give rep to another user (cooldown check)
 * @param {string} guildId - Guild ID
 * @param {string} giverId - User ID yang kasih rep
 * @param {string} receiverId - User ID yang dapat rep
 * @returns {object} Cooldown info
 */
function checkCooldown(guildId, giverId, receiverId) {
    const store = loadStore();
    const cooldownKey = getCooldownKey(guildId, giverId, receiverId);
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    
    if (!store.cooldowns[cooldownKey]) {
        return { canGive: true, timeLeft: 0 };
    }
    
    const lastGiven = store.cooldowns[cooldownKey];
    const timeLeft = cooldownMs - (now - lastGiven);
    
    return {
        canGive: timeLeft <= 0,
        timeLeft: Math.max(0, timeLeft),
    };
}

module.exports = {
    giveReputation,
    getReputation,
    getTopReputation,
    checkCooldown,
    STORE_PATH,
};



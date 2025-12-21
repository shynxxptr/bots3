const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/voice_time.json');

function loadStore() {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            const initial = { users: {} };
            fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load voice time store:', err);
        return { users: {} };
    }
}

function saveStore(store) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save voice time store:', err);
    }
}

function getUserKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

/**
 * Add voice time for a user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {number} seconds - Seconds to add
 * @returns {object} Updated user voice time data
 */
function addVoiceTime(guildId, userId, seconds) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    
    if (!store.users[userKey]) {
        store.users[userKey] = {
            guildId,
            userId,
            totalSeconds: 0,
            totalHours: 0,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
        };
    }
    
    store.users[userKey].totalSeconds = (store.users[userKey].totalSeconds || 0) + seconds;
    store.users[userKey].totalHours = Math.floor(store.users[userKey].totalSeconds / 3600);
    store.users[userKey].lastUpdated = Date.now();
    
    saveStore(store);
    
    return {
        totalSeconds: store.users[userKey].totalSeconds,
        totalHours: store.users[userKey].totalHours,
    };
}

/**
 * Get voice time for a user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {object|null} User voice time data
 */
function getVoiceTime(guildId, userId) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    const user = store.users[userKey];
    
    if (!user || user.totalSeconds === 0) {
        return null;
    }
    
    return {
        totalSeconds: user.totalSeconds || 0,
        totalHours: user.totalHours || 0,
        lastUpdated: user.lastUpdated || user.createdAt,
    };
}

/**
 * Get top users by voice time
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of users to return
 * @returns {array} Array of user voice time data
 */
function getTopVoiceTime(guildId, limit = 10) {
    const store = loadStore();
    const users = Object.values(store.users || {})
        .filter(u => u.guildId === guildId && u.totalSeconds > 0)
        .sort((a, b) => (b.totalSeconds || 0) - (a.totalSeconds || 0))
        .slice(0, limit);
    
    return users.map(u => ({
        userId: u.userId,
        totalSeconds: u.totalSeconds || 0,
        totalHours: u.totalHours || 0,
    }));
}

/**
 * Format seconds to human readable string
 * @param {number} seconds - Total seconds
 * @returns {string} Formatted string (e.g., "5j 30m" or "2h 15m")
 */
function formatVoiceTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        if (minutes > 0) {
            return `${hours}j ${minutes}m`;
        } else {
            return `${hours}j`;
        }
    } else if (minutes > 0) {
        return `${minutes}m ${secs}d`;
    } else {
        return `${secs}d`;
    }
}

/**
 * Set voice time for a user (staff-only)
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {number} hours - Hours to set
 * @returns {object} Result object
 */
function setVoiceTime(guildId, userId, hours) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum) || hoursNum < 0) {
        return { success: false, error: 'Hours harus berupa angka >= 0' };
    }
    
    const totalSeconds = Math.floor(hoursNum * 3600);
    
    if (!store.users[userKey]) {
        store.users[userKey] = {
            guildId,
            userId,
            totalSeconds: 0,
            totalHours: 0,
            lastUpdated: Date.now(),
            createdAt: Date.now(),
        };
    }
    
    store.users[userKey].totalSeconds = totalSeconds;
    store.users[userKey].totalHours = Math.floor(totalSeconds / 3600);
    store.users[userKey].lastUpdated = Date.now();
    
    saveStore(store);
    
    return {
        success: true,
        totalSeconds: store.users[userKey].totalSeconds,
        totalHours: store.users[userKey].totalHours,
    };
}

module.exports = {
    addVoiceTime,
    getVoiceTime,
    getTopVoiceTime,
    formatVoiceTime,
    setVoiceTime,
    STORE_PATH,
};


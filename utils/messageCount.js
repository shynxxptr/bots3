const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/message_count.json');

function loadStore() {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            const initial = { users: {} };
            fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load message count store:', err);
        return { users: {} };
    }
}

function saveStore(store) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save message count store:', err);
    }
}

function getUserKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

/**
 * Increment message count for a user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {object} Updated message count data
 */
function incrementMessageCount(guildId, userId) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    
    if (!store.users[userKey]) {
        store.users[userKey] = {
            userId,
            guildId,
            messageCount: 0,
            lastMessage: Date.now(),
        };
    }
    
    store.users[userKey].messageCount = (store.users[userKey].messageCount || 0) + 1;
    store.users[userKey].lastMessage = Date.now();
    
    saveStore(store);
    
    return {
        messageCount: store.users[userKey].messageCount,
        lastMessage: store.users[userKey].lastMessage,
    };
}

/**
 * Get message count for a user
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @returns {object|null} User message count data
 */
function getMessageCount(guildId, userId) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    const user = store.users[userKey];
    
    if (!user) {
        return null;
    }
    
    return {
        messageCount: user.messageCount || 0,
        lastMessage: user.lastMessage || Date.now(),
    };
}

/**
 * Set message count for a user (staff-only)
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {number} count - Message count to set
 * @returns {object} Result object
 */
function setMessageCount(guildId, userId, count) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    
    const countNum = parseInt(count, 10);
    if (isNaN(countNum) || countNum < 0) {
        return { success: false, error: 'Message count harus berupa angka >= 0' };
    }
    
    if (!store.users[userKey]) {
        store.users[userKey] = {
            userId,
            guildId,
            messageCount: 0,
            lastMessage: Date.now(),
        };
    }
    
    store.users[userKey].messageCount = countNum;
    store.users[userKey].lastMessage = Date.now();
    
    saveStore(store);
    
    return {
        success: true,
        messageCount: store.users[userKey].messageCount,
    };
}

module.exports = {
    incrementMessageCount,
    getMessageCount,
    setMessageCount,
    STORE_PATH,
};







const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '../data/counting.json');

// In-memory cache to prevent race conditions
let countingCache = null;
let cacheLock = false;

/**
 * Load counting data with caching
 * Always reads from file to ensure data consistency
 */
function loadCountingData() {
    try {
        if (fs.existsSync(DATA_PATH)) {
            const data = fs.readFileSync(DATA_PATH, 'utf8');
            const parsed = JSON.parse(data);
            
            // Ensure required fields exist
            const countingData = {
                currentCount: typeof parsed.currentCount === 'number' ? parsed.currentCount : 0,
                lastUserId: parsed.lastUserId !== undefined ? parsed.lastUserId : null,
                lastMessageId: parsed.lastMessageId !== undefined ? parsed.lastMessageId : null
            };
            
            // Update cache
            countingCache = { ...countingData };
            return countingData;
        } else {
            // Create default data
            const defaultData = { currentCount: 0, lastUserId: null, lastMessageId: null };
            countingCache = { ...defaultData };
            saveCountingData(defaultData);
            return defaultData;
        }
    } catch (err) {
        console.error('Error reading counting data:', err);
        // Return default on error
        const defaultData = { currentCount: 0, lastUserId: null, lastMessageId: null };
        return defaultData;
    }
}

/**
 * Save counting data with error handling
 */
function saveCountingData(data) {
    try {
        // Ensure directory exists
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Update cache
        countingCache = { ...data };
        
        // Write to file
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 4), 'utf8');
        return true;
    } catch (err) {
        console.error('Error saving counting data:', err);
        return false;
    }
}

/**
 * Process counting message
 * @param {string} userId - User ID who sent the message
 * @param {string} messageId - Message ID
 * @param {string} content - Message content
 * @returns {object} Result with success, action, and updated data
 */
function processCountingMessage(userId, messageId, content) {
    // Prevent concurrent access
    if (cacheLock) {
        // Wait a bit and retry (simple retry mechanism)
        return { success: false, error: 'Counting sedang diproses, coba lagi sebentar' };
    }

    cacheLock = true;
    try {
        const countingData = loadCountingData();
        const number = parseInt(content.trim());

        // Check if it's a valid number
        if (isNaN(number)) {
            cacheLock = false;
            return { success: false, error: 'Bukan angka' };
        }

        // Check if user is the same as last user
        if (userId === countingData.lastUserId) {
            const newData = {
                currentCount: 0,
                lastUserId: null,
                lastMessageId: null
            };
            saveCountingData(newData);
            cacheLock = false;
            return {
                success: false,
                action: 'same_user',
                message: `🚫 Kamu tidak boleh menghitung dua kali berturut-turut! Hitungan di-reset ke 0.`,
                data: newData
            };
        }

        // Check if number is correct
        const expectedNumber = countingData.currentCount + 1;
        if (number === expectedNumber) {
            // Correct number - increment count
            const newData = {
                currentCount: countingData.currentCount + 1,
                lastUserId: userId,
                lastMessageId: messageId
            };
            saveCountingData(newData);
            cacheLock = false;
            return {
                success: true,
                action: 'correct',
                data: newData
            };
        } else {
            // Wrong number - reset count
            const newData = {
                currentCount: 0,
                lastUserId: null,
                lastMessageId: null
            };
            saveCountingData(newData);
            cacheLock = false;
            return {
                success: false,
                action: 'wrong_number',
                message: `💀 Salah hitung! Angka selanjutnya harusnya **${expectedNumber}**. Hitungan di-reset ke 0.`,
                data: newData,
                expectedNumber
            };
        }
    } catch (err) {
        console.error('Error processing counting message:', err);
        cacheLock = false;
        return { success: false, error: 'Terjadi error saat memproses counting' };
    }
}

/**
 * Handle message deletion - adjust count if needed
 * @param {string} messageId - Deleted message ID
 * @returns {object} Result
 */
function handleMessageDeletion(messageId) {
    if (cacheLock) {
        return { success: false, error: 'Counting sedang diproses' };
    }

    cacheLock = true;
    try {
        const countingData = loadCountingData();
        
        // If deleted message was the last counting message, we need to adjust
        if (countingData.lastMessageId === messageId) {
            // Decrement count (but don't go below 0)
            const newCount = Math.max(0, countingData.currentCount - 1);
            const newData = {
                currentCount: newCount,
                lastUserId: null, // Reset since message is deleted
                lastMessageId: null
            };
            saveCountingData(newData);
            cacheLock = false;
            return {
                success: true,
                action: 'adjusted',
                data: newData,
                message: `⚠️ Pesan counting terakhir dihapus. Count dikurangi menjadi **${newCount}**.`
            };
        }
        
        cacheLock = false;
        return { success: true, action: 'no_change' };
    } catch (err) {
        console.error('Error handling message deletion:', err);
        cacheLock = false;
        return { success: false, error: 'Terjadi error saat memproses penghapusan pesan' };
    }
}

/**
 * Get current counting status
 * @returns {object} Current counting data
 */
function getCountingStatus() {
    return loadCountingData();
}

/**
 * Set counting count (admin only)
 * @param {number} count - Count value to set
 * @returns {object} Result
 */
function setCountingCount(count) {
    if (cacheLock) {
        return { success: false, error: 'Counting sedang diproses' };
    }

    const countNum = parseInt(count, 10);
    if (isNaN(countNum) || countNum < 0) {
        return { success: false, error: 'Count harus berupa angka >= 0' };
    }

    cacheLock = true;
    try {
        const countingData = loadCountingData();
        const newData = {
            currentCount: countNum,
            lastUserId: null, // Reset last user when manually setting count
            lastMessageId: null // Reset last message when manually setting count
        };
        saveCountingData(newData);
        cacheLock = false;
        return {
            success: true,
            data: newData,
            message: `Count berhasil di-set ke **${countNum}**`
        };
    } catch (err) {
        console.error('Error setting counting count:', err);
        cacheLock = false;
        return { success: false, error: 'Terjadi error saat set count' };
    }
}

/**
 * Reset counting (admin only)
 * @returns {object} Result
 */
function resetCounting() {
    if (cacheLock) {
        return { success: false, error: 'Counting sedang diproses' };
    }

    cacheLock = true;
    try {
        const newData = {
            currentCount: 0,
            lastUserId: null,
            lastMessageId: null
        };
        saveCountingData(newData);
        cacheLock = false;
        return {
            success: true,
            data: newData
        };
    } catch (err) {
        console.error('Error resetting counting:', err);
        cacheLock = false;
        return { success: false, error: 'Terjadi error saat reset counting' };
    }
}

module.exports = {
    processCountingMessage,
    handleMessageDeletion,
    getCountingStatus,
    setCountingCount,
    resetCounting,
    loadCountingData,
    saveCountingData
};


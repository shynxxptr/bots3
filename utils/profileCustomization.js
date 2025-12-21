const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/profile_customizations.json');
const PROFILES_DIR = path.join(__dirname, '../assets/profiles');

// Ensure directories exist
if (!fs.existsSync(PROFILES_DIR)) {
    fs.mkdirSync(PROFILES_DIR, { recursive: true });
}

function loadStore() {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            const initial = {};
            fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load profile customization store:', err);
        return {};
    }
}

function saveStore(store) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save profile customization store:', err);
    }
}

function getUserKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

function getUserProfileDir(userId) {
    const userDir = path.join(PROFILES_DIR, userId);
    if (!fs.existsSync(userDir)) {
        fs.mkdirSync(userDir, { recursive: true });
    }
    return userDir;
}

/**
 * Get user role for customization (free/premium/staff)
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {object} member - Discord member object
 * @returns {string} Role: 'free', 'premium', or 'staff'
 */
function getUserRole(guildId, userId, member = null) {
    if (!member) return 'free';
    
    // Check if admin
    if (member.permissions && member.permissions.has('Administrator')) {
        return 'staff';
    }
    
    // Check config for role IDs
    const config = require('../config.json');
    const profileConfig = config.profileCustomization || {};
    
    // Check staff role
    const staffRoleId = profileConfig.staffRoleId || config.utilities?.staffRoleId;
    if (staffRoleId && member.roles && member.roles.cache.has(staffRoleId)) {
        return 'staff';
    }
    
    // Check premium role
    const premiumRoleId = profileConfig.premiumRoleId;
    if (premiumRoleId && member.roles && member.roles.cache.has(premiumRoleId)) {
        return 'premium';
    }
    
    return 'free';
}

/**
 * Get default customization based on role
 * @param {string} role - User role
 * @returns {object} Default customization
 */
function getDefaultCustomization(role) {
    return {
        template: 'classic',
        bio: '',
        background: {
            type: 'template',
            value: 'classic'
        },
        frame: {
            type: 'preset',
            value: 'frame_basic.png'
        },
        badges: {
            enabled: [],
            maxDisplay: role === 'free' ? 2 : 5,
            customAchievements: []
        },
        stats: {
            enabled: ['voice_time', 'messages', 'prestasi', 'quotes', 'streak', 'voice_streak'],
            position: 'left'
        },
        animation: {
            enabled: role === 'premium' || role === 'staff',
            badgeAnimation: 'pulse',
            backgroundAnimation: 'gradient',
            frameAnimation: 'glow'
        },
        layout: {
            avatarPosition: 'left',
            avatarSize: 160,
            textColor: '#FFFFFF',
            fontStyle: 'bold',
            resolution: role === 'free' ? '1280x720' : '1920x1080'
        }
    };
}

/**
 * Get user customization
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {object} member - Discord member object
 * @returns {object} User customization
 */
function getCustomization(guildId, userId, member = null) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    const role = getUserRole(guildId, userId, member);
    
    if (!store[userKey]) {
        const defaultCustom = getDefaultCustomization(role);
        store[userKey] = {
            userId,
            guildId,
            role,
            ...defaultCustom,
            updatedAt: Date.now()
        };
        saveStore(store);
    }
    
    // Update role if changed
    if (store[userKey].role !== role) {
        store[userKey].role = role;
        // Update max badges based on role
        store[userKey].badges.maxDisplay = role === 'free' ? 2 : 5;
        // Update resolution if free
        if (role === 'free' && store[userKey].layout.resolution === '1920x1080') {
            store[userKey].layout.resolution = '1280x720';
        }
        saveStore(store);
    }
    
    return store[userKey];
}

/**
 * Save user customization
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {object} customization - Customization data
 * @returns {object} Result object
 */
function saveCustomization(guildId, userId, customization) {
    const store = loadStore();
    const userKey = getUserKey(guildId, userId);
    
    if (!store[userKey]) {
        store[userKey] = {
            userId,
            guildId,
            role: 'free',
            ...getDefaultCustomization('free')
        };
    }
    
    // Merge customization
    store[userKey] = {
        ...store[userKey],
        ...customization,
        updatedAt: Date.now()
    };
    
    saveStore(store);
    
    return { success: true, customization: store[userKey] };
}

/**
 * Validate upload file
 * @param {object} file - File object from Discord
 * @returns {object} { valid: boolean, error: string }
 */
function validateUpload(file) {
    if (!file) {
        return { valid: false, error: 'File tidak ditemukan!' };
    }
    
    // Check format
    const allowedFormats = ['png', 'jpg', 'jpeg', 'webp'];
    const extension = file.name?.split('.').pop()?.toLowerCase();
    if (!extension || !allowedFormats.includes(extension)) {
        return { valid: false, error: 'Format file tidak didukung! Gunakan PNG, JPG, atau WEBP.' };
    }
    
    // Check size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
        return { valid: false, error: 'File terlalu besar! Maksimal 5MB.' };
    }
    
    return { valid: true };
}

/**
 * Save background image
 * @param {string} userId - User ID
 * @param {Buffer} imageBuffer - Image buffer
 * @returns {object} Result object
 */
function saveBackground(userId, imageBuffer) {
    try {
        const userDir = getUserProfileDir(userId);
        const backgroundPath = path.join(userDir, 'background.png');
        fs.writeFileSync(backgroundPath, imageBuffer);
        return { success: true, path: backgroundPath };
    } catch (err) {
        console.error('Failed to save background:', err);
        return { success: false, error: err.message };
    }
}

/**
 * Get available frames based on role
 * @param {string} role - User role
 * @returns {array} Array of available frame names
 */
function getAvailableFrames(role) {
    const freeFrames = [
        'frame_basic.png',
        'frame_silver.png',
        'frame_blue.png',
        'frame_green.png',
        'frame_red.png'
    ];
    
    const premiumFrames = [
        'frame_gold.png',
        'frame_rainbow.png',
        'frame_diamond.png',
        'frame_neon.png',
        'frame_galaxy.png',
        'frame_cosmic.png',
        'frame_royal.png',
        'frame_legendary.png',
        'frame_epic.png',
        'frame_ultimate.png'
    ];
    
    if (role === 'free') {
        return freeFrames;
    } else {
        return [...freeFrames, ...premiumFrames];
    }
}

/**
 * Get max badges based on role
 * @param {string} role - User role
 * @returns {number} Max badges
 */
function getMaxBadges(role) {
    return role === 'free' ? 2 : 5;
}

/**
 * Reset customization to default
 * @param {string} guildId - Guild ID
 * @param {string} userId - User ID
 * @param {object} member - Discord member object
 * @returns {object} Result object
 */
function resetCustomization(guildId, userId, member = null) {
    const role = getUserRole(guildId, userId, member);
    const defaultCustom = getDefaultCustomization(role);
    
    return saveCustomization(guildId, userId, {
        ...defaultCustom,
        userId,
        guildId,
        role
    });
}

module.exports = {
    getCustomization,
    saveCustomization,
    validateUpload,
    saveBackground,
    getAvailableFrames,
    getMaxBadges,
    getUserRole,
    resetCustomization,
    getDefaultCustomization,
    STORE_PATH,
};


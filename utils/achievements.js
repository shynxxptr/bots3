const fs = require('fs');
const path = require('path');

const ACHIEVEMENTS_PATH = path.join(__dirname, '../data/achievements.json');
const USER_ACHIEVEMENTS_PATH = path.join(__dirname, '../data/user_achievements.json');

// Achievement definitions
const ACHIEVEMENT_DEFINITIONS = {
    // Voice Achievements
    voice_murid_baru: {
        id: 'voice_murid_baru',
        name: 'Murid Baru',
        emoji: '🎤',
        description: '10 jam di voice channel',
        requirement: { type: 'voice_time', value: 10 },
        color: '#5865F2',
        category: 'voice'
    },
    voice_siswa_aktif: {
        id: 'voice_siswa_aktif',
        name: 'Siswa Aktif',
        emoji: '📢',
        description: '25 jam di voice channel',
        requirement: { type: 'voice_time', value: 25 },
        color: '#5865F2',
        category: 'voice'
    },
    voice_enthusiast: {
        id: 'voice_enthusiast',
        name: 'Voice Enthusiast',
        emoji: '🎙️',
        description: '50 jam di voice channel',
        requirement: { type: 'voice_time', value: 50 },
        color: '#5865F2',
        category: 'voice'
    },
    voice_ketua: {
        id: 'voice_ketua',
        name: 'Ketua Voice',
        emoji: '👑',
        description: '100 jam di voice channel',
        requirement: { type: 'voice_time', value: 100 },
        color: '#5865F2',
        category: 'voice'
    },
    voice_master: {
        id: 'voice_master',
        name: 'Voice Master',
        emoji: '⭐',
        description: '250 jam di voice channel',
        requirement: { type: 'voice_time', value: 250 },
        color: '#FFD700',
        category: 'voice'
    },
    voice_legend: {
        id: 'voice_legend',
        name: 'Voice Legend',
        emoji: '💫',
        description: '500 jam di voice channel',
        requirement: { type: 'voice_time', value: 500 },
        color: '#FF00FF',
        category: 'voice'
    },
    
    // Reputation Achievements
    prestasi_siswa_biasa: {
        id: 'prestasi_siswa_biasa',
        name: 'Siswa Biasa',
        emoji: '📜',
        description: '10 poin prestasi',
        requirement: { type: 'reputation', value: 10 },
        color: '#CD7F32',
        category: 'reputation'
    },
    prestasi_berprestasi: {
        id: 'prestasi_berprestasi',
        name: 'Siswa Berprestasi',
        emoji: '🏆',
        description: '25 poin prestasi',
        requirement: { type: 'reputation', value: 25 },
        color: '#C0C0C0',
        category: 'reputation'
    },
    prestasi_emas: {
        id: 'prestasi_emas',
        name: 'Prestasi Emas',
        emoji: '⭐',
        description: '50 poin prestasi',
        requirement: { type: 'reputation', value: 50 },
        color: '#FFD700',
        category: 'reputation'
    },
    prestasi_platinum: {
        id: 'prestasi_platinum',
        name: 'Prestasi Platinum',
        emoji: '💎',
        description: '100 poin prestasi',
        requirement: { type: 'reputation', value: 100 },
        color: '#E5E4E2',
        category: 'reputation'
    },
    prestasi_diamond: {
        id: 'prestasi_diamond',
        name: 'Prestasi Diamond',
        emoji: '✨',
        description: '250 poin prestasi',
        requirement: { type: 'reputation', value: 250 },
        color: '#B9F2FF',
        category: 'reputation'
    },
    
    // Streak Achievements
    streak_tidak_bolos: {
        id: 'streak_tidak_bolos',
        name: 'Tidak Bolos',
        emoji: '✅',
        description: '7 hari streak',
        requirement: { type: 'daily_streak', value: 7 },
        color: '#FF6A00',
        category: 'streak'
    },
    streak_rajin_absen: {
        id: 'streak_rajin_absen',
        name: 'Rajin Absen',
        emoji: '📅',
        description: '14 hari streak',
        requirement: { type: 'daily_streak', value: 14 },
        color: '#FF6A00',
        category: 'streak'
    },
    streak_siswa_disiplin: {
        id: 'streak_siswa_disiplin',
        name: 'Siswa Disiplin',
        emoji: '🔥',
        description: '30 hari streak',
        requirement: { type: 'daily_streak', value: 30 },
        color: '#FF6A00',
        category: 'streak'
    },
    streak_master: {
        id: 'streak_master',
        name: 'Streak Master',
        emoji: '⭐',
        description: '60 hari streak',
        requirement: { type: 'daily_streak', value: 60 },
        color: '#FFD700',
        category: 'streak'
    },
    streak_legend: {
        id: 'streak_legend',
        name: 'Streak Legend',
        emoji: '💫',
        description: '100 hari streak',
        requirement: { type: 'daily_streak', value: 100 },
        color: '#FF00FF',
        category: 'streak'
    },
    
    // Quote Achievements
    quote_pencatat_kata: {
        id: 'quote_pencatat_kata',
        name: 'Pencatat Kata',
        emoji: '📝',
        description: '5 quotes',
        requirement: { type: 'quote_count', value: 5 },
        color: '#9B59B6',
        category: 'quote'
    },
    quote_collector: {
        id: 'quote_collector',
        name: 'Quote Collector',
        emoji: '💬',
        description: '10 quotes',
        requirement: { type: 'quote_count', value: 10 },
        color: '#9B59B6',
        category: 'quote'
    },
    quote_king: {
        id: 'quote_king',
        name: 'Quote King',
        emoji: '👑',
        description: '25 quotes',
        requirement: { type: 'quote_count', value: 25 },
        color: '#9B59B6',
        category: 'quote'
    },
    quote_master: {
        id: 'quote_master',
        name: 'Quote Master',
        emoji: '⭐',
        description: '50 quotes',
        requirement: { type: 'quote_count', value: 50 },
        color: '#9B59B6',
        category: 'quote'
    },
    
    // Message Achievements
    message_murid_aktif: {
        id: 'message_murid_aktif',
        name: 'Murid Aktif',
        emoji: '💬',
        description: '1k pesan',
        requirement: { type: 'message_count', value: 1000 },
        color: '#00FF00',
        category: 'message'
    },
    message_siswa_komunikatif: {
        id: 'message_siswa_komunikatif',
        name: 'Siswa Komunikatif',
        emoji: '🗣️',
        description: '5k pesan',
        requirement: { type: 'message_count', value: 5000 },
        color: '#00FF00',
        category: 'message'
    },
    message_chat_master: {
        id: 'message_chat_master',
        name: 'Chat Master',
        emoji: '📢',
        description: '10k pesan',
        requirement: { type: 'message_count', value: 10000 },
        color: '#00FF00',
        category: 'message'
    },
    message_chat_legend: {
        id: 'message_chat_legend',
        name: 'Chat Legend',
        emoji: '⭐',
        description: '25k pesan',
        requirement: { type: 'message_count', value: 25000 },
        color: '#00FF00',
        category: 'message'
    },
    message_chat_god: {
        id: 'message_chat_god',
        name: 'Chat God',
        emoji: '💫',
        description: '50k pesan',
        requirement: { type: 'message_count', value: 50000 },
        color: '#00FF00',
        category: 'message'
    },
    
    // Voice Streak Achievements (Pacaran Theme)
    voice_streak_best_friend: {
        id: 'voice_streak_best_friend',
        name: 'Best Friend',
        emoji: '💕',
        description: '5 hari bareng di voice',
        requirement: { type: 'voice_streak', value: 5 },
        color: '#FFB6C1',
        category: 'voice_streak'
    },
    voice_streak_soulmate: {
        id: 'voice_streak_soulmate',
        name: 'Soulmate',
        emoji: '❤️',
        description: '10 hari bareng di voice',
        requirement: { type: 'voice_streak', value: 10 },
        color: '#FF69B4',
        category: 'voice_streak'
    },
    voice_streak_couple_goals: {
        id: 'voice_streak_couple_goals',
        name: 'Couple Goals',
        emoji: '💑',
        description: '20 hari bareng di voice',
        requirement: { type: 'voice_streak', value: 20 },
        color: '#FF1493',
        category: 'voice_streak'
    },
    voice_streak_power_couple: {
        id: 'voice_streak_power_couple',
        name: 'Power Couple',
        emoji: '⭐',
        description: '50 hari bareng di voice',
        requirement: { type: 'voice_streak', value: 50 },
        color: '#FFD700',
        category: 'voice_streak'
    }
};

function loadAchievements() {
    try {
        if (!fs.existsSync(ACHIEVEMENTS_PATH)) {
            fs.writeFileSync(ACHIEVEMENTS_PATH, JSON.stringify(ACHIEVEMENT_DEFINITIONS, null, 4));
            return ACHIEVEMENT_DEFINITIONS;
        }
        const saved = JSON.parse(fs.readFileSync(ACHIEVEMENTS_PATH, 'utf8'));
        // Merge with definitions to ensure all achievements exist
        return { ...ACHIEVEMENT_DEFINITIONS, ...saved };
    } catch (err) {
        console.error('Failed to load achievements:', err);
        return ACHIEVEMENT_DEFINITIONS;
    }
}

function saveAchievements(achievements) {
    try {
        fs.writeFileSync(ACHIEVEMENTS_PATH, JSON.stringify(achievements, null, 4));
    } catch (err) {
        console.error('Failed to save achievements:', err);
    }
}

/**
 * Load user achievements store
 * Structure: { "guildId-userId": ["achievement1", "achievement2", ...] }
 */
function loadUserAchievements() {
    try {
        if (!fs.existsSync(USER_ACHIEVEMENTS_PATH)) {
            fs.writeFileSync(USER_ACHIEVEMENTS_PATH, JSON.stringify({}, null, 4));
            return {};
        }
        return JSON.parse(fs.readFileSync(USER_ACHIEVEMENTS_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load user achievements:', err);
        return {};
    }
}

/**
 * Save user achievements store
 */
function saveUserAchievements(store) {
    try {
        fs.writeFileSync(USER_ACHIEVEMENTS_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save user achievements:', err);
    }
}

/**
 * Get user key for achievements store
 */
function getUserAchievementKey(guildId, userId) {
    return `${guildId}-${userId}`;
}

/**
 * Get unlocked achievements for a user (from store)
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {array} Array of unlocked achievement IDs
 */
function getStoredUnlockedAchievements(userId, guildId) {
    const store = loadUserAchievements();
    const key = getUserAchievementKey(guildId, userId);
    return store[key] || [];
}

/**
 * Unlock an achievement for a user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} achievementId - Achievement ID
 * @returns {boolean} True if newly unlocked, false if already unlocked
 */
function unlockAchievement(userId, guildId, achievementId) {
    const store = loadUserAchievements();
    const key = getUserAchievementKey(guildId, userId);
    
    if (!store[key]) {
        store[key] = [];
    }
    
    // Check if already unlocked
    if (store[key].includes(achievementId)) {
        return false;
    }
    
    // Add to unlocked list
    store[key].push(achievementId);
    saveUserAchievements(store);
    
    console.log(`✅ Achievement unlocked: ${achievementId} for user ${userId} in guild ${guildId}`);
    return true;
}

/**
 * Sync achievements from existing data files
 * This will auto-unlock achievements that are already met based on existing data
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {array} Array of newly unlocked achievement IDs
 */
function syncAchievementsFromExistingData(userId, guildId) {
    const store = loadUserAchievements();
    const key = getUserAchievementKey(guildId, userId);
    
    // If user already has achievements stored, skip sync (already synced before)
    if (store[key] && store[key].length > 0) {
        return [];
    }
    
    // Initialize if not exists
    if (!store[key]) {
        store[key] = [];
    }
    
    const allAchievements = loadAchievements();
    const newlyUnlocked = [];
    
    // Check all achievements
    for (const achievementId in allAchievements) {
        const achievement = allAchievements[achievementId];
        const check = checkAchievement(userId, guildId, achievementId);
        
        // If requirement already met, auto-unlock
        if (check.unlocked && !store[key].includes(achievementId)) {
            store[key].push(achievementId);
            newlyUnlocked.push(achievementId);
            console.log(`🔄 Auto-unlocked achievement from existing data: ${achievementId} for user ${userId} in guild ${guildId}`);
        }
    }
    
    // Save if any achievements were unlocked
    if (newlyUnlocked.length > 0) {
        saveUserAchievements(store);
        console.log(`✅ Synced ${newlyUnlocked.length} achievements from existing data for user ${userId} in guild ${guildId}`);
    }
    
    return newlyUnlocked;
}

/**
 * Get all achievement definitions
 * @returns {object} All achievement definitions
 */
function getAllAchievements() {
    return loadAchievements();
}

/**
 * Get achievement by ID
 * @param {string} achievementId - Achievement ID
 * @returns {object|null} Achievement definition
 */
function getAchievement(achievementId) {
    const achievements = loadAchievements();
    return achievements[achievementId] || null;
}

/**
 * Get achievements by category
 * @param {string} category - Category name
 * @returns {array} Array of achievements
 */
function getAchievementsByCategory(category) {
    const achievements = loadAchievements();
    return Object.values(achievements).filter(a => a.category === category);
}

/**
 * Check if user has unlocked an achievement
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @param {string} achievementId - Achievement ID
 * @returns {object} { unlocked: boolean, progress: number, total: number }
 */
function checkAchievement(userId, guildId, achievementId) {
    const achievement = getAchievement(achievementId);
    if (!achievement) {
        return { unlocked: false, progress: 0, total: 0 };
    }
    
    const requirement = achievement.requirement;
    let currentValue = 0;
    
    switch (requirement.type) {
        case 'voice_time':
            const { getVoiceTime } = require('./voiceTime');
            const voiceTime = getVoiceTime(guildId, userId);
            currentValue = voiceTime ? voiceTime.totalHours : 0;
            break;
            
        case 'reputation':
            const { getReputation } = require('./reputation');
            const rep = getReputation(guildId, userId);
            currentValue = rep ? rep.totalRep : 0;
            break;
            
        case 'daily_streak':
            const { getStreak } = require('./leveling');
            const streak = getStreak(userId, guildId);
            currentValue = streak ? streak.streak : 0;
            break;
            
        case 'quote_count':
            const { getQuotesByAuthor } = require('./quote');
            const quotes = getQuotesByAuthor(guildId, userId, 1000);
            currentValue = quotes ? quotes.length : 0;
            break;
            
        case 'message_count':
            const { getMessageCount } = require('./messageCount');
            const msgCount = getMessageCount(guildId, userId);
            currentValue = msgCount ? msgCount.messageCount : 0;
            break;
            
        case 'voice_streak':
            // Get highest voice streak for user
            const { getTopPairsForUser } = require('./voicePairStreak');
            const topPairs = getTopPairsForUser(guildId, userId, 1);
            currentValue = topPairs.length > 0 ? (topPairs[0].streak || 0) : 0;
            break;
            
        default:
            return { unlocked: false, progress: 0, total: requirement.value };
    }
    
    const unlocked = currentValue >= requirement.value;
    const progress = Math.min(currentValue, requirement.value);
    const total = requirement.value;
    
    return { unlocked, progress, total, currentValue };
}

/**
 * Get all unlocked achievements for a user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {array} Array of unlocked achievement IDs
 */
function getUnlockedAchievements(userId, guildId) {
    // Return stored unlocked achievements (from file)
    return getStoredUnlockedAchievements(userId, guildId);
}

/**
 * Get all achievements with progress for a user
 * @param {string} userId - User ID
 * @param {string} guildId - Guild ID
 * @returns {object} { unlocked: [], locked: [], byCategory: {} }
 */
function getUserAchievements(userId, guildId) {
    const achievements = loadAchievements();
    const storedUnlocked = getStoredUnlockedAchievements(userId, guildId);
    const unlocked = [];
    const locked = [];
    const byCategory = {};
    
    for (const achievementId in achievements) {
        const achievement = achievements[achievementId];
        const check = checkAchievement(userId, guildId, achievementId);
        
        // Check if stored as unlocked (even if requirement not met anymore, still show as unlocked)
        const isStoredUnlocked = storedUnlocked.includes(achievementId);
        const isUnlocked = isStoredUnlocked || check.unlocked;
        
        const achievementData = {
            ...achievement,
            unlocked: isUnlocked,
            progress: check.progress,
            total: check.total,
            currentValue: check.currentValue,
        };
        
        if (isUnlocked) {
            unlocked.push(achievementData);
        } else {
            locked.push(achievementData);
        }
        
        // Group by category
        if (!byCategory[achievement.category]) {
            byCategory[achievement.category] = { unlocked: [], locked: [] };
        }
        
        if (isUnlocked) {
            byCategory[achievement.category].unlocked.push(achievementData);
        } else {
            byCategory[achievement.category].locked.push(achievementData);
        }
    }
    
    return { unlocked, locked, byCategory };
}

module.exports = {
    getAllAchievements,
    getAchievement,
    getAchievementsByCategory,
    checkAchievement,
    getUnlockedAchievements,
    getUserAchievements,
    unlockAchievement,
    getStoredUnlockedAchievements,
    syncAchievementsFromExistingData,
    ACHIEVEMENTS_PATH,
};



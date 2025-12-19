const fs = require('fs');
const path = require('path');

const levelsPath = path.join(__dirname, '../data/levels.json');
const DEFAULT_STREAK_TZ = process.env.STREAK_TIMEZONE || 'Asia/Jakarta';

function getDateKey(date = new Date(), timeZone = DEFAULT_STREAK_TZ) {
    try {
        // en-CA produces YYYY-MM-DD
        return date.toLocaleDateString('en-CA', { timeZone });
    } catch (_) {
        // Fallback (UTC)
        return date.toISOString().slice(0, 10);
    }
}

// Load levels data
function loadLevels() {
    try {
        if (!fs.existsSync(levelsPath)) {
            fs.writeFileSync(levelsPath, '{}');
            return {};
        }
        const data = fs.readFileSync(levelsPath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        console.error("Error loading levels:", err);
        return {};
    }
}

// Save levels data
function saveLevels(data) {
    try {
        fs.writeFileSync(levelsPath, JSON.stringify(data, null, 4));
    } catch (err) {
        console.error("Error saving levels:", err);
    }
}

// Calculate XP needed for next level
function getXpForNextLevel(level) {
    return 2 * (level ** 2) + 30 * level + 50;
}

// Add XP to user
function addXp(userId, guildId, amount = 15) {
    const levels = loadLevels();
    const key = `${guildId}-${userId}`;

    if (!levels[key]) {
        levels[key] = {
            xp: 0,
            level: 1,
            lastXp: 0
        };
    }

    // Cooldown check (1 minute)
    const now = Date.now();
    if (now - levels[key].lastXp < 60000) {
        return { leveledUp: false };
    }

    levels[key].xp += amount;
    levels[key].lastXp = now;

    let leveledUp = false;
    let nextLevelXp = getXpForNextLevel(levels[key].level);

    if (levels[key].xp >= nextLevelXp) {
        levels[key].level++;
        leveledUp = true;
    }

    saveLevels(levels);

    return {
        leveledUp,
        level: levels[key].level,
        xp: levels[key].xp,
        nextLevelXp
    };
}

// Admin/Staff: Set level directly (resets XP to 0 by default)
function setLevel(userId, guildId, level, options = {}) {
    const levels = loadLevels();
    const key = `${guildId}-${userId}`;

    const parsedLevel = parseInt(level, 10);
    if (Number.isNaN(parsedLevel) || parsedLevel < 1) {
        return { success: false, error: 'invalid_level' };
    }

    const xp = options.keepXp ? (levels[key]?.xp || 0) : (options.xp ?? 0);

    levels[key] = {
        xp: Math.max(0, parseInt(xp, 10) || 0),
        level: parsedLevel,
        lastXp: 0,
        lastDaily: levels[key]?.lastDaily || 0,
    };

    saveLevels(levels);
    return { success: true, level: levels[key].level, xp: levels[key].xp };
}

// Admin/Staff: Set XP directly (does NOT auto-recalculate level)
function setXp(userId, guildId, xp) {
    const levels = loadLevels();
    const key = `${guildId}-${userId}`;

    const parsedXp = parseInt(xp, 10);
    if (Number.isNaN(parsedXp) || parsedXp < 0) {
        return { success: false, error: 'invalid_xp' };
    }

    if (!levels[key]) {
        levels[key] = { xp: 0, level: 1, lastXp: 0, lastDaily: 0 };
    }

    levels[key].xp = parsedXp;
    levels[key].lastXp = 0;

    saveLevels(levels);
    return { success: true, level: levels[key].level, xp: levels[key].xp };
}

// Get user rank data
function getUserRank(userId, guildId) {
    const levels = loadLevels();
    const key = `${guildId}-${userId}`;

    if (!levels[key]) return null;

    // Calculate rank position
    const sorted = Object.entries(levels)
        .filter(([k]) => k.startsWith(`${guildId}-`))
        .sort(([, a], [, b]) => b.xp - a.xp);

    const rank = sorted.findIndex(([k]) => k === key) + 1;

    return {
        ...levels[key],
        rank,
        nextLevelXp: getXpForNextLevel(levels[key].level)
    };
}

// Get leaderboard
function getLeaderboard(guildId, limit = 10) {
    const levels = loadLevels();
    return Object.entries(levels)
        .filter(([k]) => k.startsWith(`${guildId}-`))
        .sort(([, a], [, b]) => b.xp - a.xp)
        .slice(0, limit)
        .map(([key, data]) => ({
            userId: key.split('-')[1],
            ...data
        }));
}

// Add Daily XP
function addDailyXp(userId, guildId, amount = 100) {
    const levels = loadLevels();
    const key = `${guildId}-${userId}`;

    if (!levels[key]) {
        levels[key] = {
            xp: 0,
            level: 1,
            lastXp: 0,
            lastDaily: 0,
            lastDailyDate: null,
            streak: 0,
        };
    }

    const now = Date.now();
    const todayKey = getDateKey(new Date(now));

    // Backward-compat: derive lastDailyDate if missing
    let lastKey = levels[key].lastDailyDate;
    if (!lastKey && levels[key].lastDaily) {
        lastKey = getDateKey(new Date(levels[key].lastDaily));
        levels[key].lastDailyDate = lastKey;
    }

    if (lastKey === todayKey) {
        return { success: false, alreadyToday: true };
    }

    const yesterdayKey = getDateKey(new Date(now - 24 * 60 * 60 * 1000));
    const prevStreak = parseInt(levels[key].streak || 0, 10) || 0;
    const newStreak = lastKey === yesterdayKey ? prevStreak + 1 : 1;

    levels[key].xp += amount;
    levels[key].lastDaily = now;
    levels[key].lastDailyDate = todayKey;
    levels[key].streak = newStreak;

    let leveledUp = false;
    let nextLevelXp = getXpForNextLevel(levels[key].level);

    if (levels[key].xp >= nextLevelXp) {
        levels[key].level++;
        leveledUp = true;
    }

    saveLevels(levels);

    return {
        success: true,
        leveledUp,
        level: levels[key].level,
        xp: levels[key].xp,
        nextLevelXp,
        streak: levels[key].streak,
        lastDailyDate: levels[key].lastDailyDate,
    };
}

function getStreak(userId, guildId) {
    const levels = loadLevels();
    const key = `${guildId}-${userId}`;
    if (!levels[key]) return null;

    // Backward-compat: derive lastDailyDate if missing
    if (!levels[key].lastDailyDate && levels[key].lastDaily) {
        levels[key].lastDailyDate = getDateKey(new Date(levels[key].lastDaily));
        saveLevels(levels);
    }

    return {
        streak: parseInt(levels[key].streak || 0, 10) || 0,
        lastDailyDate: levels[key].lastDailyDate || null,
    };
}

// Reset Daily
function resetDaily(userId, guildId) {
    const levels = loadLevels();
    const key = `${guildId}-${userId}`;

    if (levels[key]) {
        levels[key].lastDaily = 0;
        levels[key].lastDailyDate = null;
        levels[key].streak = 0;
        saveLevels(levels);
        return true;
    }
    return false;
}

// Reset All Daily
function resetAllDaily(guildId) {
    const levels = loadLevels();
    let count = 0;

    for (const key in levels) {
        if (key.startsWith(`${guildId}-`)) {
            levels[key].lastDaily = 0;
            levels[key].lastDailyDate = null;
            levels[key].streak = 0;
            count++;
        }
    }

    if (count > 0) {
        saveLevels(levels);
    }
    return count;
}

module.exports = {
    addXp,
    getUserRank,
    getLeaderboard,
    getXpForNextLevel,
    addDailyXp,
    getStreak,
    resetDaily,
    resetAllDaily,
    setLevel,
    setXp
};

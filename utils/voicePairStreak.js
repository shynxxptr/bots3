const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/voice_pair_streak.json');
const TZ = 'Asia/Jakarta';

function getDateKey(date = new Date()) {
    // en-CA => YYYY-MM-DD
    try {
        return date.toLocaleDateString('en-CA', { timeZone: TZ });
    } catch (_) {
        return date.toISOString().slice(0, 10);
    }
}

function readConfig() {
    try {
        // reload config to allow runtime edits
        delete require.cache[require.resolve('../config.json')];
        return require('../config.json');
    } catch (_) {
        return {};
    }
}

function getSettings() {
    const cfg = readConfig();
    const vp = cfg.voicePairStreak || {};
    return {
        // 55 minutes tolerance (default)
        requiredSeconds: Number(vp.requiredSeconds ?? 55 * 60),
        minConsecutiveDays: Number(vp.minConsecutiveDays ?? 3),
        limitPerUser: Number(vp.limitPerUser ?? 5),
        tickSeconds: Number(vp.tickSeconds ?? 60),
        // safety cap to avoid O(n^2) explosion in very large voice channels
        maxMembersPerChannel: Number(vp.maxMembersPerChannel ?? 20),
    };
}

function loadStore() {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            const initial = { pairs: {} };
            fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load voice pair streak store:', err);
        return { pairs: {} };
    }
}

function saveStore(store) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save voice pair streak store:', err);
    }
}

function pairKey(a, b) {
    return [a, b].sort().join('-');
}

function ensurePair(store, guildId, a, b) {
    const key = pairKey(a, b);
    if (!store.pairs[key]) {
        store.pairs[key] = {
            key,
            guildId,
            a: [a, b].sort()[0],
            b: [a, b].sort()[1],
            status: 'candidate', // candidate | active
            streak: 0, // only meaningful when active
            candidateConsecutive: 0,
            lastValidDate: null,
            lastActiveDate: null,
            todayKey: null,
            todaySeconds: 0,
            todayValid: false,
            lastNotifiedDate: null,
            createdAt: Date.now(),
        };
    } else {
        // FIX: Update guildId if it's different (handle guild migration or data inconsistency)
        // This ensures pair is tracked in the correct guild
        if (store.pairs[key].guildId !== guildId) {
            store.pairs[key].guildId = guildId;
        }
        // FIX: Ensure todayKey is initialized if null (recovery for existing pairs)
        if (store.pairs[key].todayKey === null || store.pairs[key].todayKey === undefined) {
            store.pairs[key].todayKey = getDateKey();
        }
    }
    return store.pairs[key];
}

function getActivePairsForUser(store, guildId, userId) {
    return Object.values(store.pairs || {}).filter(p =>
        p &&
        p.guildId === guildId &&
        p.status === 'active' &&
        (p.a === userId || p.b === userId)
    );
}

function evictIfOverLimit(store, guildId, userId, limit) {
    let active = getActivePairsForUser(store, guildId, userId);
    while (active.length > limit) {
        // remove lowest streak; tie-breaker: older lastActiveDate
        active.sort((p1, p2) => {
            const s1 = Number(p1.streak || 0);
            const s2 = Number(p2.streak || 0);
            if (s1 !== s2) return s1 - s2;
            const t1 = p1.lastActiveDate ? Date.parse(p1.lastActiveDate) : 0;
            const t2 = p2.lastActiveDate ? Date.parse(p2.lastActiveDate) : 0;
            return t1 - t2;
        });

        const toRemove = active[0];
        delete store.pairs[toRemove.key];
        active = getActivePairsForUser(store, guildId, userId);
    }
}

function markValidToday(store, pair, todayKey, now) {
    const { minConsecutiveDays, limitPerUser } = getSettings();
    const yesterdayKey = getDateKey(new Date(now - 24 * 60 * 60 * 1000));

    pair.todayValid = true;
    pair.lastActiveDate = todayKey;

    if (pair.status === 'active') {
        // Check if streak is broken (more than 1 day gap = bolong sehari)
        // If lastValidDate is not yesterday and not today, streak is broken
        if (pair.lastValidDate && pair.lastValidDate !== yesterdayKey && pair.lastValidDate !== todayKey) {
            // Streak broken (bolong lebih dari 24 jam) - reset streak dan status
            pair.streak = 0;
            pair.status = 'candidate';
            pair.candidateConsecutive = 1;
            pair.lastValidDate = todayKey;
            return { becameActive: false, streak: 0, streakBroken: true };
        }
        
        // If lastValidDate is today, this is a duplicate call in the same day - don't increment
        if (pair.lastValidDate === todayKey) {
            // Already validated today, don't increment streak but return current streak
            return { becameActive: false, streak: pair.streak || 0, alreadyValidated: true };
        }
        
        // Track if streak will increment
        let streakIncremented = false;
        
        // If lastValidDate is yesterday, this is a consecutive day - increment streak
        if (pair.lastValidDate === yesterdayKey) {
            // Consecutive day - increment streak
            const oldStreak = pair.streak || 0;
            pair.streak = oldStreak + 1;
            streakIncremented = true;
        } else if (!pair.lastValidDate) {
            // No lastValidDate - this shouldn't happen for active pairs, but handle it
            // PRESERVE PROGRESS: Keep existing streak, only set to 1 if it's 0
            if (!pair.streak || pair.streak === 0) {
                pair.streak = 1;
                streakIncremented = true;
            }
            // If streak > 0, preserve it (don't reset)
        } else {
            // Gap detected but not broken (shouldn't happen for active, but handle)
            // PRESERVE PROGRESS: Keep current streak, only set to 1 if it's 0
            if (!pair.streak || pair.streak === 0) {
                pair.streak = 1;
                streakIncremented = true;
            }
            // If streak > 0, preserve it (don't reset)
        }
        
        // Update lastValidDate to today
        pair.lastValidDate = todayKey;
        return { becameActive: false, streak: pair.streak, streakIncremented };
    }

    // candidate
    // If lastValidDate is today, this is a duplicate call in the same day - don't change candidateConsecutive
    // PRESERVE PROGRESS: Keep current candidateConsecutive value
    if (pair.lastValidDate === todayKey) {
        // Already validated today, keep current candidateConsecutive (don't lose progress)
        return { becameActive: false, streak: 0, alreadyValidated: true };
    }
    
    // Track old candidateConsecutive to detect if it will change
    const oldCandidateConsecutive = pair.candidateConsecutive || 0;
    
    // PRESERVE PROGRESS: Only increment or reset when necessary, never lose progress accidentally
    if (pair.lastValidDate === yesterdayKey) {
        // Consecutive day - increment candidate (preserve and build on existing progress)
        pair.candidateConsecutive = oldCandidateConsecutive + 1;
    } else if (pair.lastValidDate && pair.lastValidDate !== todayKey) {
        // Gap detected (bolong) - reset candidate consecutive to 1 (only reset when gap confirmed)
        pair.candidateConsecutive = 1;
    } else {
        // First valid day or no lastValidDate
        // If candidateConsecutive already exists and > 0, preserve it (might be recovery case)
        // Otherwise set to 1
        if (!pair.candidateConsecutive || pair.candidateConsecutive === 0) {
            pair.candidateConsecutive = 1;
        }
        // If candidateConsecutive > 0, keep it (preserve progress)
    }

    pair.lastValidDate = todayKey;

    if (pair.candidateConsecutive >= minConsecutiveDays) {
        pair.status = 'active';
        // PRESERVE PROGRESS: Use candidateConsecutive value, not just minConsecutiveDays
        // This ensures if someone had more days, it's preserved
        pair.streak = Math.max(minConsecutiveDays, pair.candidateConsecutive);
        pair.lastActiveDate = todayKey;
        // enforce limit for both users
        evictIfOverLimit(store, pair.guildId, pair.a, limitPerUser);
        evictIfOverLimit(store, pair.guildId, pair.b, limitPerUser);
        return { becameActive: true, streak: pair.streak };
    }

    return { becameActive: false, streak: 0 };
}

/**
 * Tick: accumulate overlap for every pair currently sharing the same voice channel.
 * Designed to run every tickSeconds.
 */
async function tickVoicePairStreak(client) {
    const settings = getSettings();
    const store = loadStore();

    const now = Date.now();
    const todayKey = getDateKey(new Date(now));
    const notifyQueue = [];

    // Track voice time for all users
    const { addVoiceTime } = require('./voiceTime');

    // Build pairs from voice channels in each guild
    for (const guild of client.guilds.cache.values()) {
        // Only track for guilds the bot can see
        const voiceChannels = guild.channels.cache.filter(c => c && typeof c.isVoiceBased === 'function' && c.isVoiceBased());

        for (const channel of voiceChannels.values()) {
            const members = Array.from(channel.members?.values?.() || [])
                .filter(m => m && !m.user?.bot)
                .map(m => m.id);

            // Track voice time for each member (even if alone)
            for (const memberId of members) {
                addVoiceTime(guild.id, memberId, settings.tickSeconds);
                
                // Check achievements for voice time
                try {
                    const { checkAchievementsOnStatUpdate } = require('./achievementNotifications');
                    checkAchievementsOnStatUpdate(client, guild.id, memberId).catch(() => {});
                } catch (err) {
                    // Silent fail
                }
            }

            if (members.length < 2) continue;
            if (members.length > settings.maxMembersPerChannel) continue;

            // Create all unique pairs in this channel
            for (let i = 0; i < members.length; i++) {
                for (let j = i + 1; j < members.length; j++) {
                    const a = members[i];
                    const b = members[j];
                    const pair = ensurePair(store, guild.id, a, b);

                    // FIX: Always check day rollover - use strict comparison and handle null/undefined
                    // Reset today's counters if day rolled or if todayKey is invalid
                    const pairTodayKey = pair.todayKey || null;
                    const dayRolled = (pairTodayKey !== todayKey);
                    
                    if (dayRolled) {
                        // Day rolled over - reset today's counters
                        pair.todayKey = todayKey;
                        pair.todaySeconds = 0;
                        pair.todayValid = false; // FIX: Always reset todayValid on day rollover
                        
                        // Check if streak is broken (bolong lebih dari 24 jam) for active pairs
                        // This check happens when day rolls over, before markValidToday
                        // IMPORTANT: Only reset if streak is truly broken, preserve progress otherwise
                        if (pair.status === 'active') {
                            const yesterdayKey = getDateKey(new Date(now - 24 * 60 * 60 * 1000));
                            // If lastValidDate exists and is not yesterday and not today, streak is broken
                            if (pair.lastValidDate && pair.lastValidDate !== yesterdayKey && pair.lastValidDate !== todayKey) {
                                // Streak broken (bolong lebih dari 24 jam) - reset streak
                                // But preserve candidateConsecutive as 1 since they're starting fresh today
                                pair.streak = 0;
                                pair.status = 'candidate';
                                pair.candidateConsecutive = 1; // Start fresh, not 0
                            }
                            // If lastValidDate is null for an active pair, this is a data inconsistency
                            // Try to recover: if streak > 0, assume they validated yesterday to preserve progress
                            if (!pair.lastValidDate && pair.streak > 0) {
                                pair.lastValidDate = yesterdayKey;
                            }
                        }
                        
                        // For candidates: preserve candidateConsecutive progress when day rolls over
                        // Only reset if there's a gap (handled in markValidToday)
                        // Don't reset here to preserve progress
                    }
                    
                    // FIX: Additional safety check - if todayValid is true but todayKey doesn't match, reset it
                    // This handles edge cases where todayValid might be stuck
                    if (pair.todayValid && pair.todayKey !== todayKey) {
                        pair.todayValid = false;
                        pair.todayKey = todayKey;
                    }

                    // FIX: Only accumulate time if pair is in the correct guild
                    // This prevents cross-guild tracking issues
                    if (pair.guildId !== guild.id) {
                        // Skip this pair if guildId doesn't match (shouldn't happen due to ensurePair fix, but safety)
                        continue;
                    }
                    
                    pair.todaySeconds += settings.tickSeconds;

                    // FIX: Ensure todayValid check works correctly - validate requirements met
                    // Also check if todaySeconds is valid (not NaN or negative)
                    const hasEnoughTime = !isNaN(pair.todaySeconds) && pair.todaySeconds >= settings.requiredSeconds;
                    const notValidatedToday = !pair.todayValid;
                    
                    if (notValidatedToday && hasEnoughTime) {
                        const res = markValidToday(store, pair, todayKey, now);
                        // Notify if: (1) candidate became active, OR (2) active pair and streak incremented
                        // Don't notify if already validated today (shouldn't happen due to todayValid check, but safety)
                        if (!res.alreadyValidated && (res.becameActive || (pair.status === 'active' && res.streakIncremented && res.streak > 0))) {
                            notifyQueue.push({ guildId: guild.id, a: pair.a, b: pair.b, streak: res.streak });
                        }
                    }
                }
            }
        }
    }

    saveStore(store);

    // send notifications after save (best-effort)
    if (notifyQueue.length) {
        const cfg = readConfig();
        const notifyChannelId =
            cfg.voicePairStreak?.notifyChannelId ||
            cfg.levelUpChannelId ||
            cfg.generalChannelId ||
            null;

        for (const item of notifyQueue) {
            try {
                const key = pairKey(item.a, item.b);
                const fresh = loadStore();
                const pair = fresh.pairs?.[key];
                if (!pair) continue;

                // de-dupe per day
                if (pair.lastNotifiedDate === todayKey) continue;
                pair.lastNotifiedDate = todayKey;
                saveStore(fresh);

                const guildObj = client.guilds.cache.get(item.guildId);
                if (!guildObj) continue;

                const channel =
                    (notifyChannelId && guildObj.channels.cache.get(notifyChannelId)) ||
                    guildObj.systemChannel ||
                    null;
                if (!channel || !channel.isTextBased()) continue;

                // Fetch users and members with rate limit handling
                const [userA, userB, memberA, memberB] = await Promise.all([
                    client.users.fetch(item.a).catch((err) => {
                        if (err.code === 50035 || err.message?.includes('rate limit')) {
                            console.warn(`Rate limited while fetching user ${item.a}`);
                        }
                        return null;
                    }),
                    client.users.fetch(item.b).catch((err) => {
                        if (err.code === 50035 || err.message?.includes('rate limit')) {
                            console.warn(`Rate limited while fetching user ${item.b}`);
                        }
                        return null;
                    }),
                    guildObj.members.fetch(item.a).catch((err) => {
                        if (err.code === 50035 || err.message?.includes('rate limit')) {
                            console.warn(`Rate limited while fetching member ${item.a}`);
                        }
                        return null;
                    }),
                    guildObj.members.fetch(item.b).catch((err) => {
                        if (err.code === 50035 || err.message?.includes('rate limit')) {
                            console.warn(`Rate limited while fetching member ${item.b}`);
                        }
                        return null;
                    }),
                ]);
                if (!userA || !userB) continue;

                // Use member if available for server nickname, otherwise use user
                const leftUser = memberA || userA;
                const rightUser = memberB || userB;

                const { generateVoicePairStreakCard } = require('./voicePairStreakRenderer');
                const card = await generateVoicePairStreakCard({
                    leftUser: leftUser,
                    rightUser: rightUser,
                    streak: item.streak,
                    cardConfig: cfg.voicePairStreakCard || {},
                });

                await channel.send({
                    content: `🔥 **Streak Voice S3 naik!** <@${item.a}> x <@${item.b}> → **${item.streak} hari**`,
                    files: [card],
                });
            } catch (err) {
                console.error('Voice pair streak notify failed:', err);
            }
        }
    }
}

function getPairStreak(guildId, userA, userB) {
    const store = loadStore();
    const key = pairKey(userA, userB);
    const p = store.pairs?.[key];
    if (!p) return null;
    
    // FIX: If guildId doesn't match, return null (pair belongs to different guild)
    // But also log a warning if this happens (might indicate data inconsistency)
    if (p.guildId !== guildId) {
        return null;
    }
    
    // FIX: Ensure pair data is valid - initialize missing fields if needed
    if (p.todayKey === null || p.todayKey === undefined) {
        p.todayKey = getDateKey();
    }
    if (p.todaySeconds === null || p.todaySeconds === undefined) {
        p.todaySeconds = 0;
    }
    if (p.todayValid === null || p.todayValid === undefined) {
        p.todayValid = false;
    }
    
    return p;
}

function getTopPairsForUser(guildId, userId, limit = 5) {
    const store = loadStore();
    const active = getActivePairsForUser(store, guildId, userId);
    active.sort((p1, p2) => (Number(p2.streak || 0) - Number(p1.streak || 0)));
    return active.slice(0, limit);
}

/**
 * Set streak for a pair manually (staff-only)
 * This will set the streak value and update lastValidDate to today
 * so that the streak will increment correctly on the next day
 */
function setPairStreak(guildId, userA, userB, streak) {
    const store = loadStore();
    const pair = ensurePair(store, guildId, userA, userB);
    const todayKey = getDateKey();
    
    // Validate streak value
    const streakNum = parseInt(streak, 10);
    if (isNaN(streakNum) || streakNum < 0) {
        return { success: false, error: 'Streak harus berupa angka >= 0' };
    }
    
    // Set streak
    pair.streak = streakNum;
    
    // Update status based on streak
    if (streakNum > 0) {
        pair.status = 'active';
        pair.lastActiveDate = todayKey;
    } else {
        pair.status = 'candidate';
        pair.candidateConsecutive = 0;
    }
    
    // Set lastValidDate to today so that tomorrow it will increment correctly
    // This is crucial: if we set streak today, tomorrow's markValidToday will see
    // lastValidDate === yesterdayKey and will increment the streak
    pair.lastValidDate = todayKey;
    
    // Reset today's counters to avoid confusion
    pair.todayKey = todayKey;
    pair.todaySeconds = 0;
    pair.todayValid = false;
    
    saveStore(store);
    
    return { 
        success: true, 
        streak: pair.streak,
        status: pair.status,
        lastValidDate: pair.lastValidDate
    };
}

/**
 * Test streak notification - generate and send a test streak card
 */
async function testStreakNotification(client, guildId, userId1, userId2, streak = 5) {
    try {
        const cfg = readConfig();
        const guildObj = client.guilds.cache.get(guildId);
        if (!guildObj) return { success: false, error: 'Guild not found' };

        const channel =
            (cfg.voicePairStreak?.notifyChannelId && guildObj.channels.cache.get(cfg.voicePairStreak.notifyChannelId)) ||
            guildObj.systemChannel ||
            null;
        if (!channel || !channel.isTextBased()) {
            return { success: false, error: 'Channel not found or not text-based' };
        }

        const [userA, userB, memberA, memberB] = await Promise.all([
            client.users.fetch(userId1).catch(() => null),
            client.users.fetch(userId2).catch(() => null),
            guildObj.members.fetch(userId1).catch(() => null),
            guildObj.members.fetch(userId2).catch(() => null),
        ]);
        if (!userA || !userB) {
            return { success: false, error: 'Users not found' };
        }

        const leftUser = memberA || userA;
        const rightUser = memberB || userB;

        const { generateVoicePairStreakCard } = require('./voicePairStreakRenderer');
        const card = await generateVoicePairStreakCard({
            leftUser: leftUser,
            rightUser: rightUser,
            streak: streak,
            cardConfig: cfg.voicePairStreakCard || {},
        });

        await channel.send({
            content: `🔥 **Streak Voice S3 naik!** <@${userId1}> x <@${userId2}> → **${streak} hari**\n*(Test notification)*`,
            files: [card],
        });

        return { success: true };
    } catch (err) {
        console.error('Test streak notification failed:', err);
        return { success: false, error: err.message };
    }
}

module.exports = {
    STORE_PATH,
    tickVoicePairStreak,
    getPairStreak,
    getTopPairsForUser,
    getSettings,
    testStreakNotification,
    getDateKey,
    setPairStreak,
};



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
        } else if (pair.lastValidDate === yesterdayKey) {
            // Consecutive day - increment streak
            pair.streak = (pair.streak || 0) + 1;
        } else {
            // First valid day or same day - set to 1
            pair.streak = 1;
        }
        pair.lastValidDate = todayKey;
        return { becameActive: false, streak: pair.streak };
    }

    // candidate
    if (pair.lastValidDate === yesterdayKey) {
        // Consecutive day - increment candidate
        pair.candidateConsecutive = (pair.candidateConsecutive || 0) + 1;
    } else if (pair.lastValidDate && pair.lastValidDate !== todayKey) {
        // Gap detected (bolong) - reset candidate consecutive
        pair.candidateConsecutive = 1;
    } else {
        // First valid day or same day
        pair.candidateConsecutive = 1;
    }

    pair.lastValidDate = todayKey;

    if (pair.candidateConsecutive >= minConsecutiveDays) {
        pair.status = 'active';
        pair.streak = minConsecutiveDays; // starts at 3
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

    // Build pairs from voice channels in each guild
    for (const guild of client.guilds.cache.values()) {
        // Only track for guilds the bot can see
        const voiceChannels = guild.channels.cache.filter(c => c && typeof c.isVoiceBased === 'function' && c.isVoiceBased());

        for (const channel of voiceChannels.values()) {
            const members = Array.from(channel.members?.values?.() || [])
                .filter(m => m && !m.user?.bot)
                .map(m => m.id);

            if (members.length < 2) continue;
            if (members.length > settings.maxMembersPerChannel) continue;

            // Create all unique pairs in this channel
            for (let i = 0; i < members.length; i++) {
                for (let j = i + 1; j < members.length; j++) {
                    const a = members[i];
                    const b = members[j];
                    const pair = ensurePair(store, guild.id, a, b);

                    // reset today's counters if day rolled
                    if (pair.todayKey !== todayKey) {
                        pair.todayKey = todayKey;
                        pair.todaySeconds = 0;
                        pair.todayValid = false;
                        
                        // Check if streak is broken (bolong lebih dari 24 jam) for active pairs
                        // This check happens when day rolls over, before markValidToday
                        if (pair.status === 'active' && pair.lastValidDate) {
                            const yesterdayKey = getDateKey(new Date(now - 24 * 60 * 60 * 1000));
                            // If lastValidDate is not yesterday and not today, streak is broken
                            if (pair.lastValidDate !== yesterdayKey && pair.lastValidDate !== todayKey) {
                                // Streak broken (bolong lebih dari 24 jam) - reset streak
                                pair.streak = 0;
                                pair.status = 'candidate';
                                pair.candidateConsecutive = 0;
                            }
                        }
                    }

                    pair.todaySeconds += settings.tickSeconds;

                    if (!pair.todayValid && pair.todaySeconds >= settings.requiredSeconds) {
                        const res = markValidToday(store, pair, todayKey, now);
                        if (pair.status === 'active') {
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

                const [userA, userB, memberA, memberB] = await Promise.all([
                    client.users.fetch(item.a).catch(() => null),
                    client.users.fetch(item.b).catch(() => null),
                    guildObj.members.fetch(item.a).catch(() => null),
                    guildObj.members.fetch(item.b).catch(() => null),
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
    if (!p || p.guildId !== guildId) return null;
    return p;
}

function getTopPairsForUser(guildId, userId, limit = 5) {
    const store = loadStore();
    const active = getActivePairsForUser(store, guildId, userId);
    active.sort((p1, p2) => (Number(p2.streak || 0) - Number(p1.streak || 0)));
    return active.slice(0, limit);
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
};



const { tickVoicePairStreak, getSettings, STORE_PATH } = require('../utils/voicePairStreak');
const fs = require('fs');
const path = require('path');

// Mock client
const client = {
    guilds: {
        cache: new Map()
    },
    users: {
        fetch: async () => ({})
    }
};

// Mock guild and channel
const guildId = 'guild1';
const channelId = 'channel1';
const memberIds = ['user1', 'user2', 'user3']; // 3 members

const guild = {
    id: guildId,
    channels: {
        cache: new Map()
    },
    members: {
        fetch: async () => ({})
    }
};

const channel = {
    id: channelId,
    isVoiceBased: () => true,
    members: {
        values: () => memberIds.map(id => ({ id, user: { bot: false } }))
    }
};

guild.channels.cache.set(channelId, channel);
client.guilds.cache.set(guildId, guild);

// Mock config to set low limit
const configPath = path.join(__dirname, '../config.json');
let originalConfig = '{}';
if (fs.existsSync(configPath)) {
    originalConfig = fs.readFileSync(configPath, 'utf8');
}
const config = JSON.parse(originalConfig);

// Set limit to 2 (so 3 members should fail)
config.voicePairStreak = {
    maxMembersPerChannel: 2,
    tickSeconds: 60,
    requiredSeconds: 3600
};

// Backup and write mock config
if (fs.existsSync(configPath)) {
    fs.renameSync(configPath, configPath + '.bak');
}
fs.writeFileSync(configPath, JSON.stringify(config));

// Backup store
if (fs.existsSync(STORE_PATH)) {
    fs.renameSync(STORE_PATH, STORE_PATH + '.bak');
}

(async () => {
    try {
        console.log('Running tick with 3 members and limit 2...');
        await tickVoicePairStreak(client);

        // Check store
        let store = { pairs: {} };
        if (fs.existsSync(STORE_PATH)) {
            store = JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
        }

        const key = ['user1', 'user2'].sort().join('-');
        const pair = store.pairs[key];

        if (!pair) {
            console.log('Result: Pair NOT created (Expected behavior due to limit)');
        } else {
            console.log('Result: Pair created (Unexpected)');
            console.log('Today Seconds:', pair.todaySeconds);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        // Restore config and store
        if (fs.existsSync(configPath + '.bak')) {
            fs.unlinkSync(configPath); // Remove mock
            fs.renameSync(configPath + '.bak', configPath);
        }

        if (fs.existsSync(STORE_PATH + '.bak')) {
            if (fs.existsSync(STORE_PATH)) fs.unlinkSync(STORE_PATH);
            fs.renameSync(STORE_PATH + '.bak', STORE_PATH);
        } else if (fs.existsSync(STORE_PATH)) {
            fs.unlinkSync(STORE_PATH);
        }
    }
})();

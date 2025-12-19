const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/suggestions.json');

function loadStore() {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            const initial = { suggestions: {} };
            fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load suggestions store:', err);
        return { suggestions: {} };
    }
}

function saveStore(store) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save suggestions store:', err);
    }
}

function getSuggestion(messageId) {
    const store = loadStore();
    return store.suggestions?.[messageId] || null;
}

function upsertSuggestion(messageId, data) {
    const store = loadStore();
    if (!store.suggestions) store.suggestions = {};
    store.suggestions[messageId] = { ...(store.suggestions[messageId] || {}), ...data };
    saveStore(store);
    return store.suggestions[messageId];
}

function toggleVote(messageId, userId, direction /* 'up'|'down' */) {
    const entry = getSuggestion(messageId) || {
        status: 'considering',
        upvotes: [],
        downvotes: [],
    };

    const up = new Set(entry.upvotes || []);
    const down = new Set(entry.downvotes || []);

    if (direction === 'up') {
        if (up.has(userId)) up.delete(userId);
        else {
            up.add(userId);
            down.delete(userId);
        }
    } else if (direction === 'down') {
        if (down.has(userId)) down.delete(userId);
        else {
            down.add(userId);
            up.delete(userId);
        }
    }

    return upsertSuggestion(messageId, {
        upvotes: Array.from(up),
        downvotes: Array.from(down),
    });
}

module.exports = {
    STORE_PATH,
    getSuggestion,
    upsertSuggestion,
    toggleVote,
};



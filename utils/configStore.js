const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../config.json');

function readConfig() {
    try {
        const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (err) {
        console.error('Failed to read config.json:', err);
        return {};
    }
}

/**
 * Shallow-merge updates into existing config (objects at top-level are merged).
 * This avoids accidentally wiping unrelated keys.
 */
function writeConfig(partialUpdate) {
    const current = readConfig();
    const next = { ...current };

    for (const [key, value] of Object.entries(partialUpdate || {})) {
        if (
            value &&
            typeof value === 'object' &&
            !Array.isArray(value) &&
            current[key] &&
            typeof current[key] === 'object' &&
            !Array.isArray(current[key])
        ) {
            next[key] = { ...current[key], ...value };
        } else {
            next[key] = value;
        }
    }

    fs.writeFileSync(CONFIG_PATH, JSON.stringify(next, null, 4));
    return next;
}

module.exports = {
    readConfig,
    writeConfig,
    CONFIG_PATH,
};



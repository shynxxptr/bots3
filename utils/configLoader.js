const fs = require('fs');
const path = require('path');

const getWelcomeConfig = () => {
    try {
        const configPath = path.join(__dirname, '../config.json');
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (e) {
        console.error("Failed to load config", e);
        return {};
    }
};

module.exports = { getWelcomeConfig };

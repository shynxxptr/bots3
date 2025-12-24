const { Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.MessageDelete,
    async execute(message) {
        // Ignore if no guild or bot message
        if (!message.guild || message.author?.bot) return;

        // Check if deleted message is in counting channel
        if (config.counting && config.counting.channelId && message.channel.id === config.counting.channelId) {
            try {
                const { handleMessageDeletion } = require('../utils/counting');
                const result = handleMessageDeletion(message.id);

                if (result.success && result.action === 'adjusted') {
                    // Notify if count was adjusted
                    await message.channel.send(result.message);
                }
            } catch (error) {
                console.error('Error handling counting message deletion:', error);
            }
        }
    },
};


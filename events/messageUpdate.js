const { Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.MessageUpdate,
    async execute(oldMessage, newMessage) {
        // Ignore if no guild or bot message
        if (!newMessage.guild || newMessage.author?.bot) return;

        // Ignore if content hasn't changed
        if (oldMessage.content === newMessage.content) return;

        // Check if updated message is in counting channel
        if (config.counting && config.counting.channelId && newMessage.channel.id === config.counting.channelId) {
            try {
                const { processCountingMessage } = require('../utils/counting');
                
                // First, handle deletion of old message (if it was a valid counting message)
                const { handleMessageDeletion } = require('../utils/counting');
                handleMessageDeletion(oldMessage.id);

                // Then process the new message content
                const result = processCountingMessage(newMessage.author.id, newMessage.id, newMessage.content);

                if (result.success) {
                    // Correct number after edit
                    await newMessage.react('✅');
                } else if (result.action === 'same_user') {
                    // Same user counting twice (shouldn't happen on edit, but handle it)
                    await newMessage.react('❌');
                    await newMessage.channel.send(`🚫 <@${newMessage.author.id}>, ${result.message}`);
                } else if (result.action === 'wrong_number') {
                    // Wrong number after edit
                    await newMessage.react('❌');
                    await newMessage.channel.send(`💀 <@${newMessage.author.id}>, ${result.message}`);
                }
            } catch (error) {
                console.error('Error handling counting message update:', error);
            }
        }
    },
};



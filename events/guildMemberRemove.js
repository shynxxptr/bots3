const { Events, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createGoodbyeImage } = require('../utils/goodbyeImage');
const { getWelcomeConfig } = require('../utils/configLoader');
const path = require('path');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        const channelId = process.env.GOODBYE_CHANNEL_ID;
        const channel = member.guild.channels.cache.get(channelId);

        if (!channel) return console.log('Goodbye channel not found');

        try {
            const buffer = await createGoodbyeImage(member);
            const attachment = new AttachmentBuilder(buffer, { name: 'goodbye.png' });
            const logoAttachment = new AttachmentBuilder(path.join(__dirname, '../assets/logo.png'), { name: 'logo.png' });

            const config = getWelcomeConfig();
            const goodbyeConfig = config.goodbye || {};
            let messageContent = goodbyeConfig.goodbyeMessage || `Goodbye, ${member}!`;
            messageContent = messageContent.replace('{{userId}}', member.id).replace('{user}', `<@${member.id}>`);

            const embed = new EmbedBuilder()
                .setDescription(messageContent)
                .setImage('attachment://goodbye.png')
                .setThumbnail('attachment://logo.png')
                .setColor(config.embedColor || '#00008B');

            await channel.send({
                embeds: [embed],
                files: [attachment, logoAttachment]
            });
        } catch (error) {
            console.error('Error sending goodbye message:', error);
        }

        // Update Server Stats
        const { updateServerStats } = require('../utils/serverStats');
        updateServerStats(member.guild);
    },
};

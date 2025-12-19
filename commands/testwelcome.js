const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const path = require('path');
const { createWelcomeImage } = require('../utils/welcomeImage');
const { getWelcomeConfig } = require('../utils/configLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testwelcome')
        .setDescription('Test the welcome image generation'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const buffer = await createWelcomeImage(interaction.member);
            const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });
            const logoAttachment = new AttachmentBuilder(path.join(__dirname, '../assets/logo.png'), { name: 'logo.png' });

            const config = getWelcomeConfig();
            let messageContent = config.welcomeMessage || `Welcome to the server, ${interaction.member}! (Test)`;
            messageContent = messageContent.replace('{{userId}}', interaction.member.id);

            const embed = new EmbedBuilder()
                .setDescription(messageContent)
                .setImage('attachment://welcome.png')
                .setThumbnail('attachment://logo.png')
                .setColor(config.embedColor || '#00008B');

            await interaction.editReply({
                embeds: [embed],
                files: [attachment, logoAttachment]
            });
        } catch (error) {
            console.error('Error sending test welcome message:', error);
            await interaction.editReply('Failed to generate welcome image.');
        }
    },
};

const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { createGoodbyeImage } = require('../utils/goodbyeImage');
const { getWelcomeConfig } = require('../utils/configLoader');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testgoodbye')
        .setDescription('Test the goodbye image generation'),
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const buffer = await createGoodbyeImage(interaction.member);
            const attachment = new AttachmentBuilder(buffer, { name: 'goodbye.png' });
            const logoAttachment = new AttachmentBuilder(path.join(__dirname, '../assets/logo.png'), { name: 'logo.png' });

            const config = getWelcomeConfig();
            const goodbyeConfig = config.goodbye || {};
            let messageContent = goodbyeConfig.goodbyeMessage || `Goodbye, ${interaction.member}! (Test)`;
            messageContent = messageContent.replace('{{userId}}', interaction.member.id).replace('{user}', `<@${interaction.member.id}>`);

            const embed = new EmbedBuilder()
                .setDescription(messageContent)
                .setImage('attachment://goodbye.png')
                .setThumbnail('attachment://logo.png')
                .setColor(config.embedColor || '#00008B');

            await interaction.editReply({
                embeds: [embed],
                files: [attachment, logoAttachment]
            });
        } catch (error) {
            console.error('Error sending test goodbye message:', error);
            await interaction.editReply('Failed to generate goodbye image.');
        }
    },
};

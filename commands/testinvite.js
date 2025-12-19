const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const path = require('path');
const { getWelcomeConfig } = require('../utils/configLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testinvite')
        .setDescription('Test the invite tracker message'),
    async execute(interaction) {
        await interaction.deferReply();

        try {
            const jalurKhususAttachment = new AttachmentBuilder(path.join(__dirname, '../assets/jalur_khusus.jpg'), { name: 'jalur_khusus.jpg' });
            const logoAttachment = new AttachmentBuilder(path.join(__dirname, '../assets/logo.png'), { name: 'logo.png' });
            const config = getWelcomeConfig();

            // Mock data for testing
            const member = interaction.member;
            const inviter = interaction.user; // The user running the command is the "inviter"
            const inviterCount = 69; // Mock count

            let inviteMessageContent = config.inviteMessage || `Invited by {{inviter}}`;

            inviteMessageContent = inviteMessageContent
                .replace(/{{userId}}/g, member.id)
                .replace(/{{inviter}}/g, inviter.toString())
                .replace(/{{inviterCount}}/g, inviterCount.toString());

            const inviteEmbed = new EmbedBuilder()
                .setDescription(inviteMessageContent)
                .setThumbnail('attachment://logo.png')
                .setImage('attachment://jalur_khusus.jpg')
                .setColor(config.embedColor || '#00008B');

            await interaction.editReply({
                embeds: [inviteEmbed],
                files: [jalurKhususAttachment, logoAttachment]
            });
        } catch (error) {
            console.error('Error sending test invite message:', error);
            await interaction.editReply('Failed to send test invite message.');
        }
    },
};

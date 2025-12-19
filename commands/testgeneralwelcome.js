const { SlashCommandBuilder } = require('discord.js');
const { getWelcomeConfig } = require('../utils/configLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testgeneralwelcome')
        .setDescription('Test the random general chat welcome message'),
    async execute(interaction) {
        const config = getWelcomeConfig();
        const generalChannelId = config.generalChannelId;

        if (!config.randomWelcomeMessages || config.randomWelcomeMessages.length === 0) {
            return interaction.reply({ content: '❌ No random welcome messages configured in `config.json`.', ephemeral: true });
        }

        const randomMessage = config.randomWelcomeMessages[Math.floor(Math.random() * config.randomWelcomeMessages.length)];
        const finalMessage = randomMessage.replace(/{{userId}}/g, interaction.user.id);

        await interaction.reply({
            content: `**[Test]** This message would be sent to <#${generalChannelId}>:\n\n${finalMessage}`,
            allowedMentions: { parse: [] } // Prevent actual ping during test
        });
    },
};

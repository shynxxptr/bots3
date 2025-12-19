const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getLeaderboard } = require('../utils/leveling');
const { generateLeaderboardImage } = require('../utils/leaderboardRenderer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription('Lihat top 100 member dengan level tertinggi'),
    async execute(interaction) {
        await interaction.deferReply();

        // Fetch top 100
        const fullLeaderboard = getLeaderboard(interaction.guild.id, 100);

        if (fullLeaderboard.length === 0) {
            return interaction.editReply('Belum ada data leaderboard.');
        }

        const itemsPerPage = 10;
        const totalPages = Math.ceil(fullLeaderboard.length / itemsPerPage);
        const currentPage = 1;

        // Slice data for page 1
        const pageData = fullLeaderboard.slice(0, itemsPerPage);

        // Generate Image
        const attachment = await generateLeaderboardImage(interaction.guild, pageData, currentPage, totalPages);

        // Buttons
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('leaderboard_prev_1') // Current page 1, so prev is disabled anyway
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true),
                new ButtonBuilder()
                    .setCustomId('leaderboard_next_2') // Next page 2
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(totalPages <= 1)
            );

        await interaction.editReply({ files: [attachment], components: [row] });
    },
};

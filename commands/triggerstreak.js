const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { triggerStreakNotification, getPairStreak } = require('../utils/voicePairStreak');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('triggerstreak')
        .setDescription('Trigger notifikasi streak untuk pair (Admin Only)')
        .addUserOption(option =>
            option.setName('user1')
                .setDescription('User pertama')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('user2')
                .setDescription('User kedua')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('streak')
                .setDescription('Streak value (optional, akan pakai streak dari data jika tidak diisi)')
                .setMinValue(1))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            const user1 = interaction.options.getUser('user1');
            const user2 = interaction.options.getUser('user2');
            const streakOption = interaction.options.getInteger('streak');

            // Check if users are the same
            if (user1.id === user2.id) {
                await interaction.editReply({
                    content: '❌ User pertama dan kedua tidak boleh sama!'
                });
                return;
            }

            // Check if pair exists
            const pair = getPairStreak(interaction.guild.id, user1.id, user2.id);
            if (!pair) {
                await interaction.editReply({
                    content: '❌ Pair tidak ditemukan. Pastikan kedua user sudah pernah di voice channel bersama.'
                });
                return;
            }

            // Check if pair is active
            if (pair.status !== 'active') {
                await interaction.editReply({
                    content: `❌ Pair belum active. Status saat ini: **${pair.status}**\n` +
                        `Streak: ${pair.streak || 0} | Candidate Consecutive: ${pair.candidateConsecutive || 0}`
                });
                return;
            }

            // Use provided streak or current streak from data
            const streakToUse = streakOption !== null ? streakOption : (pair.streak || 0);

            if (streakToUse <= 0) {
                await interaction.editReply({
                    content: '❌ Streak harus > 0. Streak saat ini: ' + (pair.streak || 0)
                });
                return;
            }

            // Trigger notification
            const result = await triggerStreakNotification(
                interaction.client,
                interaction.guild.id,
                user1.id,
                user2.id,
                streakOption !== null ? streakOption : null // Pass null to use data streak
            );

            if (result.success) {
                await interaction.editReply({
                    content: `✅ Notifikasi streak berhasil dikirim!\n` +
                        `👥 **${user1.tag}** x **${user2.tag}**\n` +
                        `🔥 Streak: **${streakToUse} hari**`
                });
            } else {
                await interaction.editReply({
                    content: `❌ Gagal mengirim notifikasi: ${result.error || 'Unknown error'}`
                });
            }
        } catch (error) {
            console.error('Error in triggerstreak command:', error);
            await interaction.editReply({
                content: '❌ Terjadi error saat memproses command. Coba lagi nanti.'
            });
        }
    },
};


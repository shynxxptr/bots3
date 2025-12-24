const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setCountingCount, getCountingStatus, resetCounting } = require('../utils/counting');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setcount')
        .setDescription('Atur count counting (Admin Only)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set count ke angka tertentu')
                .addIntegerOption(option =>
                    option.setName('count')
                        .setDescription('Angka count yang ingin di-set')
                        .setRequired(true)
                        .setMinValue(0)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset count ke 0'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('status')
                .setDescription('Lihat status count saat ini'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            if (subcommand === 'set') {
                const count = interaction.options.getInteger('count');
                const result = setCountingCount(count);

                if (result.success) {
                    await interaction.reply({
                        content: `✅ ${result.message}`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `❌ ${result.error}`,
                        ephemeral: true
                    });
                }
            } else if (subcommand === 'reset') {
                const result = resetCounting();

                if (result.success) {
                    await interaction.reply({
                        content: `✅ Count berhasil di-reset ke **0**`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({
                        content: `❌ ${result.error}`,
                        ephemeral: true
                    });
                }
            } else if (subcommand === 'status') {
                const status = getCountingStatus();
                await interaction.reply({
                    content: `📊 **Status Counting:**\n` +
                        `🔢 Current Count: **${status.currentCount}**\n` +
                        `👤 Last User: ${status.lastUserId ? `<@${status.lastUserId}>` : 'Tidak ada'}\n` +
                        `📝 Next Number: **${status.currentCount + 1}**`,
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Error in setcount command:', error);
            await interaction.reply({
                content: '❌ Terjadi error saat memproses command. Coba lagi nanti.',
                ephemeral: true
            });
        }
    },
};


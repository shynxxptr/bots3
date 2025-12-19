const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { resetDaily } = require('../utils/leveling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetabsen')
        .setDescription('Reset status absen harian user (Admin Only)')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('User yang akan di-reset')
                .setRequired(true))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');

        const success = resetDaily(targetUser.id, interaction.guild.id);

        if (success) {
            await interaction.reply({
                content: `✅ Status absen untuk **${targetUser.tag}** berhasil di-reset! Mereka bisa absen lagi sekarang.`,
                ephemeral: true
            });
        } else {
            await interaction.reply({
                content: `❌ Data user tidak ditemukan atau belum pernah absen.`,
                ephemeral: true
            });
        }
    },
};

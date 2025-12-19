const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { resetAllDaily } = require('../utils/leveling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resetabsenall')
        .setDescription('Reset status absen harian SEMUA user (Admin Only)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const count = resetAllDaily(interaction.guild.id);

        await interaction.editReply({
            content: `✅ Berhasil me-reset status absen untuk **${count}** user! Semua orang bisa absen lagi sekarang.`
        });
    },
};

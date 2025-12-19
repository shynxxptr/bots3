const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setupkartu')
        .setDescription('Kirim pesan dengan tombol Buat Kartu Pelajar')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🎓 Kartu Pelajar')
            .setDescription('Klik tombol di bawah ini untuk membuat Kartu Pelajar kamu.\nPastikan data yang kamu masukkan benar!')
            .setColor(0x0099FF);

        const button = new ButtonBuilder()
            .setCustomId('btn_buat_kartu')
            .setLabel('Buat Kartu Pelajar')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🆔');

        const row = new ActionRowBuilder()
            .addComponents(button);

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};

const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inputdata')
        .setDescription('Input data siswa untuk Kartu Pelajar'),
    async execute(interaction) {
        const modal = new ModalBuilder()
            .setCustomId('inputDataModal')
            .setTitle('Input Data Siswa');

        const nameInput = new TextInputBuilder()
            .setCustomId('nameInput')
            .setLabel("Nama Siswa")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const nisnInput = new TextInputBuilder()
            .setCustomId('nisnInput')
            .setLabel("Nomor Induk (NISN)")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const jurusanInput = new TextInputBuilder()
            .setCustomId('jurusanInput')
            .setLabel("Jurusan")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const kelasInput = new TextInputBuilder()
            .setCustomId('kelasInput')
            .setLabel("Kelas (X, XI, XII)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("Contoh: X, XI, atau XII")
            .setRequired(true);

        const firstActionRow = new ActionRowBuilder().addComponents(nameInput);
        const secondActionRow = new ActionRowBuilder().addComponents(kelasInput);

        modal.addComponents(firstActionRow, secondActionRow);

        await interaction.showModal(modal);
    },
};

const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Tampilkan informasi bantuan server'),
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('🏫 Bantuan Sekolah Suka Suka (S3)')
            .setDescription('Selamat datang di pusat bantuan S3! Berikut adalah informasi yang mungkin kamu butuhkan:')
            .addFields(
                { name: '📜 Rules', value: 'Jangan lupa baca rules di <#1444681657226625054> ya!', inline: false },
                { name: '🎭 Ambil Role', value: 'Pilih jurusan dan atributmu di <#1444683281311334623>.', inline: false },
                { name: '🗺️ Denah Sekolah', value: 'Cek lokasi penting di <#1444681778915840010>.', inline: false },
                { name: '💬 Ngobrol', value: 'Gabung obrolan seru di <#1444684280436359380>.', inline: false }
            )
            .setColor('#00008B')
            .setFooter({ text: 'S3 — Guru Rapat, Siswa Merapat. 💫' });

        await interaction.reply({ embeds: [embed] });
    },
};

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
                { name: '💬 Ngobrol', value: 'Gabung obrolan seru di <#1444684280436359380>.', inline: false },
                { 
                    name: '⚡ Slash Commands', 
                    value: 
                        '`/absen` - Absen harian untuk XP\n' +
                        '`/help` - Tampilkan bantuan ini\n' +
                        '`/leaderboard` - Lihat top 100 ranking\n' +
                        '`/rank [user]` - Lihat kartu level\n' +
                        '`/menfess` - Kirim menfess baru\n' +
                        '`/inputdata` - Input data untuk Kartu Pelajar',
                    inline: false 
                },
                { 
                    name: '💬 Prefix Commands', 
                    value: 
                        '`!hadir` - Absen harian (alternatif)\n' +
                        '`!streak` - Cek daily streak kamu\n' +
                        '`!vstreak [@user]` - Cek voice pair streak\n' +
                        '`!saran <text>` - Buat saran baru\n' +
                        '`s3!help` - Bantuan alternatif',
                    inline: false 
                },
                { 
                    name: '🎫 Fitur Lainnya', 
                    value: 
                        '• **Ticket Box** - Klik tombol di channel ticket untuk buat ticket\n' +
                        '• **Kotak Saran** - Gunakan `!saran` atau tombol di ticket panel\n' +
                        '• **Kartu Pelajar** - Klik tombol di channel kartu pelajar\n' +
                        '• **Voice Streak** - Bareng di voice channel ≥55 menit/hari untuk streak!',
                    inline: false 
                }
            )
            .setColor('#00008B')
            .setFooter({ text: 'S3 — Guru Rapat, Siswa Merapat. 💫' });

        await interaction.reply({ embeds: [embed] });
    },
};

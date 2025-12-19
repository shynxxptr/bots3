const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('selfgame')
        .setDescription('Menampilkan menu pemilihan role game')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const roles = config.gameRoles;

        if (!roles || roles.length === 0) {
            return interaction.reply({ content: 'Konfigurasi game roles belum diatur!', ephemeral: true });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('self_game_select')
            .setPlaceholder('Pilih game yang kamu mainkan...')
            .setMinValues(0)
            .setMaxValues(roles.length)
            .addOptions([
                {
                    label: '❌ Hapus Semua Role Game',
                    description: 'Lepas semua role game yang kamu punya',
                    value: 'clear_all',
                    emoji: '🗑️'
                },
                ...roles.map(role => {
                    const emoji = role.emoji;
                    const customEmojiMatch = emoji.match(/<:.*:(\d+)>/);

                    return {
                        label: role.label,
                        description: role.description,
                        value: role.value,
                        emoji: customEmojiMatch ? customEmojiMatch[1] : emoji,
                    };
                })
            ]);

        const row = new ActionRowBuilder().addComponents(select);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🎮 Pilih Game Favoritmu')
            .setDescription('Pilih game yang sering kamu mainkan untuk mendapatkan role dan teman mabar!\nKamu bisa memilih lebih dari satu game.')
            .setFooter({ text: 'S3 - Sekolah Suka Suka' });

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};

const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('selfrole')
        .setDescription('Menampilkan menu pemilihan role')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    async execute(interaction) {
        const roles = config.selfRoles;

        if (!roles || roles.length === 0) {
            return interaction.reply({ content: 'Konfigurasi self roles belum diatur!', ephemeral: true });
        }

        const select = new StringSelectMenuBuilder()
            .setCustomId('self_role_select')
            .setPlaceholder('Pilih jurusan kamu...')
            .setMinValues(0)
            .setMaxValues(1)
            .addOptions(
                roles.map(role => {
                    const emoji = role.emoji;
                    // Check if custom emoji format <:name:id>
                    const customEmojiMatch = emoji.match(/<:.*:(\d+)>/);

                    return {
                        label: role.label,
                        description: role.description,
                        value: role.value,
                        emoji: customEmojiMatch ? customEmojiMatch[1] : emoji,
                    };
                })
            );

        const row = new ActionRowBuilder().addComponents(select);

        const embed = new EmbedBuilder()
            .setColor(config.embedColor)
            .setTitle('🎓 Pilih Jurusan Kamu')
            .setDescription('Silahkan pilih jurusan yang sesuai dengan minat kamu.\nJurusan hanya bisa dipilih satu!')
            .setFooter({ text: 'S3 - Sekolah Suka Suka' });

        await interaction.reply({ embeds: [embed], components: [row] });
    },
};

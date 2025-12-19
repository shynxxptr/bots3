const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { hasModPermission, getTimeoutStatus, timedOutUsersMap } = require('../utils/menfessFeature.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('controlpanel')
        .setDescription('Panel admin untuk mengelola user menfess.')
        .addSubcommand(subcommand =>
            subcommand
                .setName('manage')
                .setDescription('Membuka panel moderasi untuk user tertentu.')
                .addUserOption(option =>
                    option.setName('user')
                        .setDescription('User yang ingin kamu kelola.')
                        .setRequired(true)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('check_status')
                .setDescription('Melihat daftar user yang sedang di-timeout.')
        ),

    async execute(interaction) {
        if (!hasModPermission(interaction.member)) {
            return await interaction.reply({ content: 'Kamu tidak punya izin (role) untuk perintah ini.', flags: [MessageFlags.Ephemeral] });
        }

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'check_status') {
            let description = 'Tidak ada user yang di-timeout saat ini.';
            if (timedOutUsersMap.size > 0) {
                const lines = [];
                for (const [userId, expiry] of timedOutUsersMap.entries()) {
                    const { currentStatusString } = getTimeoutStatus(userId);
                    lines.push(`<@${userId}>: ${currentStatusString}`);
                }
                description = lines.join('\n');
            }
            const embed = new EmbedBuilder().setTitle('Daftar User Timeout').setDescription(description).setColor(0xFFA500);
            await interaction.reply({ embeds: [embed], flags: [MessageFlags.Ephemeral] });
        }
        else if (subcommand === 'manage') {
            const targetUser = interaction.options.getUser('user');
            const { currentStatusString } = getTimeoutStatus(targetUser.id);
            const panelEmbed = new EmbedBuilder().setTitle(`Panel Kontrol: ${targetUser.tag}`).setDescription(`Status Saat Ini: ${currentStatusString}`).setColor(0x0099FF);
            const row1 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`ctrl_timeout_1h_${targetUser.id}`).setLabel('Timeout 1 Jam').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId(`ctrl_timeout_1d_${targetUser.id}`).setLabel('Timeout 1 Hari').setStyle(ButtonStyle.Secondary), new ButtonBuilder().setCustomId(`ctrl_timeout_1w_${targetUser.id}`).setLabel('Timeout 1 Minggu').setStyle(ButtonStyle.Secondary));
            const row2 = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`ctrl_timeout_permanent_${targetUser.id}`).setLabel('Timeout Permanen').setStyle(ButtonStyle.Danger), new ButtonBuilder().setCustomId(`ctrl_remove_${targetUser.id}`).setLabel('Cabut Timeout').setStyle(ButtonStyle.Success).setEmoji('✅'));
            await interaction.reply({ embeds: [panelEmbed], components: [row1, row2], flags: [MessageFlags.Ephemeral] });
        }
    },
};

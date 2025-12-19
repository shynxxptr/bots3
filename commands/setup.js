const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    EmbedBuilder,
    ChannelType,
} = require('discord.js');

const { readConfig, writeConfig } = require('../utils/configStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Atur konfigurasi bot (admin)')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub =>
            sub
                .setName('show')
                .setDescription('Lihat ringkasan konfigurasi yang aktif')
        )
        .addSubcommand(sub =>
            sub
                .setName('suggestion')
                .setDescription('Set channel & role staff untuk Kotak Saran')
                .addChannelOption(opt =>
                    opt
                        .setName('channel')
                        .setDescription('Channel tempat saran diposting')
                        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                        .setRequired(true)
                )
                .addRoleOption(opt =>
                    opt
                        .setName('staff_role')
                        .setDescription('Role staff/mod yang bisa mengubah status saran')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('ticket')
                .setDescription('Set kategori tiket & role staff untuk Ticket Box')
                .addChannelOption(opt =>
                    opt
                        .setName('category')
                        .setDescription('Kategori tempat channel tiket dibuat')
                        .addChannelTypes(ChannelType.GuildCategory)
                        .setRequired(true)
                )
                .addRoleOption(opt =>
                    opt
                        .setName('staff_role')
                        .setDescription('Role staff/mod yang bisa melihat & menangani tiket')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub
                .setName('utilities')
                .setDescription('Set role staff untuk command utility prefix (!) (purge/slowmode/say)')
                .addRoleOption(opt =>
                    opt
                        .setName('staff_role')
                        .setDescription('Role staff yang boleh pakai command utility')
                        .setRequired(true)
                )
        ),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();

        if (sub === 'show') {
            const cfg = readConfig();
            const suggestions = cfg.suggestions || {};
            const ticket = cfg.ticket || {};
            const utilities = cfg.utilities || {};

            const embed = new EmbedBuilder()
                .setTitle('⚙️ Konfigurasi Bot (Ringkas)')
                .setColor(cfg.embedColor || '#00008B')
                .addFields(
                    {
                        name: 'Kotak Saran',
                        value:
                            `Channel: ${suggestions.channelId ? `<#${suggestions.channelId}>` : '`(belum di-set)`'}\n` +
                            `Staff role: ${suggestions.staffRoleId ? `<@&${suggestions.staffRoleId}>` : '`(belum di-set)`'}`,
                        inline: false,
                    },
                    {
                        name: 'Ticket Box',
                        value:
                            `Kategori: ${ticket.categoryId ? `<#${ticket.categoryId}>` : '`(belum di-set)`'}\n` +
                            `Staff role: ${ticket.staffRoleId ? `<@&${ticket.staffRoleId}>` : '`(belum di-set)`'}`,
                        inline: false,
                    },
                    {
                        name: 'Utilities Staff (!purge/!slowmode/!say)',
                        value: `Staff role: ${utilities.staffRoleId ? `<@&${utilities.staffRoleId}>` : '`(fallback ke staff role Ticket Box)`'}`,
                        inline: false,
                    }
                )
                .setFooter({ text: 'Gunakan /setup suggestion, /setup ticket, atau /setup utilities untuk mengatur.' });

            return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (sub === 'suggestion') {
            const channel = interaction.options.getChannel('channel', true);
            const staffRole = interaction.options.getRole('staff_role', true);

            writeConfig({
                suggestions: {
                    channelId: channel.id,
                    staffRoleId: staffRole.id,
                },
            });

            return interaction.reply({
                content: `✅ Kotak Saran diset.\n- Channel: <#${channel.id}>\n- Staff role: <@&${staffRole.id}>`,
                ephemeral: true,
            });
        }

        if (sub === 'ticket') {
            const category = interaction.options.getChannel('category', true);
            const staffRole = interaction.options.getRole('staff_role', true);

            writeConfig({
                ticket: {
                    categoryId: category.id,
                    staffRoleId: staffRole.id,
                },
            });

            return interaction.reply({
                content: `✅ Ticket Box diset.\n- Kategori: <#${category.id}>\n- Staff role: <@&${staffRole.id}>`,
                ephemeral: true,
            });
        }

        if (sub === 'utilities') {
            const staffRole = interaction.options.getRole('staff_role', true);

            writeConfig({
                utilities: {
                    staffRoleId: staffRole.id,
                },
            });

            return interaction.reply({
                content: `✅ Utilities staff diset.\n- Staff role: <@&${staffRole.id}>`,
                ephemeral: true,
            });
        }
    },
};



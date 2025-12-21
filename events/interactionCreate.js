const { Events, AttachmentBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionsBitField, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, MessageFlags } = require('discord.js');
const { createWelcomeImage } = require('../utils/welcomeImage');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // --- SELF ROLE HANDLERS ---
        if (interaction.isStringSelectMenu() && (interaction.customId === 'self_role_select' || interaction.customId === 'self_game_select')) {
            const selectedRoles = interaction.values;
            const config = require('../config.json');

            const member = interaction.member;
            let message = '';

            if (interaction.customId === 'self_role_select') {
                // Logic for Jurusan (Single Select - Replace)
                const allRoleIds = config.selfRoles.map(r => r.value);
                const toAdd = selectedRoles;
                const toRemove = allRoleIds.filter(id => !selectedRoles.includes(id));

                try {
                    await member.roles.add(toAdd);
                    await member.roles.remove(toRemove);

                    const addedNames = config.selfRoles.filter(r => toAdd.includes(r.value)).map(r => r.label).join(', ');
                    message = `Jurusan berhasil dipilih: **${addedNames}**`;
                } catch (error) {
                    console.error(error);
                    message = 'Gagal memperbarui jurusan. Cek permission bot!';
                }

            } else if (interaction.customId === 'self_game_select') {
                // Logic for Game (Multi Select - Smart Toggle)
                // If user selects roles they DON'T have -> Add them (and ignore the ones they already have)
                // If user selects ONLY roles they ALREADY have -> Remove them

                const selectedRoleIds = interaction.values;
                const userHasRoles = selectedRoleIds.filter(id => member.roles.cache.has(id));
                const userMissingRoles = selectedRoleIds.filter(id => !member.roles.cache.has(id));

                try {
                    if (userMissingRoles.length > 0) {
                        // Priority: ADD missing roles
                        await member.roles.add(userMissingRoles);

                        const addedNames = config.gameRoles.filter(r => userMissingRoles.includes(r.value)).map(r => r.label).join(', ');
                        message = `✅ Role Game ditambahkan: **${addedNames}**`;

                        if (userHasRoles.length > 0) {
                            message += `\n(Role lainnya sudah kamu miliki)`;
                        }
                    } else {
                        // User has ALL selected roles -> REMOVE them
                        await member.roles.remove(userHasRoles);

                        const removedNames = config.gameRoles.filter(r => userHasRoles.includes(r.value)).map(r => r.label).join(', ');
                        message = `❌ Role Game dihapus: **${removedNames}**`;
                    }
                } catch (error) {
                    console.error(error);
                    message = 'Gagal memperbarui role game. Cek permission bot!';
                }
            }

            await interaction.reply({ content: message, ephemeral: true });
            return;
        }

        // --- MENFESS HANDLERS ---
        const menfessFeature = require('../utils/menfessFeature.js');

        if (interaction.isButton()) {
            // ===========================
            // SUGGESTION BOX (CREATE VIA MODAL)
            // ===========================
            if (interaction.customId === 'sug_create') {
                const modal = new ModalBuilder()
                    .setCustomId('sug_modal_create')
                    .setTitle('Kotak Saran BK');

                const titleInput = new TextInputBuilder()
                    .setCustomId('sug_title')
                    .setLabel('Judul saran')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(120);

                const bodyInput = new TextInputBuilder()
                    .setCustomId('sug_body')
                    .setLabel('Isi saran/masukan')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(3500);

                const anonInput = new TextInputBuilder()
                    .setCustomId('sug_anon')
                    .setLabel("Anonim? (Ya/Tidak)")
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setValue('Tidak')
                    .setMaxLength(5);

                modal.addComponents(
                    new ActionRowBuilder().addComponents(titleInput),
                    new ActionRowBuilder().addComponents(bodyInput),
                    new ActionRowBuilder().addComponents(anonInput),
                );

                await interaction.showModal(modal);
                return;
            }

            // ===========================
            // SUGGESTION BOX (VOTES)
            // ===========================
            if (interaction.customId === 'sug_up' || interaction.customId === 'sug_down') {
                await interaction.deferUpdate();

                const cfg = require('../config.json');
                const sugCfg = cfg.suggestions || {};
                const messageId = interaction.message.id;

                const { toggleVote, getSuggestion, upsertSuggestion } = require('../utils/suggestionsStore');
                const direction = interaction.customId === 'sug_up' ? 'up' : 'down';
                const updated = toggleVote(messageId, interaction.user.id, direction);

                // Ensure status exists
                const current = getSuggestion(messageId) || updated;
                const status = current.status || 'considering';
                if (!current.status) upsertSuggestion(messageId, { status });

                const upCount = (updated.upvotes || []).length;
                const downCount = (updated.downvotes || []).length;

                const statusText =
                    status === 'accepted' ? '🟢 Diterima' :
                        status === 'rejected' ? '🔴 Ditolak' :
                            '🟡 Dipertimbangkan';

                const base = interaction.message.embeds?.[0];
                const newEmbed = base
                    ? EmbedBuilder.from(base)
                    : new EmbedBuilder().setTitle('💡 Saran');

                // Replace/ensure fields
                const fields = (newEmbed.data.fields || []).filter(f => !['Status', 'Vote'].includes(f.name));
                newEmbed.setFields(
                    ...fields,
                    { name: 'Status', value: statusText, inline: true },
                    { name: 'Vote', value: `👍 ${upCount} | 👎 ${downCount}`, inline: true },
                );

                await interaction.message.edit({ embeds: [newEmbed] });
                return;
            }

            // ===========================
            // TICKET SYSTEM (OPEN/CLOSE)
            // ===========================
            if (interaction.customId.startsWith('ticket_open_')) {
                await interaction.deferReply({ ephemeral: true });

                if (!interaction.inGuild()) {
                    return interaction.editReply('Ticket hanya bisa dibuat di server.');
                }

                const cfg = require('../config.json');
                const ticketCfg = cfg.ticket || {};
                if (!ticketCfg.categoryId || !ticketCfg.staffRoleId) {
                    return interaction.editReply('⚠️ Ticket belum di-setup. Admin: jalankan `/setup ticket`.');
                }

                const { getOpenTicketChannelIdForUser, createTicketWithGuild } = require('../utils/ticketStore');
                const existing = getOpenTicketChannelIdForUser(interaction.user.id);
                if (existing) {
                    return interaction.editReply(`Kamu masih punya ticket yang aktif: <#${existing}>`);
                }

                const type = interaction.customId.replace('ticket_open_', '');
                const category = interaction.guild.channels.cache.get(ticketCfg.categoryId);
                if (!category || category.type !== ChannelType.GuildCategory) {
                    return interaction.editReply('⚠️ Kategori ticket tidak ditemukan. Admin: cek `/setup show`.');
                }

                const staffRoleId = ticketCfg.staffRoleId;
                const userId = interaction.user.id;

                const safeUser = interaction.user.username
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, '-')
                    .replace(/-+/g, '-')
                    .slice(0, 20);

                const channelName = `ticket-${safeUser}-${userId.slice(-4)}`;

                const channel = await interaction.guild.channels.create({
                    name: channelName,
                    type: ChannelType.GuildText,
                    parent: category.id,
                    topic: `TicketOwner:${userId} Type:${type}`,
                    permissionOverwrites: [
                        { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
                        { id: userId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        { id: staffRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
                        { id: interaction.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.ManageChannels] },
                    ],
                });

                createTicketWithGuild(channel.id, interaction.guild.id, userId, type);

                const typeLabel =
                    type === 'bk' ? '🧑‍🏫 BK' :
                        type === 'tu' ? '🧾 TU' :
                            type === 'partnership' ? '🤝 Partnership' :
                                type === 'appeal' ? '🧑‍⚖️ Banding' :
                                    type === 'verify_female' ? '🎀 Verifikasi Cewek' :
                                        '🚨 Lapor';

                const embed = new EmbedBuilder()
                    .setColor(cfg.embedColor || '#00008B')
                    .setTitle(`🎫 Ticket Dibuka — ${typeLabel}`)
                    .setDescription(
                        `Halo <@${userId}>! Jelaskan kebutuhan kamu di sini ya.\n\n` +
                        `Staff akan membantu secepatnya. Untuk menutup ticket, klik tombol **Close Ticket** di bawah.`
                    )
                    .addFields({ name: 'Owner', value: `<@${userId}>`, inline: true })
                    .setTimestamp();

                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('ticket_close').setLabel('Close Ticket').setStyle(ButtonStyle.Danger).setEmoji('🔒')
                );

                await channel.send({ content: `<@&${staffRoleId}>`, embeds: [embed], components: [row] });
                await interaction.editReply(`✅ Ticket kamu dibuat: <#${channel.id}>`);
                return;
            }

            if (interaction.customId === 'ticket_close') {
                await interaction.deferReply({ ephemeral: true });

                if (!interaction.inGuild()) return interaction.editReply('Ticket hanya bisa ditutup di server.');
                if (!interaction.channelId) return interaction.editReply('Channel tidak valid.');

                const cfg = require('../config.json');
                const ticketCfg = cfg.ticket || {};
                const staffRoleId = ticketCfg.staffRoleId;

                const { isTicketOwnerOrStaff, closeTicketChannel } = require('../utils/ticketActions');
                const check = await isTicketOwnerOrStaff(interaction, staffRoleId);
                if (!check.ok) {
                    return interaction.editReply('Hanya owner ticket atau staff yang bisa menutup ticket.');
                }

                await closeTicketChannel(interaction.channel, 'manual');
                return interaction.editReply('✅ Ticket sudah ditutup.');
            }

            if (interaction.customId.startsWith('leaderboard_')) {
                await interaction.deferUpdate();

                const [action, direction, pageStr] = interaction.customId.split('_');
                const targetPage = parseInt(pageStr);

                const { getLeaderboard } = require('../utils/leveling');
                const { generateLeaderboardImage } = require('../utils/leaderboardRenderer');
                const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

                const fullLeaderboard = getLeaderboard(interaction.guild.id, 100);
                const itemsPerPage = 10;
                const totalPages = Math.ceil(fullLeaderboard.length / itemsPerPage);

                // Validate page
                let page = targetPage;
                if (page < 1) page = 1;
                if (page > totalPages) page = totalPages;

                // Slice data
                const start = (page - 1) * itemsPerPage;
                const end = start + itemsPerPage;
                const pageData = fullLeaderboard.slice(start, end);

                // Generate Image
                const attachment = await generateLeaderboardImage(interaction.guild, pageData, page, totalPages);

                // Buttons
                const row = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId(`leaderboard_prev_${page - 1}`)
                            .setLabel('Previous')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page <= 1),
                        new ButtonBuilder()
                            .setCustomId(`leaderboard_next_${page + 1}`)
                            .setLabel('Next')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(page >= totalPages)
                    );

                await interaction.editReply({ files: [attachment], components: [row] });
                return;
            }

            if (interaction.customId === 'btn_buat_kartu') {
                const config = require('../config.json');

                // 1. Check if user has "Siswa" OR "Siswi" role
                const studentRoleId = config.class.studentRoleId; // Male
                const studentFemaleRoleId = config.class.studentFemaleRoleId; // Female

                const hasMaleRole = studentRoleId && interaction.member.roles.cache.has(studentRoleId);
                const hasFemaleRole = studentFemaleRoleId && interaction.member.roles.cache.has(studentFemaleRoleId);

                if (!hasMaleRole && !hasFemaleRole) {
                    return await interaction.reply({
                        content: 'Fitur ini khusus untuk **Siswa/Siswi**. Silakan verifikasi diri terlebih dahulu.',
                        ephemeral: true
                    });
                }

                // 2. Check if user has a "Jurusan" role
                if (config.selfRoles) {
                    const jurusanRoleIds = config.selfRoles.map(r => r.value);
                    const hasJurusanRole = interaction.member.roles.cache.some(role => jurusanRoleIds.includes(role.id));

                    if (!hasJurusanRole) {
                        return await interaction.reply({
                            content: '⚠️ Kamu belum memilih **Jurusan**! Silakan ambil role jurusan dulu di <#1444683281311334623> sebelum membuat Kartu Pelajar.',
                            ephemeral: true
                        });
                    }
                }

                // 3. Check if user already has a class role
                if (config.class && config.class.options) {
                    const classRoles = Object.values(config.class.options).map(opt => opt.roleId).filter(id => id);
                    const hasClassRole = interaction.member.roles.cache.some(role => classRoles.includes(role.id));

                    if (hasClassRole) {
                        return await interaction.reply({
                            content: 'Kamu sudah memiliki kartu pelajar. Jika ingin buat lagi silahkan hubungi tata usaha untuk mengubahnya.',
                            ephemeral: true
                        });
                    }
                }

                const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

                const modal = new ModalBuilder()
                    .setCustomId('inputDataModal')
                    .setTitle('Input Data Siswa');

                const nameInput = new TextInputBuilder()
                    .setCustomId('nameInput')
                    .setLabel("Nama Siswa")
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
                return;
            }

            try {
                await menfessFeature.handleButton(interaction, interaction.client);
            } catch (error) {
                console.error("Error di button handler:", error);
            }
            return;
        }

        // --- PROFILE CUSTOMIZATION SELECT MENUS (CHECK FIRST) ---
        if (interaction.isStringSelectMenu() && (
            interaction.customId === 'profile_customize_template' ||
            interaction.customId === 'profile_customize_frame' ||
            interaction.customId === 'profile_customize_badges'
        )) {
            const { getCustomization, saveCustomization, getUserRole } = require('../utils/profileCustomization');
            
            if (interaction.customId === 'profile_customize_template') {
                try {
                    if (!interaction.values || interaction.values.length === 0) {
                        if (interaction.deferred || interaction.replied) {
                            return interaction.followUp({
                                content: '❌ Template tidak valid!',
                                flags: MessageFlags.Ephemeral
                            }).catch(() => {});
                        }
                        return interaction.reply({
                            content: '❌ Template tidak valid!',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                    
                    await interaction.deferUpdate();
                    
                    const selectedTemplate = interaction.values[0];
                    if (!selectedTemplate) {
                        return interaction.followUp({
                            content: '❌ Template tidak valid!',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                    
                    const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                    const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
                    
                    if (!customization) {
                        return interaction.followUp({
                            content: '❌ Gagal memuat customization. Coba lagi nanti.',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                    
                    customization.template = selectedTemplate;
                    
                    // Also update background to match template
                    if (!customization.background) {
                        customization.background = { type: 'template', value: selectedTemplate };
                    } else {
                        customization.background.type = 'template';
                        customization.background.value = selectedTemplate;
                    }
                    
                    const saveResult = saveCustomization(interaction.guild.id, interaction.user.id, customization);
                    
                    if (!saveResult || !saveResult.success) {
                        return interaction.followUp({
                            content: '❌ Gagal menyimpan customization. Coba lagi nanti.',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                    
                    await interaction.followUp({
                        content: `✅ Template berhasil diubah ke **${selectedTemplate}**!`,
                        flags: MessageFlags.Ephemeral
                    }).catch(() => {});
                } catch (error) {
                    console.error('Error in profile_customize_template:', error);
                    console.error('Stack:', error.stack);
                    try {
                        if (!interaction.replied && !interaction.deferred) {
                            await interaction.reply({
                                content: `❌ Terjadi error: ${error.message}`,
                                flags: MessageFlags.Ephemeral
                            }).catch(() => {});
                        } else {
                            await interaction.followUp({
                                content: `❌ Terjadi error: ${error.message}`,
                                flags: MessageFlags.Ephemeral
                            }).catch(() => {});
                        }
                    } catch (e) {
                        console.error('Failed to send error message:', e);
                    }
                }
                return;
            }
            
            if (interaction.customId === 'profile_customize_frame') {
                try {
                    await interaction.deferUpdate();
                    
                    if (!interaction.values || interaction.values.length === 0) {
                        return interaction.followUp({
                            content: '❌ Frame tidak valid!',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                    
                    const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                    const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
                    
                    if (!customization.frame) {
                        customization.frame = { type: 'preset', value: '' };
                    }
                    customization.frame.value = interaction.values[0];
                    saveCustomization(interaction.guild.id, interaction.user.id, customization);
                    
                    await interaction.followUp({
                        content: `✅ Frame berhasil diubah ke **${interaction.values[0]}**!`,
                        flags: MessageFlags.Ephemeral
                    }).catch(() => {});
                } catch (error) {
                    console.error('Error in profile_customize_frame:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Terjadi error saat mengubah frame. Coba lagi nanti.',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    } else {
                        await interaction.followUp({
                            content: '❌ Terjadi error saat mengubah frame. Coba lagi nanti.',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                }
                return;
            }
            
            if (interaction.customId === 'profile_customize_badges') {
                try {
                    await interaction.deferUpdate();
                    
                    const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                    const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
                    
                    // Filter out invalid values (like 'no_achievements')
                    const validValues = (interaction.values || []).filter(v => v && v !== 'no_achievements');
                    
                    if (!customization.badges) {
                        customization.badges = { enabled: [], maxDisplay: 5 };
                    }
                    
                    if (validValues.length > (customization.badges.maxDisplay || 5)) {
                        return interaction.followUp({
                            content: `❌ Kamu hanya bisa memilih maksimal ${customization.badges.maxDisplay || 5} badges!`,
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                    
                    customization.badges.enabled = validValues;
                    saveCustomization(interaction.guild.id, interaction.user.id, customization);
                    
                    await interaction.followUp({
                        content: `✅ Badges berhasil diubah! (${validValues.length}/${customization.badges.maxDisplay || 5})`,
                        flags: MessageFlags.Ephemeral
                    }).catch(() => {});
                } catch (error) {
                    console.error('Error in profile_customize_badges:', error);
                    if (!interaction.replied && !interaction.deferred) {
                        await interaction.reply({
                            content: '❌ Terjadi error saat mengubah badges. Coba lagi nanti.',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    } else {
                        await interaction.followUp({
                            content: '❌ Terjadi error saat mengubah badges. Coba lagi nanti.',
                            flags: MessageFlags.Ephemeral
                        }).catch(() => {});
                    }
                }
                return;
            }
        }
        
        if (interaction.isStringSelectMenu()) {
            // ===========================
            // SUGGESTION BOX (STATUS)
            // ===========================
            if (interaction.customId === 'sug_status') {
                await interaction.deferReply({ ephemeral: true });

                const cfg = require('../config.json');
                const sugCfg = cfg.suggestions || {};
                const staffRoleId = sugCfg.staffRoleId;

                const isStaff = staffRoleId && interaction.member && interaction.member.roles.cache.has(staffRoleId);
                const isAdmin = interaction.member && interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);
                if (!isStaff && !isAdmin) {
                    return interaction.editReply('Hanya staff yang bisa mengubah status saran.');
                }

                const status = interaction.values[0];
                const messageId = interaction.message.id;
                const { getSuggestion, upsertSuggestion } = require('../utils/suggestionsStore');
                const entry = getSuggestion(messageId) || {};

                upsertSuggestion(messageId, { ...entry, status });

                const upCount = (entry.upvotes || []).length;
                const downCount = (entry.downvotes || []).length;

                const statusText =
                    status === 'accepted' ? '🟢 Diterima' :
                        status === 'rejected' ? '🔴 Ditolak' :
                            '🟡 Dipertimbangkan';

                const base = interaction.message.embeds?.[0];
                const newEmbed = base ? EmbedBuilder.from(base) : new EmbedBuilder().setTitle('💡 Saran');
                const fields = (newEmbed.data.fields || []).filter(f => !['Status', 'Vote'].includes(f.name));
                newEmbed.setFields(
                    ...fields,
                    { name: 'Status', value: statusText, inline: true },
                    { name: 'Vote', value: `👍 ${upCount} | 👎 ${downCount}`, inline: true },
                );
                if (status === 'accepted') newEmbed.setColor('#2ecc71');
                else if (status === 'rejected') newEmbed.setColor('#e74c3c');
                else newEmbed.setColor('#f1c40f');

                await interaction.message.edit({ embeds: [newEmbed] });
                return interaction.editReply(`✅ Status diubah menjadi: ${statusText}`);
            }

            try {
                await menfessFeature.handleSelectMenu(interaction, interaction.client);
            } catch (error) {
                console.error("Error di select menu handler:", error);
            }
            return;
        }

        if (interaction.isModalSubmit()) {
            if (interaction.customId === 'inputDataModal') {
                await interaction.deferReply();
                try {
                    const name = interaction.fields.getTextInputValue('nameInput');
                    let kelas = interaction.fields.getTextInputValue('kelasInput').toUpperCase();

                    // Normalize class input
                    if (kelas === '10') kelas = 'X';
                    if (kelas === '11') kelas = 'XI';
                    if (kelas === '12') kelas = 'XII';

                    const data = {
                        namaSiswa: name,
                        class: kelas
                    };

                    // Auto-assign Class Role
                    const config = require('../config.json');
                    if (config.class && config.class.options && config.class.options[kelas]) {
                        const roleId = config.class.options[kelas].roleId;
                        if (roleId) {
                            try {
                                await interaction.member.roles.add(roleId);
                            } catch (roleError) {
                                console.error(`Failed to assign role ${roleId} for class ${kelas}:`, roleError);
                            }
                        }
                    }

                    const buffer = await createWelcomeImage(interaction.member, data);
                    const attachment = new AttachmentBuilder(buffer, { name: 'kartu_pelajar.png' });

                    const button = new ButtonBuilder()
                        .setCustomId('btn_buat_kartu')
                        .setLabel('Buat Kartu Pelajar')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('🆔');

                    const row = new ActionRowBuilder().addComponents(button);

                    await interaction.editReply({ files: [attachment], components: [row] });
                } catch (error) {
                    console.error('Error generating kartu pelajar:', error);
                    await interaction.editReply('Gagal membuat kartu pelajar.');
                }
                return;
            }

            // ===========================
            // SUGGESTION BOX (MODAL SUBMIT)
            // ===========================
            if (interaction.customId === 'sug_modal_create') {
                await interaction.deferReply({ ephemeral: true });

                if (!interaction.inGuild()) return interaction.editReply('Saran hanya bisa dikirim di server.');

                const cfg = require('../config.json');
                const sugCfg = cfg.suggestions || {};
                if (!sugCfg.channelId) {
                    return interaction.editReply('⚠️ Kotak saran belum di-setup. Admin: jalankan `/setup suggestion`.');
                }

                const title = interaction.fields.getTextInputValue('sug_title')?.trim().slice(0, 120);
                const body = interaction.fields.getTextInputValue('sug_body')?.trim().slice(0, 3500);
                const anonRaw = interaction.fields.getTextInputValue('sug_anon')?.trim().toLowerCase();
                const isAnon = anonRaw === 'ya' || anonRaw === 'y';

                const targetChannel = interaction.guild.channels.cache.get(sugCfg.channelId);
                if (!targetChannel || !targetChannel.isTextBased()) {
                    return interaction.editReply('⚠️ Channel kotak saran tidak ditemukan. Admin: cek `/setup show`.');
                }

                const displayName = isAnon ? 'Seseorang' : interaction.user.username;
                const avatar = isAnon ? 'https://i.imgur.com/pBxtF1p.png' : interaction.user.displayAvatarURL();

                const embed = new EmbedBuilder()
                    .setColor('#f1c40f')
                    .setAuthor({ name: `Saran dari: ${displayName}`, iconURL: avatar })
                    .setTitle(`💡 ${title || 'Saran'}`)
                    .setDescription(body || '-')
                    .addFields(
                        { name: 'Status', value: '🟡 Dipertimbangkan', inline: true },
                        { name: 'Vote', value: '👍 0 | 👎 0', inline: true },
                    )
                    .setTimestamp();

                const voteRow = new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('sug_up').setLabel('Upvote').setStyle(ButtonStyle.Success).setEmoji('👍'),
                    new ButtonBuilder().setCustomId('sug_down').setLabel('Downvote').setStyle(ButtonStyle.Danger).setEmoji('👎'),
                );

                const { StringSelectMenuBuilder } = require('discord.js');
                const statusRow = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('sug_status')
                        .setPlaceholder('Staff: ubah status saran...')
                        .addOptions(
                            { label: 'Dipertimbangkan', value: 'considering', description: 'Masih dipertimbangkan', emoji: '🟡' },
                            { label: 'Diterima', value: 'accepted', description: 'Saran diterima', emoji: '🟢' },
                            { label: 'Ditolak', value: 'rejected', description: 'Saran ditolak', emoji: '🔴' },
                        )
                );

                const sent = await targetChannel.send({ embeds: [embed], components: [voteRow, statusRow] });

                const { upsertSuggestion } = require('../utils/suggestionsStore');
                upsertSuggestion(sent.id, {
                    messageId: sent.id,
                    channelId: sent.channel.id,
                    authorId: interaction.user.id,
                    anonymous: isAnon,
                    title,
                    body,
                    status: 'considering',
                    upvotes: [],
                    downvotes: [],
                    createdAt: Date.now(),
                });

                return interaction.editReply(`✅ Saran kamu sudah masuk ke <#${sent.channel.id}>.`);
            }

            // ===========================
            // PROFILE CUSTOMIZATION HANDLERS
            // ===========================
            if (interaction.customId === 'profile_customize_bio') {
                const modal = new ModalBuilder()
                    .setCustomId('profile_customize_bio_modal')
                    .setTitle('Set Bio');
                
                const bioInput = new TextInputBuilder()
                    .setCustomId('bio_text')
                    .setLabel('Bio (Max 200 karakter)')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(true)
                    .setMaxLength(200)
                    .setPlaceholder('Masukkan bio kamu...');
                
                modal.addComponents(new ActionRowBuilder().addComponents(bioInput));
                await interaction.showModal(modal);
                return;
            }
            
            if (interaction.customId === 'profile_customize_preview') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                
                const { getCustomization, getUserRole } = require('../utils/profileCustomization');
                const { getUserRank } = require('../utils/leveling');
                const { getUserAchievements, getAllAchievements } = require('../utils/achievements');
                const { getVoiceTime } = require('../utils/voiceTime');
                const { getReputation } = require('../utils/reputation');
                const { getMessageCount } = require('../utils/messageCount');
                const { getStreak } = require('../utils/leveling');
                const { getTopPairsForUser } = require('../utils/voicePairStreak');
                const { getQuotesByAuthor } = require('../utils/quote');
                const { generateProfileCard } = require('../utils/profileCardRenderer');
                
                const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
                
                // Ensure template and background are synced
                if (customization.template && (!customization.background || customization.background.type !== 'upload')) {
                    if (!customization.background) {
                        customization.background = { type: 'template', value: customization.template };
                    } else if (customization.background.value !== customization.template) {
                        customization.background.type = 'template';
                        customization.background.value = customization.template;
                    }
                }
                
                const rankData = getUserRank(interaction.user.id, interaction.guild.id);
                
                if (!rankData) {
                    return interaction.editReply('Kamu belum memiliki XP.');
                }
                
                const achievementsData = getUserAchievements(interaction.user.id, interaction.guild.id);
                const allAchievements = getAllAchievements();
                const enabledAchievements = achievementsData.unlocked
                    .filter(a => a && a.id && customization.badges.enabled.includes(a.id))
                    .map(a => allAchievements[a.id])
                    .filter(Boolean);
                
                const voiceTime = getVoiceTime(interaction.guild.id, interaction.user.id);
                const rep = getReputation(interaction.guild.id, interaction.user.id);
                const msgCount = getMessageCount(interaction.guild.id, interaction.user.id);
                const streak = getStreak(interaction.user.id, interaction.guild.id);
                const topPairs = getTopPairsForUser(interaction.guild.id, interaction.user.id, 1);
                const quotes = getQuotesByAuthor(interaction.guild.id, interaction.user.id, 1000);
                
                const stats = {
                    voice_time: voiceTime ? voiceTime.totalSeconds : 0,
                    messages: msgCount ? msgCount.messageCount : 0,
                    prestasi: rep ? rep.totalRep : 0,
                    quotes: quotes ? quotes.length : 0,
                    streak: streak ? streak.streak : 0,
                    voice_streak: topPairs.length > 0 ? (topPairs[0].streak || 0) : 0
                };
                
                try {
                    const cardBuffer = await generateProfileCard(interaction.user, member, customization, rankData, enabledAchievements, stats);
                    const attachment = new AttachmentBuilder(cardBuffer, { name: 'profile-card.png' });
                    await interaction.editReply({ content: '✅ Preview profile card kamu:', files: [attachment] });
                } catch (error) {
                    console.error('Error generating preview:', error);
                    await interaction.editReply('❌ Terjadi error saat generate preview. Coba lagi nanti.');
                }
                return;
            }
            
            if (interaction.customId === 'profile_customize_reset') {
                await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                
                const { resetCustomization, getUserRole } = require('../utils/profileCustomization');
                const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
                const result = resetCustomization(interaction.guild.id, interaction.user.id, member);
                
                if (result.success) {
                    await interaction.editReply('✅ Customization berhasil di-reset ke default!');
                } else {
                    await interaction.editReply('❌ Gagal reset customization.');
                }
                return;
            }
            
            try {
                await menfessFeature.handleModalSubmit(interaction, interaction.client);
            } catch (error) {
                console.error("Error di modal submit handler:", error);
            }
            return;
        }
        
        
        // --- PROFILE CUSTOMIZATION MODAL SUBMIT ---
        if (interaction.isModalSubmit() && interaction.customId === 'profile_customize_bio_modal') {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            
            const bioText = interaction.fields.getTextInputValue('bio_text');
            
            if (bioText.length > 200) {
                return interaction.editReply('❌ Bio terlalu panjang! Maksimal 200 karakter.');
            }
            
            const { getCustomization, saveCustomization, getUserRole } = require('../utils/profileCustomization');
            const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
            const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
            
            customization.bio = bioText.trim();
            saveCustomization(interaction.guild.id, interaction.user.id, customization);
            
            await interaction.editReply(`✅ Bio berhasil di-set!\n"${bioText.trim()}"`);
            return;
        }

        // --- SLASH COMMAND HANDLER ---
        if (!interaction.isChatInputCommand()) return;

        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
            console.error(`No command matching ${interaction.commandName} was found.`);
            return;
        }

        try {
            await command.execute(interaction);
        } catch (error) {
            console.error(error);
            if (interaction.replied || interaction.deferred) {
                await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => { });
            } else {
                // Check if interaction is still valid before replying
                try {
                    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
                } catch (e) {
                    console.error("Failed to send error message:", e);
                }
            }
        }
    },
};

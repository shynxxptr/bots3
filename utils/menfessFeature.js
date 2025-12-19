// File: utils/menfessFeature.js
// Ini adalah "otak" dari semua fitur menfess kamu.

const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
    StringSelectMenuBuilder,
    MessageFlags,
    PermissionsBitField,
} = require('discord.js');
const {
    menfessChannelId, menfessLogChannelId, replyLogChannelId, modLogChannelId,
    modRoleIds, paths // Ambil path dari config
} = require('../config.json');
const fs = require('node:fs');
const path = require('node:path');

// Definisikan path dari config
const MENFESS_CHANNEL_ID = menfessChannelId;
const MENFESS_LOG_ID = menfessLogChannelId;
const REPLY_LOG_ID = replyLogChannelId;
const MOD_LOG_ID = modLogChannelId;
const MOD_ROLE_IDS = modRoleIds || [];

const counterFilePath = path.resolve(__dirname, '..', paths.counter);
const timeoutFilePath = path.resolve(__dirname, '..', paths.timeout);
const menfessDBPath = path.resolve(__dirname, '..', paths.menfessDB);

// --- Variabel Internal ---
let menfessCount = 0;
let timedOutUsersMap = new Map();
let menfessDB = { messages: {} };

// --- LOGIKA COUNTER MENFESS ---
function readCount() { try { if (fs.existsSync(counterFilePath)) { const data = fs.readFileSync(counterFilePath, 'utf8'); const json = JSON.parse(data); menfessCount = json.count || 0; return menfessCount; } else { fs.writeFileSync(counterFilePath, JSON.stringify({ count: 0 }), 'utf8'); return 0; } } catch (error) { console.error('Gagal membaca/membuat counter.json:', error); return 0; } }
function saveCount(count) { try { const data = JSON.stringify({ count: count }); fs.writeFileSync(counterFilePath, data, 'utf8'); } catch (error) { console.error('Gagal menyimpan counter.json:', error); } }

// --- LOGIKA TIMEOUT USER ---
function loadTimeouts() { try { if (fs.existsSync(timeoutFilePath)) { const data = fs.readFileSync(timeoutFilePath, 'utf8'); const json = JSON.parse(data); timedOutUsersMap = new Map(Object.entries(json.timedOutUsers || {})); console.log(`Berhasil memuat ${timedOutUsersMap.size} user yang di-timeout.`); } else { fs.writeFileSync(timeoutFilePath, JSON.stringify({ timedOutUsers: {} }), 'utf8'); timedOutUsersMap = new Map(); } } catch (error) { console.error('Gagal memuat timeout.json:', error); timedOutUsersMap = new Map(); } }
function saveTimeouts() { try { const data = JSON.stringify({ timedOutUsers: Object.fromEntries(timedOutUsersMap) }); fs.writeFileSync(timeoutFilePath, data, 'utf8'); } catch (error) { console.error('Gagal menyimpan timeout.json:', error); } }
function parseDurationToExpiry(durationString) { if (durationString === 'permanent') return 'permanent'; const match = durationString.match(/^(\d+)([hdw])$/); if (!match) return Date.now() + 3600000; const value = parseInt(match[1]); const unit = match[2]; let ms = 0; if (unit === 'h') ms = value * 3600000; if (unit === 'd') ms = value * 86400000; if (unit === 'w') ms = value * 604800000; return Date.now() + ms; }
function getTimeoutStatus(userId) { const expiry = timedOutUsersMap.get(userId); if (!expiry) { return { active: false, currentStatusString: "🟢 Tidak Aktif" }; } if (expiry === 'permanent') { return { active: true, currentStatusString: "🚫 Permanen" }; } if (expiry <= Date.now()) { removeTimeout(userId); return { active: false, currentStatusString: "🟢 Tidak Aktif (Baru saja kadaluarsa)" }; } return { active: true, currentStatusString: `🚫 Aktif sampai <t:${Math.floor(expiry / 1000)}:R>` }; }
function isUserTimedOut(userId) { return getTimeoutStatus(userId).active; }
function addTimeout(userId, durationString) { const expiryTimestamp = parseDurationToExpiry(durationString); timedOutUsersMap.set(userId, expiryTimestamp); saveTimeouts(); if (expiryTimestamp === 'permanent') { return `di-timeout **permanen**.`; } else { return `di-timeout sampai <t:${Math.floor(expiryTimestamp / 1000)}:R>.`; } }
function removeTimeout(userId) { if (!timedOutUsersMap.has(userId)) return false; timedOutUsersMap.delete(userId); saveTimeouts(); return true; }

// --- LOGIKA DATABASE MENFESS ---
function loadMenfessDB() {
    try {
        let db = { messages: {} };
        if (fs.existsSync(menfessDBPath)) {
            const data = fs.readFileSync(menfessDBPath, 'utf8');
            db = JSON.parse(data);
        }
        const migratedMessages = {};
        for (const [msgId, value] of Object.entries(db.messages || {})) {
            if (typeof value === 'string') {
                migratedMessages[msgId] = { sender: value, subscribers: [] };
            } else if (typeof value === 'object' && value.sender) {
                migratedMessages[msgId] = value;
            }
        }
        menfessDB.messages = migratedMessages;
        console.log(`Berhasil memuat ${Object.keys(menfessDB.messages).length} data menfess.`);
        saveMenfessDB();
    } catch (error) { console.error('Gagal memuat/migrasi menfess_db.json:', error); menfessDB = { messages: {} }; }
}
function saveMenfessDB() { try { const data = JSON.stringify(menfessDB, null, 2); fs.writeFileSync(menfessDBPath, data, 'utf8'); } catch (error) { console.error('Gagal menyimpan menfess_db.json:', error); } }
function isSubscribed(messageId, userId) { const entry = menfessDB.messages[messageId]; if (!entry || !entry.subscribers) return false; return entry.subscribers.includes(userId); }
function addSubscriber(messageId, userId) { const entry = menfessDB.messages[messageId]; if (!entry) return false; if (entry.subscribers.includes(userId)) return false; entry.subscribers.push(userId); saveMenfessDB(); return true; }
function removeSubscriber(messageId, userId) { const entry = menfessDB.messages[messageId]; if (!entry || !entry.subscribers) return false; const index = entry.subscribers.indexOf(userId); if (index > -1) { entry.subscribers.splice(index, 1); saveMenfessDB(); return true; } return false; }

// --- FUNGSI CEK PERMISSION ---
function hasModPermission(member) { if (!member) return false; if (member.permissions.has(PermissionsBitField.Flags.Administrator)) return true; if (MOD_ROLE_IDS.length > 0) { return member.roles.cache.some(role => MOD_ROLE_IDS.includes(role.id)); } return false; }

// --- FUNGSI HELPER PARSE FOOTER ---
function getSenderIdFromFooter(embed) { if (!embed || !embed.footer || !embed.footer.text) return null; const match = embed.footer.text.match(/SenderID: (\d+)/); return match ? match[1] : null; }
function parseFooterForDelete(embed) { if (!embed || !embed.footer || !embed.footer.text) return null; const senderIdMatch = embed.footer.text.match(/SenderID: (\d+)/); const publicMsgMatch = embed.footer.text.match(/PublicMsg: (\d+\/\d+)/); if (!senderIdMatch || !publicMsgMatch) return null; const publicMsgParts = publicMsgMatch[1].split('/'); return { senderId: senderIdMatch[1], publicChannelId: publicMsgParts[0], publicMessageId: publicMsgParts[1] }; }
function parseFooterForReplyDelete(embed) { if (!embed || !embed.footer || !embed.footer.text) return null; const replyMsgMatch = embed.footer.text.match(/ReplyMsg: (\d+\/\d+)/); if (!replyMsgMatch) return null; const parts = replyMsgMatch[1].split('/'); return { threadId: parts[0], replyMessageId: parts[1] }; }

// --- FUNGSI LOGGING ---
async function sendModerationActionLog(adminInteraction, action, targetUser, reason) { if (!MOD_LOG_ID) return; try { const modLogChannel = await adminInteraction.client.channels.fetch(MOD_LOG_ID); if (!modLogChannel) return; const adminUser = adminInteraction.user; const embed = new EmbedBuilder().setColor(0xFF0000).setTitle(`Aksi Moderasi: ${action}`).setAuthor({ name: `Admin: ${adminUser.tag}`, iconURL: adminUser.displayAvatarURL() }).addFields({ name: 'Target User', value: `${targetUser} (\`${targetUser.id}\`)` }, { name: 'Detail Aksi', value: reason }).setTimestamp(); await modLogChannel.send({ embeds: [embed] }); } catch (error) { console.error('GAGAL MENGIRIM LOG MODERASI:', error); } }
async function sendReplyToLogChannel(client, interaction, replyText, menfessTitle, anonReplyMessage) { if (!REPLY_LOG_ID) return; try { const logChannel = await client.channels.fetch(REPLY_LOG_ID); if (!logChannel) { return; } const cuplikan = replyText.length > 500 ? replyText.substring(0, 500) + '...' : replyText; const logEmbed = new EmbedBuilder().setColor(0x7289DA).setTitle('Log Balasan Anonim').setAuthor({ name: `Pengirim Balasan: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }).addFields({ name: 'ID Pengirim', value: `\`${interaction.user.id}\``, inline: true }, { name: 'Membalas Menfess', value: menfessTitle, inline: true }, { name: 'Isi Balasan', value: "```" + cuplikan + "```" }).setFooter({ text: `SenderID: ${interaction.user.id} | ReplyMsg: ${anonReplyMessage.channelId}/${anonReplyMessage.id}` }).setTimestamp(); const modButtonRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('log_delete_reply').setLabel('Hapus Balasan').setStyle(ButtonStyle.Danger).setEmoji('🗑️'), new ButtonBuilder().setCustomId('log_dm_sender').setLabel('DM Pengirim').setStyle(ButtonStyle.Secondary).setEmoji('📨')); const modSelectRow = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('log_timeout_menu').setPlaceholder('Pilih durasi timeout...').addOptions({ label: 'Timeout 1 Jam', value: '1h' }, { label: 'Timeout 1 Hari', value: '1d' }, { label: 'Timeout 1 Minggu', value: '1w' }, { label: 'Timeout Permanen', value: 'permanent' }, { label: 'Cabut Timeout', value: 'remove' })); await logChannel.send({ embeds: [logEmbed], components: [modButtonRow, modSelectRow] }); } catch (error) { console.error('GAGAL MENGIRIM LOG BALASAN:', error); } }
async function sendToLogChannel(client, interaction, penerimaTeks, isi, menfessId, imageUrl, publicMessageId) { if (!MENFESS_LOG_ID) return; try { const logChannel = await client.channels.fetch(MENFESS_LOG_ID); if (!logChannel) { return; } const cuplikan = isi.length > 500 ? isi.substring(0, 500) + '...' : isi; const logEmbed = new EmbedBuilder().setColor(0xFFA500).setTitle(`Log Menfess #${menfessId}`).setAuthor({ name: `Pengirim: ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() }).addFields({ name: 'ID Pengirim', value: `\`${interaction.user.id}\``, inline: true }, { name: 'Penerima (Teks)', value: penerimaTeks, inline: true }, { name: 'Cuplikan Pesan', value: "```" + cuplikan + "```" }).setFooter({ text: `SenderID: ${interaction.user.id} | PublicMsg: ${MENFESS_CHANNEL_ID}/${publicMessageId}` }).setTimestamp(); if (imageUrl) { logEmbed.setImage(imageUrl); } const modButtonRow = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('log_delete_menfess').setLabel('Hapus Menfess').setStyle(ButtonStyle.Danger).setEmoji('🗑️'), new ButtonBuilder().setCustomId('log_dm_sender').setLabel('DM Pengirim').setStyle(ButtonStyle.Secondary).setEmoji('📨')); const modSelectRow = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId('log_timeout_menu').setPlaceholder('Pilih durasi timeout...').addOptions({ label: 'Timeout 1 Jam', value: '1h' }, { label: 'Timeout 1 Hari', value: '1d' }, { label: 'Timeout 1 Minggu', value: '1w' }, { label: 'Timeout Permanen', value: 'permanent' }, { label: 'Cabut Timeout', value: 'remove' })); await logChannel.send({ embeds: [logEmbed], components: [modButtonRow, modSelectRow] }); } catch (error) { console.error('GAGAL MENGIRIM LOG:', error); } }

// --- FUNGSI PEMBUAT MODAL ---
function createAnonReplyModal(customId) { const replyInput = new TextInputBuilder().setCustomId('anon_reply_text').setLabel("Tulis balasan kamu di sini").setStyle(TextInputStyle.Paragraph).setPlaceholder("Balasan kamu akan dikirim ke thread oleh bot...").setRequired(true); return new ModalBuilder().setCustomId(customId).setTitle('Balas Menfess Secara Anonim').addComponents(new ActionRowBuilder().addComponents(replyInput)); }
function createMenfessModal() { const modal = new ModalBuilder().setCustomId('menfess_modal').setTitle('Kirim Menfess'); const penerimaInput = new TextInputBuilder().setCustomId('modal_penerima_teks').setLabel("Penerima (Nama/Julukan)").setPlaceholder("Tulis nama penerimanya di sini...").setStyle(TextInputStyle.Short).setRequired(true); const isiInput = new TextInputBuilder().setCustomId('modal_isi').setLabel("Isi Menfess Kamu").setStyle(TextInputStyle.Paragraph).setRequired(true); const anonimInput = new TextInputBuilder().setCustomId('modal_anonim').setLabel("Anonim? (Ketik 'Ya' atau 'Tidak')").setStyle(TextInputStyle.Short).setValue('Ya').setRequired(true); const gambarInput = new TextInputBuilder().setCustomId('modal_gambar_url').setLabel("Link Gambar/GIF (Opsional)").setPlaceholder("Tempel link Giphy atau Imgur di sini...").setStyle(TextInputStyle.Short).setRequired(false); modal.addComponents(new ActionRowBuilder().addComponents(penerimaInput), new ActionRowBuilder().addComponents(isiInput), new ActionRowBuilder().addComponents(anonimInput), new ActionRowBuilder().addComponents(gambarInput)); return modal; }


// ===================================================================
// HANDLER INTERAKSI (YANG AKAN DI-EXPORT)
// ===================================================================

async function handleButton(interaction, client) {
    const customId = interaction.customId;

    // --- Tombol Publik ---
    if (customId === 'menfess_anon_reply_MAIN' || customId === 'menfess_anon_reply_THREAD' || customId === 'menfess_send_again') {
        if (isUserTimedOut(interaction.user.id)) { return await interaction.reply({ content: 'Kamu tidak bisa melakukan aksi ini saat di-timeout.', flags: [MessageFlags.Ephemeral] }); }
        if (customId === 'menfess_send_again') { await interaction.showModal(createMenfessModal()); }
        else { const modalId = customId === 'menfess_anon_reply_MAIN' ? 'anon_reply_modal_MAIN' : 'anon_reply_modal_THREAD'; await interaction.showModal(createAnonReplyModal(modalId)); }
        return;
    }

    // --- Tombol Moderasi (Log Channel) ---
    if (customId.startsWith('log_')) {
        if (!hasModPermission(interaction.member)) { return await interaction.reply({ content: 'Hanya role moderator yang bisa menggunakan tombol ini.', flags: [MessageFlags.Ephemeral] }); }

        if (customId === 'log_delete_menfess') {
            try {
                const data = parseFooterForDelete(interaction.message.embeds[0]);
                if (!data) {
                    return await interaction.reply({ content: 'Gagal memproses tombol.', flags: [MessageFlags.Ephemeral] });
                }
                const publicChannel = await client.channels.fetch(data.publicChannelId);
                await publicChannel.messages.delete(data.publicMessageId);
                delete menfessDB.messages[data.publicMessageId];
                saveMenfessDB();
                const originalEmbed = interaction.message.embeds[0];
                const newEmbed = EmbedBuilder.from(originalEmbed).setColor(0xFF0000).setTitle(`[DIHAPUS] ${originalEmbed.title}`);
                await interaction.message.edit({ embeds: [newEmbed], components: [interaction.message.components[1]] });
                await interaction.reply({ content: '✅ Menfess publik telah dihapus (dan dari DB notif).', flags: [MessageFlags.Ephemeral] });
                const targetUser = await client.users.fetch(data.senderId);
                await sendModerationActionLog(interaction, "Hapus Menfess", targetUser, `Menghapus menfess: \"${originalEmbed.title}\"`);
            } catch (error) {
                console.error('Error hapus menfess:', error);
                // DiscordAPIError: Unknown Message (error code 10008)
                if (error.code === 10008 || (error.message && error.message.includes('Unknown Message'))) {
                    await interaction.reply({ content: 'Pesan sudah dihapus manual atau tidak ditemukan.', flags: [MessageFlags.Ephemeral] });
                } else {
                    await interaction.reply({ content: 'Gagal menghapus pesan.', flags: [MessageFlags.Ephemeral] });
                }
            }
        }
        else if (customId === 'log_delete_reply') {
            try { const data = parseFooterForReplyDelete(interaction.message.embeds[0]); if (!data) { return await interaction.reply({ content: 'Gagal memproses tombol.', flags: [MessageFlags.Ephemeral] }); } const thread = await client.channels.fetch(data.threadId); await thread.messages.delete(data.replyMessageId); const originalEmbed = interaction.message.embeds[0]; const newEmbed = EmbedBuilder.from(originalEmbed).setColor(0xFF0000).setTitle(`[DIHAPUS] ${originalEmbed.title}`); await interaction.message.edit({ embeds: [newEmbed], components: [interaction.message.components[1]] }); await interaction.reply({ content: '✅ Balasan anonim telah dihapus.', flags: [MessageFlags.Ephemeral] }); const senderId = getSenderIdFromFooter(originalEmbed); const targetUser = await client.users.fetch(senderId); await sendModerationActionLog(interaction, "Hapus Balasan", targetUser, `Menghapus balasan di: "${originalEmbed.fields[1].value}"`); } catch (error) { console.error('Error hapus balasan:', error); await interaction.reply({ content: 'Gagal menghapus balasan.', flags: [MessageFlags.Ephemeral] }); }
        }
        else if (customId === 'log_dm_sender') {
            try { const senderId = getSenderIdFromFooter(interaction.message.embeds[0]); if (!senderId) { return await interaction.reply({ content: 'Gagal menemukan ID pengirim di log.', flags: [MessageFlags.Ephemeral] }); } const dmModal = new ModalBuilder().setCustomId(`dm_sender_modal_${senderId}`).setTitle('Kirim DM ke Pengirim'); const messageInput = new TextInputBuilder().setCustomId('dm_message_text').setLabel('Pesan yang ingin dikirim').setStyle(TextInputStyle.Paragraph).setPlaceholder('Pesan ini akan dikirim ke pengirim menfess secara anonim (dari Bot).').setRequired(true); dmModal.addComponents(new ActionRowBuilder().addComponents(messageInput)); await interaction.showModal(dmModal); } catch (error) { console.error('Error modal DM:', error); await interaction.reply({ content: 'Gagal memunculkan modal DM.', flags: [MessageFlags.Ephemeral] }); }
        }
        return;
    }

    // --- Tombol Moderasi (Panel Kontrol) ---
    if (customId.startsWith('ctrl_')) {
        if (!hasModPermission(interaction.member)) { return await interaction.reply({ content: 'Hanya role moderator yang bisa menggunakan tombol ini.', flags: [MessageFlags.Ephemeral] }); }
        try { const parts = customId.split('_'); const action = parts[1]; const targetUserId = parts.pop(); const targetUser = await client.users.fetch(targetUserId); let logReason = ""; if (action === 'timeout') { const duration = parts[2]; addTimeout(targetUserId, duration); logReason = `Timeout diatur ke: ${duration}`; } else if (action === 'remove') { removeTimeout(targetUserId); logReason = "Timeout dicabut"; } const { currentStatusString } = getTimeoutStatus(targetUserId); const newEmbed = new EmbedBuilder().setTitle(`Panel Kontrol: ${targetUser.tag}`).setDescription(`Status Diperbarui: ${currentStatusString}`).setColor(0x0099FF); await interaction.update({ embeds: [newEmbed], components: interaction.message.components }); await sendModerationActionLog(interaction, "Update Timeout (via Panel)", targetUser, logReason); } catch (error) { console.error("Error di tombol panel kontrol:", error); await interaction.reply({ content: 'Gagal memproses aksi.', flags: [MessageFlags.Ephemeral] }); }
        return;
    }

    // --- Tombol Subscribe ---
    if (customId.startsWith('sub_')) {
        try {
            const messageId = customId.split('_')[1];
            const userId = interaction.user.id;
            if (!menfessDB.messages[messageId]) { return await interaction.reply({ content: 'Error: Tidak dapat menemukan data menfess ini.', flags: [MessageFlags.Ephemeral] }); }
            if (menfessDB.messages[messageId].sender === userId) { return await interaction.reply({ content: 'Kamu adalah pengirim asli, kamu otomatis mendapat notifikasi.', flags: [MessageFlags.Ephemeral] }); }
            if (isSubscribed(messageId, userId)) {
                removeSubscriber(messageId, userId);
                await interaction.reply({ content: '❌ **Notifikasi Dibatalkan.** Kamu tidak akan lagi menerima DM dari thread ini.', flags: [MessageFlags.Ephemeral] });
            } else {
                addSubscriber(messageId, userId);
                await interaction.reply({ content: '🔔 **Berhasil Subscribe!** Kamu akan menerima DM setiap ada balasan baru di thread ini.', flags: [MessageFlags.Ephemeral] });
            }
        } catch (error) { console.error("Error di tombol subscribe:", error); await interaction.reply({ content: 'Gagal memproses subscription.', flags: [MessageFlags.Ephemeral] }); }
        return;
    }
}

async function handleSelectMenu(interaction, client) {
    const customId = interaction.customId;
    if (customId === 'log_timeout_menu') {
        if (!hasModPermission(interaction.member)) { return await interaction.reply({ content: 'Hanya role moderator yang bisa menggunakan ini.', flags: [MessageFlags.Ephemeral] }); }
        try { const senderId = getSenderIdFromFooter(interaction.message.embeds[0]); if (!senderId) { return await interaction.reply({ content: 'Gagal menemukan ID pengirim di log.', flags: [MessageFlags.Ephemeral] }); } const duration = interaction.values[0]; const targetUser = await client.users.fetch(senderId); let logReason = ""; if (duration === 'remove') { if (removeTimeout(senderId)) { await interaction.reply({ content: `✅ Timeout untuk <@${senderId}> telah dicabut.`, flags: [MessageFlags.Ephemeral] }); logReason = "Timeout dicabut"; } else { await interaction.reply({ content: `⚠️ User <@${senderId}> memang tidak sedang dalam status timeout.`, flags: [MessageFlags.Ephemeral] }); return; } } else { const feedback = addTimeout(senderId, duration); await interaction.reply({ content: `🚫 User <@${senderId}> berhasil ${feedback}`, flags: [MessageFlags.Ephemeral] }); logReason = `Timeout diatur ke: ${duration}`; } await sendModerationActionLog(interaction, "Update Timeout (via Log)", targetUser, logReason); } catch (error) { console.error('Error di log_timeout_menu:', error); await interaction.reply({ content: 'Gagal memproses timeout via dropdown.', flags: [MessageFlags.Ephemeral] }); }
    }
}

async function handleModalSubmit(interaction, client) {
    const customId = interaction.customId;
    if (isUserTimedOut(interaction.user.id) && !customId.startsWith('dm_sender_modal_')) { return await interaction.reply({ content: 'Kamu tidak bisa melakukan aksi ini saat di-timeout.', flags: [MessageFlags.Ephemeral] }); }

    // --- Modal Submit Menfess ---
    if (customId === 'menfess_modal') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        let menfessId = '';
        try {
            const penerimaTeks = interaction.fields.getTextInputValue('modal_penerima_teks');
            const isi = interaction.fields.getTextInputValue('modal_isi');
            const anonText = interaction.fields.getTextInputValue('modal_anonim');
            const gambarLink = interaction.fields.getTextInputValue('modal_gambar_url');
            const isAnonim = anonText.toLowerCase() === 'ya';
            menfessCount++;
            menfessId = menfessCount.toString().padStart(3, '0');
            saveCount(menfessCount);
            const pengirimNama = isAnonim ? 'Seseorang' : interaction.user.username;
            const pengirimAvatar = isAnonim ? 'https://i.imgur.com/pBxtF1p.png' : interaction.user.displayAvatarURL();
            let imageUrl = null;
            let deskripsi = isi;
            if (gambarLink && (gambarLink.startsWith('http://') || gambarLink.startsWith('https://'))) {
                if (gambarLink.includes('instagram.com')) {
                    deskripsi += `\n\n**Media Terlampir:**\n${gambarLink}`;
                } else {
                    imageUrl = gambarLink;
                }
            }
            const embed = new EmbedBuilder().setColor(0x0099FF).setAuthor({ name: `Dari: ${pengirimNama}`, iconURL: pengirimAvatar }).setTitle(`Menfess #${menfessId} untuk ${penerimaTeks}`).setDescription(deskripsi).setTimestamp();
            if (imageUrl) { embed.setImage(imageUrl); }
            const sendNewMenfessButton = new ButtonBuilder().setCustomId('menfess_send_again').setLabel('Kirim Menfess Baru').setStyle(ButtonStyle.Success).setEmoji('✉️');
            const anonReplyButton = new ButtonBuilder().setCustomId('menfess_anon_reply_MAIN').setLabel('Balas Anonim').setStyle(ButtonStyle.Primary).setEmoji('🤫');
            const publicRow = new ActionRowBuilder().addComponents(sendNewMenfessButton, anonReplyButton);
            const channel = await client.channels.fetch(MENFESS_CHANNEL_ID);
            const publicMessage = await channel.send({ embeds: [embed], components: [publicRow] });
            menfessDB.messages[publicMessage.id] = { sender: interaction.user.id, subscribers: [] };
            saveMenfessDB();
            await sendToLogChannel(client, interaction, penerimaTeks, isi, menfessId, imageUrl || gambarLink, publicMessage.id);
            const sendAgainButton = new ButtonBuilder().setCustomId('menfess_send_again').setLabel('Kirim Menfess Lagi').setStyle(ButtonStyle.Primary);
            const privateRow = new ActionRowBuilder().addComponents(sendAgainButton);
            await interaction.editReply({ content: '✅ Menfess berhasil terkirim!', components: [privateRow] });
        } catch (error) {
            console.error('Error di submit modal menfess:', error);
            if (menfessId) { menfessCount--; saveCount(menfessCount); }
            await interaction.editReply({ content: 'Gagal mengirim menfess. Coba lagi.' });
        }
    }

    // --- Modal Submit Balasan (MAIN) ---
    else if (customId === 'anon_reply_modal_MAIN') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        try {
            const replyText = interaction.fields.getTextInputValue('anon_reply_text');
            const originalMessage = interaction.message;
            const originalMessageId = originalMessage.id;
            const embedTitle = originalMessage.embeds[0]?.title || 'Balasan Menfess';
            const targetThread = originalMessage.thread || await originalMessage.startThread({ name: `Balasan untuk: ${embedTitle}`, autoArchiveDuration: 60 });
            const anonReplyEmbed = new EmbedBuilder().setColor(0xCCCCCC).setAuthor({ name: 'Balasan Anonim', iconURL: 'https://i.imgur.com/pBxtF1p.png' }).setDescription(replyText).setTimestamp();
            const threadReplyButton = new ButtonBuilder().setCustomId('menfess_anon_reply_THREAD').setLabel('Balas Anonim Lagi').setStyle(ButtonStyle.Primary).setEmoji('🤫');
            const threadRow = new ActionRowBuilder().addComponents(threadReplyButton);
            const anonReplyMessage = await targetThread.send({ embeds: [anonReplyEmbed], components: [threadRow] });
            await sendReplyToLogChannel(client, interaction, replyText, embedTitle, anonReplyMessage);
            const replierUserId = interaction.user.id;
            const dbEntry = menfessDB.messages[originalMessageId];
            if (dbEntry) {
                const recipients = new Set();
                if (dbEntry.sender && dbEntry.sender !== replierUserId) { recipients.add(dbEntry.sender); }
                (dbEntry.subscribers || []).forEach(subId => { if (subId !== replierUserId) recipients.add(subId); });
                for (const recipientId of recipients) { try { const user = await client.users.fetch(recipientId); await user.send({ content: `🔔 **Notifikasi:** Seseorang telah membalas menfess!`, embeds: [new EmbedBuilder().setColor(0x00FF00).setTitle(`Balasan Baru untuk: ${embedTitle}`).setDescription(`Klik di sini untuk melihat balasan di thread: <#${targetThread.id}>`).setTimestamp()] }); } catch (dmError) { console.error(`Gagal DM notif ke ${recipientId}:`, dmError); } }
            }
            const isAlreadySubscribed = dbEntry ? isSubscribed(originalMessageId, replierUserId) : false;
            const subscribeButton = new ButtonBuilder().setCustomId(`sub_${originalMessageId}`).setLabel(isAlreadySubscribed ? 'Batalkan Notifikasi' : '🔔 Ikuti Notifikasi Thread Ini').setStyle(isAlreadySubscribed ? ButtonStyle.Danger : ButtonStyle.Success);
            await interaction.editReply({ content: 'Balasan anonim kamu berhasil dikirim ke thread!', components: [new ActionRowBuilder().addComponents(subscribeButton)] });
        } catch (error) { console.error('Error saat submit balasan MAIN:', error); await interaction.editReply({ content: 'Gagal mengirim balasan anonim.' }); }
    }

    // --- Modal Submit Balasan (THREAD) ---
    else if (customId === 'anon_reply_modal_THREAD') {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        try {
            const replyText = interaction.fields.getTextInputValue('anon_reply_text');
            const targetThread = interaction.channel;
            const originalMessageId = targetThread.parentId;
            const embedTitle = targetThread.name;
            const anonReplyEmbed = new EmbedBuilder().setColor(0xCCCCCC).setAuthor({ name: 'Balasan Anonim', iconURL: 'https://i.imgur.com/pBxtF1p.png' }).setDescription(replyText).setTimestamp();
            const threadReplyButton = new ButtonBuilder().setCustomId('menfess_anon_reply_THREAD').setLabel('Balas Anonim Lagi').setStyle(ButtonStyle.Primary).setEmoji('🤫');
            const threadRow = new ActionRowBuilder().addComponents(threadReplyButton);
            const anonReplyMessage = await targetThread.send({ embeds: [anonReplyEmbed], components: [threadRow] });
            await sendReplyToLogChannel(client, interaction, replyText, embedTitle, anonReplyMessage);
            const replierUserId = interaction.user.id;
            const dbEntry = menfessDB.messages[originalMessageId];
            if (dbEntry) {
                const recipients = new Set();
                if (dbEntry.sender && dbEntry.sender !== replierUserId) { recipients.add(dbEntry.sender); }
                (dbEntry.subscribers || []).forEach(subId => { if (subId !== replierUserId) recipients.add(subId); });
                for (const recipientId of recipients) { try { const user = await client.users.fetch(recipientId); await user.send({ content: `🔔 **Notifikasi:** Seseorang telah membalas menfess!`, embeds: [new EmbedBuilder().setColor(0x00FF00).setTitle(`Balasan Baru di: ${embedTitle}`).setDescription(`Klik di sini untuk melihat balasan di thread: <#${targetThread.id}>`).setTimestamp()] }); } catch (dmError) { console.error(`Gagal DM notif ke ${recipientId}:`, dmError); } }
            }
            const isAlreadySubscribed = dbEntry ? isSubscribed(originalMessageId, replierUserId) : false;
            const subscribeButton = new ButtonBuilder().setCustomId(`sub_${originalMessageId}`).setLabel(isAlreadySubscribed ? 'Batalkan Notifikasi' : '🔔 Ikuti Notifikasi Thread Ini').setStyle(isAlreadySubscribed ? ButtonStyle.Danger : ButtonStyle.Success);
            await interaction.editReply({ content: 'Balasan anonim kamu berhasil dikirim!', components: [new ActionRowBuilder().addComponents(subscribeButton)] });
        } catch (error) { console.error('Error saat submit balasan THREAD:', error); await interaction.editReply({ content: 'Gagal mengirim balasan anonim.' }); }
    }

    // --- Modal Submit DM dari Admin ---
    else if (customId.startsWith('dm_sender_modal_')) {
        await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });
        try { const senderId = customId.split('_')[3]; const messageText = interaction.fields.getTextInputValue('dm_message_text'); const targetUser = await client.users.fetch(senderId); const dmEmbed = new EmbedBuilder().setColor(0xFFD700).setTitle('Pesan dari Moderator').setDescription(messageText).setFooter({ text: 'Pesan ini dikirim oleh moderator server via bot menfess.' }); await targetUser.send({ embeds: [dmEmbed] }); await interaction.editReply({ content: `✅ DM berhasil dikirim ke **${targetUser.tag}**.` }); await sendModerationActionLog(interaction, "DM Pengirim", targetUser, messageText); } catch (error) { console.error('Error kirim DM:', error); if (error.code === 50007) { await interaction.editReply({ content: 'Gagal mengirim DM. User tersebut kemungkinan menutup DM-nya.' }); } else { await interaction.editReply({ content: 'Gagal mengirim DM. Terjadi error.' }); } }
    }
}


// ===================================================================
// EXPORT SEMUA FUNGSI AGAR BISA DIPAKAI DI FILE LAIN
// ===================================================================
module.exports = {
    // Variabel/State
    menfessCount,
    timedOutUsersMap,
    menfessDB,

    // Fungsi Inisialisasi
    readCount,
    loadTimeouts,
    loadMenfessDB,

    // Fungsi Util/Helper
    isUserTimedOut,
    createMenfessModal,
    hasModPermission,
    getTimeoutStatus,
    timedOutUsersMap,

    // Fungsi Handler (dipakai oleh interactionCreate.js)
    handleButton,
    handleSelectMenu,
    handleModalSubmit
};

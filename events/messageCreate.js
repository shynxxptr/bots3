const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot) return;

        const config = require('../config.json');
        const { addXp } = require('../utils/leveling');

        // Leveling Logic
        if (!message.author.bot && message.guild) {
            const result = addXp(message.author.id, message.guild.id);
            if (result.leveledUp) {
                const { generateLevelUpImage } = require('../utils/levelUpRenderer');
                const levelUpAttachment = await generateLevelUpImage(message.member, result.level - 1, result.level);

                // Send to specific channel if configured, otherwise current channel
                const levelUpChannel = config.levelUpChannelId ? message.guild.channels.cache.get(config.levelUpChannelId) : message.channel;
                if (levelUpChannel) {
                    await levelUpChannel.send({
                        content: `Selamat <@${message.author.id}>! Kamu naik ke **Level ${result.level}**! 🎉`,
                        files: [levelUpAttachment]
                    });
                }
            }
        }

        // Counting Logic
        if (message.channel.id === config.counting.channelId) {
            const fs = require('fs');
            const path = require('path');
            const dataPath = path.join(__dirname, '../data/counting.json');

            let countingData = { currentCount: 0, lastUserId: null };
            try {
                countingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
            } catch (err) {
                console.error('Error reading counting data:', err);
            }

            const number = parseInt(message.content);

            // Check if it's a number
            if (isNaN(number)) return;

            // Check if user is the same as last user
            if (message.author.id === countingData.lastUserId) {
                await message.react('❌');
                await message.channel.send(`🚫 <@${message.author.id}>, kamu tidak boleh menghitung dua kali berturut-turut! Hitungan di-reset ke 0.`);
                countingData.currentCount = 0;
                countingData.lastUserId = null;
                fs.writeFileSync(dataPath, JSON.stringify(countingData, null, 4));
                return;
            }

            // Check if number is correct
            if (number === countingData.currentCount + 1) {
                countingData.currentCount++;
                countingData.lastUserId = message.author.id;
                await message.react('✅');
                fs.writeFileSync(dataPath, JSON.stringify(countingData, null, 4));
            } else {
                await message.react('❌');
                await message.channel.send(`💀 <@${message.author.id}> salah hitung! Angka selanjutnya harusnya **${countingData.currentCount + 1}**. Hitungan di-reset ke 0.`);
                countingData.currentCount = 0;
                countingData.lastUserId = null;
                fs.writeFileSync(dataPath, JSON.stringify(countingData, null, 4));
            }
            return;
        }

        if (message.content.toLowerCase() === '!hadir') {
            // Channel Restriction
            const allowedChannelId = '1445442876426293388';
            if (message.channel.id !== allowedChannelId) {
                const reply = await message.reply(`❌ Command ini hanya bisa digunakan di <#${allowedChannelId}>!`);
                setTimeout(() => reply.delete().catch(() => { }), 5000); // Auto delete error message
                return;
            }

            const { addDailyXp } = require('../utils/leveling');
            const result = addDailyXp(message.author.id, message.guild.id);

            if (result.success) {
                const { generateAbsenImage } = require('../utils/absenRenderer');
                const attachment = await generateAbsenImage(message.member, 100);

                await message.reply({
                    content: `✅ **Absen Berhasil!**\n🔥 Streak: **${result.streak || 1} hari**`,
                    files: [attachment]
                });

                if (result.leveledUp) {
                    const { generateLevelUpImage } = require('../utils/levelUpRenderer');
                    const levelUpAttachment = await generateLevelUpImage(message.member, result.level - 1, result.level);

                    // Send to specific channel if configured, otherwise current channel
                    const levelUpChannel = config.levelUpChannelId ? message.guild.channels.cache.get(config.levelUpChannelId) : message.channel;
                    if (levelUpChannel) {
                        await levelUpChannel.send({
                            content: `Selamat <@${message.author.id}>! Kamu naik ke **Level ${result.level}**! 🎉`,
                            files: [levelUpAttachment]
                        });
                    }
                }
            } else {
                await message.reply(`⏳ **Kamu sudah absen hari ini.**\nCoba lagi **besok** ya! (cek: \`!streak\`)`);
            }
            return;
        }

        // Photo Stats Logic
        const photoChannelId = '1444703061720174622';
        const photoRoleId = '1445461661799415848';

        if (message.channel.id === photoChannelId && message.attachments.size > 0) {
            const fs = require('fs');
            const path = require('path');
            const photoStatsPath = path.join(__dirname, '../data/photostats.json');

            let photoStats = {};
            try {
                if (fs.existsSync(photoStatsPath)) {
                    photoStats = JSON.parse(fs.readFileSync(photoStatsPath, 'utf8'));
                }
            } catch (err) {
                console.error('Error reading photo stats:', err);
            }

            const userId = message.author.id;
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            if (!photoStats[userId]) {
                photoStats[userId] = { total: 0, daily: 0, lastDate: today };
            }

            // Reset daily count if new day
            if (photoStats[userId].lastDate !== today) {
                photoStats[userId].daily = 0;
                photoStats[userId].lastDate = today;
            }

            // Check Daily Limit (Max 2)
            if (photoStats[userId].daily < 2) {
                photoStats[userId].daily++;
                photoStats[userId].total++;

                fs.writeFileSync(photoStatsPath, JSON.stringify(photoStats, null, 4));

                // Check for Role Reward (Threshold: 10)
                if (photoStats[userId].total >= 10) {
                    try {
                        const role = message.guild.roles.cache.get(photoRoleId);
                        if (role && !message.member.roles.cache.has(photoRoleId)) {
                            await message.member.roles.add(role);
                            await message.reply(`📸 **Selamat!** Kamu telah mengirim 10 foto dan mendapatkan role **${role.name}**! 🌟`);
                        }
                    } catch (err) {
                        console.error('Error adding photo role:', err);
                    }
                } else {
                    // Progress Notification (Auto-delete)
                    const reply = await message.reply(`📸 **Progress MBG Hunter:** ${photoStats[userId].total}/10 (Harian: ${photoStats[userId].daily}/2)`);
                    setTimeout(() => reply.delete().catch(() => { }), 5000);
                }
            } else {
                // Daily Limit Reached Notification (Auto-delete)
                const reply = await message.reply(`⏳ **Limit Harian Tercapai!** (2/2)\nKamu sudah mengirim 2 foto hari ini. Progress tidak bertambah, tapi foto tetap tersimpan.`);
                setTimeout(() => reply.delete().catch(() => { }), 5000);
            }
        }
        if (message.content.toLowerCase() === 's3!help') {
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

            await message.reply({ embeds: [embed] });
        }

        // ===========================
        // COMMUNITY FEATURES (PREFIX)
        // ===========================
        const content = message.content.trim();
        const lower = content.toLowerCase();

        // Public: check streak
        if (lower === '!streak' || lower.startsWith('!streak ')) {
            if (!message.guild) return;

            const target = message.mentions.users.first() || message.author;
            const { getStreak } = require('../utils/leveling');
            const info = getStreak(target.id, message.guild.id);

            if (!info || !info.lastDailyDate) {
                const reply = await message.reply(`🔥 Streak ${target.id === message.author.id ? 'kamu' : target.username}: **0 hari**\nBelum pernah absen harian.`);
                setTimeout(() => reply.delete().catch(() => { }), 12000);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor('#ff6a00')
                .setTitle('🔥 Daily Streak')
                .setDescription(`${target.id === message.author.id ? 'Streak kamu' : `Streak ${target.username}`}: **${info.streak} hari**`)
                .addFields({ name: 'Terakhir absen', value: `\`${info.lastDailyDate}\``, inline: true })
                .setFooter({ text: 'Streak bertambah kalau absen tiap hari tanpa bolong.' });

            const reply = await message.reply({ embeds: [embed] });
            setTimeout(() => reply.delete().catch(() => { }), 20000);
            return;
        }

        // ===========================
        // TEST STREAK (ADMIN/STAFF)
        // ===========================
        // !teststreak @user1 @user2 [streak] -> test streak notification
        if (lower === '!teststreak' || lower.startsWith('!teststreak ')) {
            if (!message.guild) return;

            // Check if user has admin or staff role
            const config = require('../config.json');
            const staffRoleId = config.utilities?.staffRoleId;
            const isAdmin = message.member?.permissions.has('Administrator');
            const isStaff = staffRoleId && message.member?.roles.cache.has(staffRoleId);

            if (!isAdmin && !isStaff) {
                const reply = await message.reply('❌ Hanya admin/staff yang bisa menggunakan command ini.');
                setTimeout(() => reply.delete().catch(() => { }), 5000);
                return;
            }

            const mentions = message.mentions.users;
            if (mentions.size < 2) {
                const reply = await message.reply('❌ Format: `!teststreak @user1 @user2 [streak]`\nContoh: `!teststreak @user1 @user2 5`');
                setTimeout(() => reply.delete().catch(() => { }), 10000);
                return;
            }

            const users = Array.from(mentions.values()).slice(0, 2);
            const args = message.content.split(/\s+/);
            const streakArg = args.find(arg => /^\d+$/.test(arg));
            const streak = streakArg ? parseInt(streakArg) : 5;

            const { testStreakNotification } = require('../utils/voicePairStreak');
            const result = await testStreakNotification(message.client, message.guild.id, users[0].id, users[1].id, streak);

            if (result.success) {
                const reply = await message.reply(`✅ Test streak notification berhasil dikirim! (Streak: ${streak} hari)`);
                setTimeout(() => reply.delete().catch(() => { }), 5000);
            } else {
                const reply = await message.reply(`❌ Gagal: ${result.error || 'Unknown error'}`);
                setTimeout(() => reply.delete().catch(() => { }), 10000);
            }
            return;
        }

        // ===========================
        // VOICE PAIR STREAK (PUBLIC)
        // ===========================
        // !vstreak @user -> check pair streak
        // !vstreak -> show your top pairs (max 5)
        if (lower === '!vstreak' || lower.startsWith('!vstreak ')) {
            if (!message.guild) return;

            const { getPairStreak, getTopPairsForUser, getSettings } = require('../utils/voicePairStreak');
            const settings = getSettings();

            const target = message.mentions.users.first();
            if (target) {
                // Prevent checking streak with self
                if (target.id === message.author.id) {
                    const reply = await message.reply('❌ Kamu tidak bisa cek streak dengan dirimu sendiri!');
                    setTimeout(() => reply.delete().catch(() => { }), 10000);
                    return;
                }
                
                try {
                    const p = getPairStreak(message.guild.id, message.author.id, target.id);
                    
                    // Format time helper
                    const formatTime = (seconds) => {
                        const hours = Math.floor(seconds / 3600);
                        const minutes = Math.floor((seconds % 3600) / 60);
                        const secs = seconds % 60;
                        if (hours > 0) {
                            return `${hours}j ${minutes}m`;
                        } else if (minutes > 0) {
                            return `${minutes}m ${secs}d`;
                        } else {
                            return `${secs}d`;
                        }
                    };

                    const requiredMinutes = Math.floor(settings.requiredSeconds / 60);
                    const requiredSeconds = settings.requiredSeconds;

                    if (!p) {
                        const reply = await message.reply(
                            `🔥 Voice streak kamu dengan **${target.username}**: **0**\n` +
                            `Belum memenuhi syarat (harus bareng **${requiredMinutes} menit** per hari, **3 hari berturut-turut**).`
                        );
                        setTimeout(() => reply.delete().catch(() => { }), 15000);
                        return;
                    }

                    const other = p.a === message.author.id ? p.b : p.a;
                    
                    // Calculate progress for today
                    const todaySeconds = p.todaySeconds || 0;
                    const progressPercent = requiredSeconds > 0 ? Math.min((todaySeconds / requiredSeconds) * 100, 100) : 0;
                    const remainingSeconds = Math.max(requiredSeconds - todaySeconds, 0);
                    
                    // Progress bar (10 blocks)
                    const progressBlocks = 10;
                    const filledBlocks = requiredSeconds > 0 ? Math.min(Math.floor((todaySeconds / requiredSeconds) * progressBlocks), progressBlocks) : 0;
                    const emptyBlocks = Math.max(progressBlocks - filledBlocks, 0);
                    const progressBar = '█'.repeat(Math.max(filledBlocks, 0)) + '░'.repeat(emptyBlocks);

                    const embed = new EmbedBuilder()
                        .setColor('#ff6a00')
                        .setTitle('🔥 Voice Pair Streak')
                        .setDescription(`Streak kamu dengan <@${other}>: **${p.streak || 0} hari**`)
                        .addFields(
                            { name: 'Terakhir valid', value: p.lastValidDate ? `\`${p.lastValidDate}\`` : '`-`', inline: true },
                            { name: 'Status', value: p.status === 'active' ? '✅ Active' : '⏳ Candidate', inline: true },
                            { name: 'Rule', value: `≥${requiredMinutes} menit/hari (WIB)`, inline: true },
                        );

                    // Add progress field
                    const { getDateKey } = require('../utils/voicePairStreak');
                    const todayKey = getDateKey();
                    
                    if (p.todayKey === todayKey) {
                        // Same day - show progress
                        const isCompleted = p.todayValid || todaySeconds >= requiredSeconds;
                        embed.addFields({
                            name: isCompleted ? '✅ Progress Hari Ini (Selesai)' : '⏳ Progress Hari Ini',
                            value: 
                                `\`${progressBar}\` ${progressPercent.toFixed(1)}%\n` +
                                `⏱️ **${formatTime(todaySeconds)}** / ${formatTime(requiredSeconds)}\n` +
                                (remainingSeconds > 0 ? `⏰ Tersisa: **${formatTime(remainingSeconds)}**` : '✅ **Sudah selesai hari ini!**'),
                            inline: false
                        });
                    } else if (p.todayKey) {
                        // Different day - no activity today
                        embed.addFields({
                            name: '📅 Progress Hari Ini',
                            value: 'Belum ada aktivitas hari ini',
                            inline: false
                        });
                    } else {
                        // No todayKey - never tracked today
                        embed.addFields({
                            name: '📅 Progress Hari Ini',
                            value: 'Belum ada aktivitas hari ini',
                            inline: false
                        });
                    }

                    const reply = await message.reply({ embeds: [embed] });
                    setTimeout(() => reply.delete().catch(() => { }), 30000);
                } catch (error) {
                    console.error('Error in !vstreak command:', error);
                    const reply = await message.reply('❌ Terjadi error saat mengecek streak. Coba lagi nanti.');
                    setTimeout(() => reply.delete().catch(() => { }), 10000);
                }
                return;
            }

            const top = getTopPairsForUser(message.guild.id, message.author.id, settings.limitPerUser);
            if (!top.length) {
                const reply = await message.reply(
                    `Kamu belum punya **voice streak** yang tercatat.\n` +
                    `Syarat: bareng di voice channel yang sama **≥${Math.round(settings.requiredSeconds / 60)} menit** per hari, **3 hari berturut-turut**.`
                );
                setTimeout(() => reply.delete().catch(() => { }), 15000);
                return;
            }

            // Format time helper
            const formatTime = (seconds) => {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                const secs = seconds % 60;
                if (hours > 0) {
                    return `${hours}j ${minutes}m`;
                } else if (minutes > 0) {
                    return `${minutes}m`;
                } else {
                    return `${secs}d`;
                }
            };

            const { getDateKey } = require('../utils/voicePairStreak');
            const todayKey = getDateKey();

            const lines = top.map((p, idx) => {
                const other = p.a === message.author.id ? p.b : p.a;
                let line = `**${idx + 1}.** <@${other}> — 🔥 **${p.streak}** hari`;
                
                // Add progress if today's data exists
                if (p.todayKey === todayKey && p.todaySeconds !== undefined) {
                    const progressPercent = Math.min((p.todaySeconds / settings.requiredSeconds) * 100, 100);
                    const isCompleted = p.todayValid || p.todaySeconds >= settings.requiredSeconds;
                    line += `\n   ${isCompleted ? '✅' : '⏳'} ${formatTime(p.todaySeconds)}/${formatTime(settings.requiredSeconds)} (${progressPercent.toFixed(0)}%)`;
                }
                
                return line;
            }).join('\n\n');

            const embed = new EmbedBuilder()
                .setColor('#ff6a00')
                .setTitle('🔥 Top Voice Streak Kamu')
                .setDescription(lines)
                .setFooter({ text: `Limit: ${settings.limitPerUser} pasangan | Rule: ≥${Math.round(settings.requiredSeconds / 60)} menit/hari (WIB)` });

            const reply = await message.reply({ embeds: [embed] });
            setTimeout(() => reply.delete().catch(() => { }), 30000);
            return;
        }

        // ===========================
        // REPUTATION SYSTEM (SEKOLAH THEME)
        // ===========================
        // !nilai @user -> kasih poin prestasi ke user
        if (lower === '!nilai' || lower.startsWith('!nilai ')) {
            if (!message.guild) return;

            const target = message.mentions.users.first();
            if (!target) {
                const reply = await message.reply('📝 Format: `!nilai @user`\nKasih poin prestasi ke teman kamu!');
                setTimeout(() => reply.delete().catch(() => { }), 10000);
                return;
            }

            if (target.bot) {
                const reply = await message.reply('❌ Bot tidak bisa dapat poin prestasi!');
                setTimeout(() => reply.delete().catch(() => { }), 8000);
                return;
            }

            try {
                const { giveReputation } = require('../utils/reputation');
                const result = giveReputation(message.guild.id, message.author.id, target.id);

                if (!result.success) {
                    const reply = await message.reply(`❌ ${result.error}`);
                    setTimeout(() => reply.delete().catch(() => { }), 15000);
                    return;
                }

                const reply = await message.reply(
                    `⭐ **Poin Prestasi Diberikan!**\n` +
                    `Kamu kasih poin prestasi ke **${target.username}**!\n` +
                    `📊 **${target.username}** sekarang punya **${result.totalRep} poin prestasi** dari **${result.uniqueGivers} teman** berbeda.\n\n` +
                    `💡 *Kamu bisa kasih poin lagi ke user ini besok (cooldown 24 jam)*`
                );
                setTimeout(() => reply.delete().catch(() => { }), 20000);
            } catch (error) {
                console.error('Error in !nilai command:', error);
                const reply = await message.reply('❌ Terjadi error saat kasih poin prestasi. Coba lagi nanti.');
                setTimeout(() => reply.delete().catch(() => { }), 10000);
            }
            return;
        }

        // !prestasi [@user] -> cek poin prestasi
        if (lower === '!prestasi' || lower.startsWith('!prestasi ')) {
            if (!message.guild) return;

            const target = message.mentions.users.first() || message.author;
            
            try {
                const { getReputation } = require('../utils/reputation');
                const rep = getReputation(message.guild.id, target.id);

                if (!rep || rep.totalRep === 0) {
                    const reply = await message.reply(
                        `📊 **Poin Prestasi ${target.id === message.author.id ? 'kamu' : target.username}**: **0**\n` +
                        `Belum ada yang kasih poin prestasi ${target.id === message.author.id ? 'ke kamu' : 'ke user ini'}.\n` +
                        `💡 *Gunakan \`!nilai @user\` untuk kasih poin prestasi!*`
                    );
                    setTimeout(() => reply.delete().catch(() => { }), 15000);
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('⭐ Poin Prestasi')
                    .setDescription(`${target.id === message.author.id ? 'Poin prestasi kamu' : `Poin prestasi ${target.username}`}: **${rep.totalRep} poin**`)
                    .addFields(
                        { name: '👥 Dari teman', value: `**${rep.uniqueGivers}** teman berbeda`, inline: true },
                        { name: '📈 Total', value: `**${rep.totalRep}** poin prestasi`, inline: true },
                    )
                    .setFooter({ text: 'Poin prestasi = apresiasi dari teman-teman di S3! 💫' });

                const reply = await message.reply({ embeds: [embed] });
                setTimeout(() => reply.delete().catch(() => { }), 25000);
            } catch (error) {
                console.error('Error in !prestasi command:', error);
                const reply = await message.reply('❌ Terjadi error saat mengecek poin prestasi. Coba lagi nanti.');
                setTimeout(() => reply.delete().catch(() => { }), 10000);
            }
            return;
        }

        // !peringkat -> leaderboard poin prestasi
        if (lower === '!peringkat' || lower.startsWith('!peringkat ')) {
            if (!message.guild) return;

            try {
                const { getTopReputation } = require('../utils/reputation');
                const top = getTopReputation(message.guild.id, 10);

                if (!top.length) {
                    const reply = await message.reply(
                        `📊 **Peringkat Prestasi S3**\n` +
                        `Belum ada yang punya poin prestasi.\n` +
                        `💡 *Gunakan \`!nilai @user\` untuk kasih poin prestasi!*`
                    );
                    setTimeout(() => reply.delete().catch(() => { }), 15000);
                    return;
                }

                const lines = top.map((user, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '📌';
                    return `${medal} **${idx + 1}.** <@${user.userId}> — ⭐ **${user.totalRep}** poin (dari ${user.uniqueGivers} teman)`;
                }).join('\n');

                const embed = new EmbedBuilder()
                    .setColor('#FFD700')
                    .setTitle('🏆 Peringkat Prestasi S3')
                    .setDescription(lines)
                    .setFooter({ text: 'Peringkat berdasarkan poin prestasi dari teman-teman! 💫' });

                const reply = await message.reply({ embeds: [embed] });
                setTimeout(() => reply.delete().catch(() => { }), 30000);
            } catch (error) {
                console.error('Error in !peringkat command:', error);
                const reply = await message.reply('❌ Terjadi error saat menampilkan peringkat. Coba lagi nanti.');
                setTimeout(() => reply.delete().catch(() => { }), 10000);
            }
            return;
        }

        const isStaff = () => {
            if (!message.guild || !message.member) return false;
            if (message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return true;

            const cfg = require('../config.json');
            const staffRoleId =
                cfg.utilities?.staffRoleId ||
                cfg.ticket?.staffRoleId ||
                cfg.suggestions?.staffRoleId;

            if (!staffRoleId) return false;
            return message.member.roles.cache.has(staffRoleId);
        };

        // ===========================
        // STAFF UTILITIES (PREFIX)
        // ===========================
        // !purge 20  -> delete last 20 messages (plus command message)
        if (lower.startsWith('!purge')) {
            if (!message.guild) return;
            if (!isStaff()) return;

            const match = content.match(/^!purge\s+(\d{1,3})\s*$/i);
            if (!match) {
                const usage = await message.reply('Format: `!purge <jumlah>` (1-100)');
                setTimeout(() => usage.delete().catch(() => { }), 8000);
                return;
            }

            let amount = parseInt(match[1], 10);
            if (Number.isNaN(amount)) return;
            if (amount < 1) amount = 1;
            if (amount > 100) amount = 100;

            try {
                const deleted = await message.channel.bulkDelete(amount + 1, true);
                const info = await message.channel.send(`🧹 Berhasil hapus **${deleted.size - 1}** pesan.`);
                setTimeout(() => info.delete().catch(() => { }), 5000);
            } catch (err) {
                console.error('purge error:', err);
                const reply = await message.reply('❌ Gagal purge. Pastikan bot punya permission **Manage Messages**, dan pesan tidak lebih dari 14 hari.');
                setTimeout(() => reply.delete().catch(() => { }), 10000);
            }
            return;
        }

        // !slowmode 10 -> set slowmode 10s (0 to disable)
        if (lower.startsWith('!slowmode')) {
            if (!message.guild) return;
            if (!isStaff()) return;

            const match = content.match(/^!slowmode\s+(\d{1,5})\s*$/i);
            if (!match) {
                const usage = await message.reply('Format: `!slowmode <detik>` (0-21600)');
                setTimeout(() => usage.delete().catch(() => { }), 8000);
                return;
            }

            let seconds = parseInt(match[1], 10);
            if (Number.isNaN(seconds)) return;
            if (seconds < 0) seconds = 0;
            if (seconds > 21600) seconds = 21600;

            try {
                if (!message.channel.isTextBased() || typeof message.channel.setRateLimitPerUser !== 'function') {
                    const reply = await message.reply('❌ Command ini hanya bisa dipakai di text channel.');
                    setTimeout(() => reply.delete().catch(() => { }), 8000);
                    return;
                }

                await message.channel.setRateLimitPerUser(seconds, `Set by ${message.author.tag} via !slowmode`);
                const info = await message.channel.send(`🐢 Slowmode diset ke **${seconds}s**.`);
                setTimeout(() => info.delete().catch(() => { }), 5000);
                await message.delete().catch(() => { });
            } catch (err) {
                console.error('slowmode error:', err);
                const reply = await message.reply('❌ Gagal set slowmode. Pastikan bot punya permission **Manage Channels**.');
                setTimeout(() => reply.delete().catch(() => { }), 10000);
            }
            return;
        }

        // !say teks... -> bot re-send as itself (command message deleted)
        if (lower.startsWith('!say')) {
            if (!message.guild) return;
            if (!isStaff()) return;

            const text = content.replace(/^!say\b/i, '').trim();
            if (!text) {
                const usage = await message.reply('Format: `!say <pesan>`');
                setTimeout(() => usage.delete().catch(() => { }), 8000);
                return;
            }

            await message.channel.send({ content: text });
            await message.delete().catch(() => { });
            return;
        }

        // !setlevel @user 10  -> set level (staff-only)
        if (lower.startsWith('!setlevel')) {
            if (!message.guild) return;
            if (!isStaff()) return;

            const parts = content.split(/\s+/);
            const levelStr = parts[2];
            const target = message.mentions.users.first();

            if (!target || !levelStr) {
                const usage = await message.reply('Format: `!setlevel @user <level>` (min 1)');
                setTimeout(() => usage.delete().catch(() => { }), 8000);
                return;
            }

            const { setLevel } = require('../utils/leveling');
            const res = setLevel(target.id, message.guild.id, levelStr, { xp: 0 });
            if (!res.success) {
                const reply = await message.reply('❌ Level tidak valid. Contoh: `!setlevel @user 10`');
                setTimeout(() => reply.delete().catch(() => { }), 8000);
                return;
            }

            const info = await message.channel.send(`✅ Level **${target.username}** diset ke **Level ${res.level}** (XP direset ke ${res.xp}).`);
            setTimeout(() => info.delete().catch(() => { }), 8000);
            await message.delete().catch(() => { });
            return;
        }

        // !setxp @user 1234 -> set XP (staff-only)
        if (lower.startsWith('!setxp')) {
            if (!message.guild) return;
            if (!isStaff()) return;

            const parts = content.split(/\s+/);
            const xpStr = parts[2];
            const target = message.mentions.users.first();

            if (!target || xpStr === undefined) {
                const usage = await message.reply('Format: `!setxp @user <xp>` (min 0)');
                setTimeout(() => usage.delete().catch(() => { }), 8000);
                return;
            }

            const { setXp } = require('../utils/leveling');
            const res = setXp(target.id, message.guild.id, xpStr);
            if (!res.success) {
                const reply = await message.reply('❌ XP tidak valid. Contoh: `!setxp @user 1500`');
                setTimeout(() => reply.delete().catch(() => { }), 8000);
                return;
            }

            const info = await message.channel.send(`✅ XP **${target.username}** diset ke **${res.xp} XP** (level saat ini: ${res.level}).`);
            setTimeout(() => info.delete().catch(() => { }), 8000);
            await message.delete().catch(() => { });
            return;
        }

        // !setstreak @user1 @user2 <streak> -> set voice pair streak (staff-only)
        if (lower.startsWith('!setstreak')) {
            if (!message.guild) return;
            if (!isStaff()) return;

            const mentions = message.mentions.users;
            if (mentions.size < 2) {
                const usage = await message.reply('Format: `!setstreak @user1 @user2 <streak>`\nContoh: `!setstreak @user1 @user2 5`');
                setTimeout(() => usage.delete().catch(() => { }), 10000);
                return;
            }

            const users = Array.from(mentions.values()).slice(0, 2);
            const parts = content.split(/\s+/);
            const streakStr = parts.find((part, idx) => idx > 0 && !part.startsWith('<@') && /^\d+$/.test(part));

            if (!streakStr) {
                const usage = await message.reply('Format: `!setstreak @user1 @user2 <streak>`\nContoh: `!setstreak @user1 @user2 5`');
                setTimeout(() => usage.delete().catch(() => { }), 10000);
                return;
            }

            const { setPairStreak } = require('../utils/voicePairStreak');
            const res = setPairStreak(message.guild.id, users[0].id, users[1].id, streakStr);

            if (!res.success) {
                const reply = await message.reply(`❌ ${res.error || 'Gagal set streak'}`);
                setTimeout(() => reply.delete().catch(() => { }), 10000);
                return;
            }

            const info = await message.channel.send(
                `✅ Voice streak **${users[0].username}** x **${users[1].username}** diset ke **${res.streak} hari**.\n` +
                `📅 lastValidDate: \`${res.lastValidDate}\` (akan increment besok jika valid)`
            );
            setTimeout(() => info.delete().catch(() => { }), 10000);
            await message.delete().catch(() => { });
            return;
        }

        // Admin-only: post Ticket Box panel in the current channel
        if (lower === '!ticketbox') {
            if (!message.guild || !message.member) return;

            const isAdmin = message.member.permissions.has(PermissionsBitField.Flags.Administrator);
            if (!isAdmin) return;

            const cfg = require('../config.json');
            const ticketCfg = cfg.ticket || {};
            if (!ticketCfg.categoryId || !ticketCfg.staffRoleId) {
                const reply = await message.reply('⚠️ Ticket belum di-setup. Jalankan `/setup ticket` dulu (kategori + staff role).');
                setTimeout(() => reply.delete().catch(() => { }), 8000);
                return;
            }

            const embed = new EmbedBuilder()
                .setColor(cfg.embedColor || '#00008B')
                .setTitle('🎫 Ticket Box (Ruang BK / TU)')
                .setDescription(
                    'Klik tombol di bawah untuk membuka ticket **private**.\n' +
                    'Gunakan ticket untuk hal-hal seperti: tanya server, minta bantuan staff, partnership, atau lapor masalah.\n\n' +
                    '**Pilihan:**\n- 🧑‍🏫 BK (Curhat/konflik)\n- 🧾 TU (Pertanyaan server)\n- 🚨 Lapor (Report)\n- 🤝 Partnership\n- 💡 Saran/Masukan (isi form, otomatis masuk kotak saran)'
                )
                .setFooter({ text: 'Tiket bersifat private (hanya kamu + staff).' });

            const row1 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('ticket_open_bk').setLabel('BK').setStyle(ButtonStyle.Primary).setEmoji('🧑‍🏫'),
                new ButtonBuilder().setCustomId('ticket_open_tu').setLabel('TU').setStyle(ButtonStyle.Secondary).setEmoji('🧾'),
                new ButtonBuilder().setCustomId('ticket_open_report').setLabel('Lapor').setStyle(ButtonStyle.Danger).setEmoji('🚨'),
                new ButtonBuilder().setCustomId('ticket_open_partnership').setLabel('Partnership').setStyle(ButtonStyle.Success).setEmoji('🤝'),
                new ButtonBuilder().setCustomId('ticket_open_appeal').setLabel('Banding').setStyle(ButtonStyle.Secondary).setEmoji('🧑‍⚖️'),
            );

            const row2 = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sug_create').setLabel('Saran/Masukan').setStyle(ButtonStyle.Primary).setEmoji('💡'),
                new ButtonBuilder().setCustomId('ticket_open_verify_female').setLabel('Verifikasi Cewek').setStyle(ButtonStyle.Secondary).setEmoji('🎀'),
            );

            await message.channel.send({ embeds: [embed], components: [row1, row2] });
            await message.delete().catch(() => { });
            return;
        }

        // User: create suggestion via message command
        // Format: !saran Judul | Isi saran...
        // Optional: !saran --anon Judul | Isi...
        if (lower.startsWith('!saran')) {
            if (!message.guild) return;

            const cfg = require('../config.json');
            const sugCfg = cfg.suggestions || {};
            if (!sugCfg.channelId) {
                const reply = await message.reply('⚠️ Kotak saran belum di-setup. Admin bisa set lewat `/setup suggestion`.');
                setTimeout(() => reply.delete().catch(() => { }), 8000);
                return;
            }

            const isAnon = /\s--anon(\s|$)/i.test(content);
            const withoutCommand = content.replace(/^!saran\b/i, '').replace(/\s--anon\b/i, '').trim();
            const parts = withoutCommand.split('|').map(s => s.trim()).filter(Boolean);

            if (parts.length < 2) {
                const usage = await message.reply('Format: `!saran Judul | Isi saran...` (opsional anonim: `!saran --anon Judul | Isi...`)');
                setTimeout(() => usage.delete().catch(() => { }), 10000);
                return;
            }

            const title = parts[0].slice(0, 120);
            const body = parts.slice(1).join(' | ').slice(0, 3500);

            const targetChannel = message.guild.channels.cache.get(sugCfg.channelId);
            if (!targetChannel || !targetChannel.isTextBased()) {
                const reply = await message.reply('⚠️ Channel kotak saran tidak ditemukan. Admin: cek `/setup show`.');
                setTimeout(() => reply.delete().catch(() => { }), 10000);
                return;
            }

            const displayName = isAnon ? 'Seseorang' : message.author.username;
            const avatar = isAnon ? 'https://i.imgur.com/pBxtF1p.png' : message.author.displayAvatarURL();

            const embed = new EmbedBuilder()
                .setColor('#f1c40f')
                .setAuthor({ name: `Saran dari: ${displayName}`, iconURL: avatar })
                .setTitle(`💡 ${title}`)
                .setDescription(body)
                .addFields(
                    { name: 'Status', value: '🟡 Dipertimbangkan', inline: true },
                    { name: 'Vote', value: '👍 0 | 👎 0', inline: true },
                )
                .setTimestamp();

            const voteRow = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('sug_up').setLabel('Upvote').setStyle(ButtonStyle.Success).setEmoji('👍'),
                new ButtonBuilder().setCustomId('sug_down').setLabel('Downvote').setStyle(ButtonStyle.Danger).setEmoji('👎'),
            );

            // Staff-only status menu will be attached; interaction handler will enforce perms.
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
                authorId: message.author.id,
                anonymous: isAnon,
                title,
                body,
                status: 'considering',
                upvotes: [],
                downvotes: [],
                createdAt: Date.now(),
            });

            const confirm = await message.reply(`✅ Saran kamu sudah dikirim ke <#${sent.channel.id}>.`);
            setTimeout(() => confirm.delete().catch(() => { }), 8000);
            await message.delete().catch(() => { });
            return;
        }
    },
};

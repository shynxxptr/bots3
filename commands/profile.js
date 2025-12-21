const { SlashCommandBuilder, AttachmentBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { getCustomization, saveCustomization, getUserRole, resetCustomization } = require('../utils/profileCustomization');
const { getUserAchievements, getAllAchievements } = require('../utils/achievements');
const { getUserRank } = require('../utils/leveling');
const { getVoiceTime } = require('../utils/voiceTime');
const { getReputation } = require('../utils/reputation');
const { getMessageCount } = require('../utils/messageCount');
const { getStreak } = require('../utils/leveling');
const { getTopPairsForUser } = require('../utils/voicePairStreak');
const { getQuotesByAuthor } = require('../utils/quote');
const { generateProfileCard } = require('../utils/profileCardRenderer');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('profile')
        .setDescription('Profile card customization & management')
        .addSubcommand(subcommand =>
            subcommand
                .setName('preview')
                .setDescription('Preview profile card kamu')
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('User yang ingin di-preview')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('customize')
                .setDescription('Customize profile card kamu'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('compare')
                .setDescription('Bandingkan 2 profile card')
                .addUserOption(option =>
                    option.setName('user1')
                        .setDescription('User pertama')
                        .setRequired(true))
                .addUserOption(option =>
                    option.setName('user2')
                        .setDescription('User kedua')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset customization ke default'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('Lihat info customization kamu'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('bio')
                .setDescription('Set atau lihat bio')
                .addStringOption(option =>
                    option.setName('action')
                        .setDescription('Action')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Set', value: 'set' },
                            { name: 'View', value: 'view' },
                            { name: 'Clear', value: 'clear' }
                        ))
                .addStringOption(option =>
                    option.setName('text')
                        .setDescription('Bio text (untuk set)')
                        .setRequired(false))
                .addUserOption(option =>
                    option.setName('target')
                        .setDescription('User yang ingin dilihat bio-nya (untuk view)')
                        .setRequired(false))),
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        
        if (subcommand === 'preview') {
            await handlePreview(interaction);
        } else if (subcommand === 'customize') {
            await handleCustomize(interaction);
        } else if (subcommand === 'compare') {
            await handleCompare(interaction);
        } else if (subcommand === 'reset') {
            await handleReset(interaction);
        } else if (subcommand === 'info') {
            await handleInfo(interaction);
        } else if (subcommand === 'bio') {
            await handleBio(interaction);
        }
    }
};

async function handlePreview(interaction) {
    await interaction.deferReply();
    
    const target = interaction.options.getUser('target') || interaction.user;
    const member = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(() => null);
    
    try {
        // Get customization
        const customization = getCustomization(interaction.guild.id, target.id, member);
        
        // Get rank data
        const rankData = getUserRank(target.id, interaction.guild.id);
        if (!rankData) {
            return interaction.editReply(`${target.username} belum memiliki XP.`);
        }
        
        // Get achievements
        const achievementsData = getUserAchievements(target.id, interaction.guild.id);
        const allAchievements = getAllAchievements();
        const enabledAchievements = achievementsData.unlocked
            .filter(a => a && a.id && customization.badges.enabled.includes(a.id))
            .map(a => allAchievements[a.id])
            .filter(Boolean);
        
        // Get stats
        const voiceTime = getVoiceTime(interaction.guild.id, target.id);
        const rep = getReputation(interaction.guild.id, target.id);
        const msgCount = getMessageCount(interaction.guild.id, target.id);
        const streak = getStreak(target.id, interaction.guild.id);
        const topPairs = getTopPairsForUser(interaction.guild.id, target.id, 1);
        const quotes = getQuotesByAuthor(interaction.guild.id, target.id, 1000);
        
        const stats = {
            voice_time: voiceTime ? voiceTime.totalSeconds : 0,
            messages: msgCount ? msgCount.messageCount : 0,
            prestasi: rep ? rep.totalRep : 0,
            quotes: quotes ? quotes.length : 0,
            streak: streak ? streak.streak : 0,
            voice_streak: topPairs.length > 0 ? (topPairs[0].streak || 0) : 0
        };
        
        // Generate card
        const cardBuffer = await generateProfileCard(target, member, customization, rankData, enabledAchievements, stats);
        const attachment = new AttachmentBuilder(cardBuffer, { name: 'profile-card.png' });
        
        await interaction.editReply({ files: [attachment] });
    } catch (error) {
        console.error('Error generating profile card:', error);
        await interaction.editReply('❌ Terjadi error saat generate profile card. Coba lagi nanti.');
    }
}

async function handleCustomize(interaction) {
    const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
    const role = getUserRole(interaction.guild.id, interaction.user.id, member);
    
    const { getAllTemplates } = require('../utils/profileTemplates');
    const { getAvailableFrames } = require('../utils/profileCustomization');
    const { getUserAchievements } = require('../utils/achievements');
    
    const achievementsData = getUserAchievements(interaction.user.id, interaction.guild.id);
    const availableTemplates = getAllTemplates(role);
    const availableFrames = getAvailableFrames(role);
    
    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🎨 Profile Customization')
        .setDescription('Pilih opsi di bawah untuk customize profile card kamu!')
        .addFields(
            { name: '📋 Current Settings', value: `Template: ${customization.template || 'classic'}\nFrame: ${customization.frame?.value || 'frame_basic.png'}\nBadges: ${customization.badges.enabled.length}/${customization.badges.maxDisplay}\nBio: ${customization.bio ? '✅ Set' : '❌ Not set'}`, inline: false },
            { name: '👤 Role', value: role === 'free' ? '🆓 Free' : role === 'premium' ? '⭐ Premium' : '👑 Staff', inline: true },
            { name: '📐 Resolution', value: customization.layout.resolution || '1280x720', inline: true }
        )
        .setFooter({ text: 'Gunakan buttons di bawah untuk customize' });
    
    const templateSelect = new StringSelectMenuBuilder()
        .setCustomId('profile_customize_template')
        .setPlaceholder('Pilih Template')
        .addOptions(
            availableTemplates.slice(0, 25).map(t => ({
                label: t.name,
                description: t.description,
                value: t.id,
                emoji: t.premium ? '⭐' : '🆓',
                default: t.id === customization.template
            }))
        );
    
    const frameSelect = new StringSelectMenuBuilder()
        .setCustomId('profile_customize_frame')
        .setPlaceholder('Pilih Frame')
        .addOptions(
            availableFrames.slice(0, 25).map(f => ({
                label: f.replace('.png', '').replace('frame_', '').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                value: f,
                default: f === customization.frame?.value
            }))
        );
    
    // Badge selection (only unlocked achievements)
    const unlockedAchievements = achievementsData.unlocked || [];
    const badgeSelect = new StringSelectMenuBuilder()
        .setCustomId('profile_customize_badges')
        .setPlaceholder(`Pilih Badges (Max ${customization.badges.maxDisplay})`)
        .setMinValues(0)
        .setMaxValues(Math.min(customization.badges.maxDisplay, unlockedAchievements.length))
        .addOptions(
            unlockedAchievements.slice(0, 25).map(a => ({
                label: a.name,
                description: a.description,
                value: a.id,
                emoji: a.emoji,
                default: customization.badges.enabled.includes(a.id)
            }))
        );
    
    const bioButton = new ButtonBuilder()
        .setCustomId('profile_customize_bio')
        .setLabel('Set Bio')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📝');
    
    const previewButton = new ButtonBuilder()
        .setCustomId('profile_customize_preview')
        .setLabel('Preview')
        .setStyle(ButtonStyle.Success)
        .setEmoji('👁️');
    
    const resetButton = new ButtonBuilder()
        .setCustomId('profile_customize_reset')
        .setLabel('Reset')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔄');
    
    const actionRow1 = new ActionRowBuilder().addComponents(templateSelect);
    const actionRow2 = new ActionRowBuilder().addComponents(frameSelect);
    const actionRow3 = new ActionRowBuilder().addComponents(badgeSelect);
    const actionRow4 = new ActionRowBuilder().addComponents(bioButton, previewButton, resetButton);
    
    await interaction.reply({
        embeds: [embed],
        components: [actionRow1, actionRow2, actionRow3, actionRow4],
        ephemeral: true
    });
}

async function handleCompare(interaction) {
    await interaction.deferReply();
    
    const user1 = interaction.options.getUser('user1');
    const user2 = interaction.options.getUser('user2');
    
    try {
        const member1 = interaction.guild.members.cache.get(user1.id) || await interaction.guild.members.fetch(user1.id).catch(() => null);
        const member2 = interaction.guild.members.cache.get(user2.id) || await interaction.guild.members.fetch(user2.id).catch(() => null);
        
        // Get customization for both
        const custom1 = getCustomization(interaction.guild.id, user1.id, member1);
        const custom2 = getCustomization(interaction.guild.id, user2.id, member2);
        
        // Get rank data
        const rank1 = getUserRank(user1.id, interaction.guild.id);
        const rank2 = getUserRank(user2.id, interaction.guild.id);
        
        // Get stats
        const voiceTime1 = getVoiceTime(interaction.guild.id, user1.id);
        const voiceTime2 = getVoiceTime(interaction.guild.id, user2.id);
        const rep1 = getReputation(interaction.guild.id, user1.id);
        const rep2 = getReputation(interaction.guild.id, user2.id);
        const achievements1 = getUserAchievements(user1.id, interaction.guild.id);
        const achievements2 = getUserAchievements(user2.id, interaction.guild.id);
        
        // Generate both cards
        const stats1 = {
            voice_time: voiceTime1 ? voiceTime1.totalSeconds : 0,
            messages: 0,
            prestasi: rep1 ? rep1.totalRep : 0,
            quotes: 0,
            streak: 0,
            voice_streak: 0
        };
        const stats2 = {
            voice_time: voiceTime2 ? voiceTime2.totalSeconds : 0,
            messages: 0,
            prestasi: rep2 ? rep2.totalRep : 0,
            quotes: 0,
            streak: 0,
            voice_streak: 0
        };
        
        const allAchievements = getAllAchievements();
        const enabled1 = achievements1.unlocked.filter(a => custom1.badges.enabled.includes(a.id)).map(a => allAchievements[a.id]).filter(Boolean);
        const enabled2 = achievements2.unlocked.filter(a => custom2.badges.enabled.includes(a.id)).map(a => allAchievements[a.id]).filter(Boolean);
        
        const card1 = await generateProfileCard(user1, member1, custom1, rank1, enabled1, stats1);
        const card2 = await generateProfileCard(user2, member2, custom2, rank2, enabled2, stats2);
        
        const attachment1 = new AttachmentBuilder(card1, { name: 'profile-card-1.png' });
        const attachment2 = new AttachmentBuilder(card2, { name: 'profile-card-2.png' });
        
        // Comparison stats
        const voiceHours1 = voiceTime1 ? Math.floor(voiceTime1.totalSeconds / 3600) : 0;
        const voiceHours2 = voiceTime2 ? Math.floor(voiceTime2.totalSeconds / 3600) : 0;
        const rep1Val = rep1 ? rep1.totalRep : 0;
        const rep2Val = rep2 ? rep2.totalRep : 0;
        const achievements1Count = achievements1.unlocked.length;
        const achievements2Count = achievements2.unlocked.length;
        const level1 = rank1 ? rank1.level : 0;
        const level2 = rank2 ? rank2.level : 0;
        
        // Determine winner
        const getWinner = (val1, val2) => {
            if (val1 > val2) return '🟢';
            if (val2 > val1) return '🔴';
            return '⚪';
        };
        
        const comparisonText = 
            `📊 **Comparison Stats:**\n` +
            `Voice Time: ${voiceHours1}j ${getWinner(voiceHours1, voiceHours2)} vs ${voiceHours2}j ${getWinner(voiceHours2, voiceHours1)} ${voiceHours1 !== voiceHours2 ? `(${voiceHours1 > voiceHours2 ? '+' : ''}${voiceHours1 - voiceHours2}j)` : ''}\n` +
            `Prestasi: ${rep1Val} ${getWinner(rep1Val, rep2Val)} vs ${rep2Val} ${getWinner(rep2Val, rep1Val)} ${rep1Val !== rep2Val ? `(${rep1Val > rep2Val ? '+' : ''}${rep1Val - rep2Val})` : ''}\n` +
            `Achievements: ${achievements1Count} ${getWinner(achievements1Count, achievements2Count)} vs ${achievements2Count} ${getWinner(achievements2Count, achievements1Count)} ${achievements1Count !== achievements2Count ? `(${achievements1Count > achievements2Count ? '+' : ''}${achievements1Count - achievements2Count})` : ''}\n` +
            `Level: ${level1} ${getWinner(level1, level2)} vs ${level2} ${getWinner(level2, level1)} ${level1 !== level2 ? `(${level1 > level2 ? '+' : ''}${level1 - level2})` : ''}`;
        
        await interaction.editReply({
            content: comparisonText,
            files: [attachment1, attachment2]
        });
    } catch (error) {
        console.error('Error in profile compare:', error);
        await interaction.editReply('❌ Terjadi error saat compare profile. Coba lagi nanti.');
    }
}

async function handleReset(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    const result = resetCustomization(interaction.guild.id, interaction.user.id, member);
    
    if (result.success) {
        await interaction.editReply('✅ Customization berhasil di-reset ke default!');
    } else {
        await interaction.editReply('❌ Gagal reset customization.');
    }
}

async function handleInfo(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
    
    const embed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('📋 Profile Customization Info')
        .addFields(
            { name: 'Role', value: customization.role, inline: true },
            { name: 'Template', value: customization.template || 'classic', inline: true },
            { name: 'Resolution', value: customization.layout.resolution || '1280x720', inline: true },
            { name: 'Background', value: `${customization.background.type}: ${customization.background.value}`, inline: false },
            { name: 'Frame', value: customization.frame.value || 'frame_basic.png', inline: true },
            { name: 'Badges Enabled', value: `${customization.badges.enabled.length}/${customization.badges.maxDisplay}`, inline: true },
            { name: 'Bio', value: customization.bio || 'Tidak ada', inline: false }
        )
        .setFooter({ text: 'Gunakan /profile customize untuk mengubah' });
    
    await interaction.editReply({ embeds: [embed] });
}

async function handleBio(interaction) {
    const action = interaction.options.getString('action');
    
    if (action === 'set') {
        const text = interaction.options.getString('text');
        if (!text) {
            return interaction.reply({
                content: '❌ Mohon isi bio text!',
                ephemeral: true
            });
        }
        
        if (text.length > 200) {
            return interaction.reply({
                content: '❌ Bio terlalu panjang! Maksimal 200 karakter.',
                ephemeral: true
            });
        }
        
        const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
        
        customization.bio = text;
        saveCustomization(interaction.guild.id, interaction.user.id, customization);
        
        await interaction.reply({
            content: `✅ Bio berhasil di-set!\n"${text}"`,
            ephemeral: true
        });
    } else if (action === 'view') {
        const target = interaction.options.getUser('target') || interaction.user;
        const member = interaction.guild.members.cache.get(target.id) || await interaction.guild.members.fetch(target.id).catch(() => null);
        const customization = getCustomization(interaction.guild.id, target.id, member);
        
        if (!customization.bio) {
            return interaction.reply({
                content: `${target.id === interaction.user.id ? 'Kamu' : target.username} belum punya bio.`,
                ephemeral: true
            });
        }
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`📝 Bio ${target.username}`)
            .setDescription(`"${customization.bio}"`)
            .setThumbnail(target.displayAvatarURL());
        
        await interaction.reply({ embeds: [embed], ephemeral: true });
    } else if (action === 'clear') {
        const member = interaction.guild.members.cache.get(interaction.user.id) || await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
        const customization = getCustomization(interaction.guild.id, interaction.user.id, member);
        
        customization.bio = '';
        saveCustomization(interaction.guild.id, interaction.user.id, customization);
        
        await interaction.reply({
            content: '✅ Bio berhasil di-clear!',
            ephemeral: true
        });
    }
}


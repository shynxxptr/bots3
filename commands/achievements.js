const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getUserAchievements, getAllAchievements, getAchievementsByCategory } = require('../utils/achievements');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('achievements')
        .setDescription('Lihat achievements kamu atau user lain')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('User yang ingin dilihat achievements-nya')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('category')
                .setDescription('Filter by category')
                .setRequired(false)
                .addChoices(
                    { name: 'Voice', value: 'voice' },
                    { name: 'Reputation', value: 'reputation' },
                    { name: 'Streak', value: 'streak' },
                    { name: 'Quote', value: 'quote' },
                    { name: 'Message', value: 'message' },
                    { name: 'Voice Streak', value: 'voice_streak' }
                )),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const target = interaction.options.getUser('target') || interaction.user;
        const category = interaction.options.getString('category');
        
        const achievementsData = getUserAchievements(interaction.guild.id, target.id);
        const allAchievements = getAllAchievements();
        
        // Filter by category if specified
        let displayAchievements = category 
            ? achievementsData.byCategory[category] || { unlocked: [], locked: [] }
            : { unlocked: achievementsData.unlocked, locked: achievementsData.locked };
        
        const unlocked = displayAchievements.unlocked || [];
        const locked = displayAchievements.locked || [];
        
        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`🏆 Achievements - ${target.username}`)
            .setThumbnail(target.displayAvatarURL())
            .setDescription(
                `**Unlocked:** ${unlocked.length}\n` +
                `**Locked:** ${locked.length}\n` +
                `**Total Progress:** ${unlocked.length}/${unlocked.length + locked.length}`
            );
        
        // Add unlocked achievements
        if (unlocked.length > 0) {
            const unlockedText = unlocked
                .slice(0, 10)
                .map(a => `${a.emoji} **${a.name}** - ${a.description}`)
                .join('\n');
            
            embed.addFields({
                name: `✅ Unlocked (${unlocked.length})`,
                value: unlockedText + (unlocked.length > 10 ? `\n*...dan ${unlocked.length - 10} lainnya*` : ''),
                inline: false
            });
        }
        
        // Add locked achievements (with progress)
        if (locked.length > 0) {
            const lockedText = locked
                .slice(0, 10)
                .map(a => {
                    const progress = a.progress || 0;
                    const total = a.total || 0;
                    const percent = total > 0 ? Math.floor((progress / total) * 100) : 0;
                    return `🔒 **${a.name}** - ${a.description}\n   └ Progress: ${progress}/${total} (${percent}%)`;
                })
                .join('\n\n');
            
            embed.addFields({
                name: `🔒 Locked (${locked.length})`,
                value: lockedText + (locked.length > 10 ? `\n*...dan ${locked.length - 10} lainnya*` : ''),
                inline: false
            });
        }
        
        if (unlocked.length === 0 && locked.length === 0) {
            embed.setDescription('Tidak ada achievements yang ditemukan.');
        }
        
        // Add footer
        if (category) {
            embed.setFooter({ text: `Filtered by: ${category}` });
        }
        
        await interaction.editReply({ embeds: [embed] });
    }
};


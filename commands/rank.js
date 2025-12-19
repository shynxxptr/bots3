const { SlashCommandBuilder, AttachmentBuilder } = require('discord.js');
const Canvas = require('canvas');
const path = require('path');
const { getUserRank } = require('../utils/leveling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rank')
        .setDescription('Lihat kartu level kamu atau member lain')
        .addUserOption(option =>
            option.setName('target')
                .setDescription('Member yang ingin dicek')
                .setRequired(false)),
    async execute(interaction) {
        await interaction.deferReply();

        const target = interaction.options.getUser('target') || interaction.user;
        const member = interaction.guild.members.cache.get(target.id);
        const rankData = getUserRank(target.id, interaction.guild.id);

        if (!rankData) {
            return interaction.editReply(`${target.username} belum memiliki XP.`);
        }

        // Create Canvas
        const canvas = Canvas.createCanvas(700, 250);
        const ctx = canvas.getContext('2d');

        // Background
        // Use a simple gradient or load an image if available
        // For now, let's use a nice gradient
        const gradient = ctx.createLinearGradient(0, 0, 700, 250);
        gradient.addColorStop(0, '#2b2d42');
        gradient.addColorStop(1, '#8d99ae');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(20, 20, 660, 210);

        // Avatar
        const avatarURL = target.displayAvatarURL({ extension: 'png', size: 256 });
        const avatar = await Canvas.loadImage(avatarURL);

        // Circular Avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(125, 125, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 45, 45, 160, 160);
        ctx.restore();

        // Text Info
        ctx.fillStyle = '#ffffff';

        // Username
        ctx.font = 'bold 36px sans-serif';
        ctx.fillText(target.username, 230, 80);

        // Rank & Level
        ctx.font = '24px sans-serif';
        ctx.fillText(`Rank #${rankData.rank}`, 230, 120);
        ctx.fillText(`Level ${rankData.level}`, 400, 120);

        // XP Progress Bar
        const xpNeeded = rankData.nextLevelXp;
        const currentXp = rankData.xp;
        const progress = Math.min(currentXp / xpNeeded, 1);

        // Bar Background
        ctx.fillStyle = '#444';
        ctx.fillRect(230, 150, 400, 30);

        // Bar Fill
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(230, 150, 400 * progress, 30);

        // XP Text
        ctx.fillStyle = '#ffffff';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${currentXp} / ${xpNeeded} XP`, 430, 172);

        const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'rank-card.png' });

        await interaction.editReply({ files: [attachment] });
    },
};

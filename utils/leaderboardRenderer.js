const Canvas = require('canvas');
const { AttachmentBuilder } = require('discord.js');
const { getXpForNextLevel } = require('./leveling');

async function generateLeaderboardImage(guild, leaderboardData, page, totalPages) {
    const canvasWidth = 700;
    const itemHeight = 80;
    const padding = 10;
    const headerHeight = 60;
    // Fixed height for 10 items or dynamic? Let's keep it dynamic based on data length (max 10)
    const canvasHeight = headerHeight + (leaderboardData.length * (itemHeight + padding)) + padding;

    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#23272a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Header
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`S3 Leaderboard (Page ${page}/${totalPages})`, 80, 40); // Shift text right

    // Logo
    try {
        const logo = await Canvas.loadImage('./assets/logo.png');
        ctx.drawImage(logo, 20, 10, 50, 50); // Draw logo at top-left
    } catch (err) {
        console.error('Error loading logo:', err);
    }

    // Draw Rows
    for (let i = 0; i < leaderboardData.length; i++) {
        const user = leaderboardData[i];
        const y = headerHeight + (i * (itemHeight + padding));

        // Calculate actual rank based on page
        const rank = ((page - 1) * 10) + (i + 1);

        // Row Background
        ctx.fillStyle = '#2c2f33';
        ctx.fillRect(10, y, canvasWidth - 20, itemHeight);

        // Rank Number & Color
        ctx.font = 'bold 30px sans-serif';
        if (rank === 1) ctx.fillStyle = '#FFD700'; // Gold
        else if (rank === 2) ctx.fillStyle = '#C0C0C0'; // Silver
        else if (rank === 3) ctx.fillStyle = '#CD7F32'; // Bronze
        else ctx.fillStyle = '#ffffff';
        ctx.fillText(`#${rank}`, 30, y + 50);

        // Avatar
        try {
            const member = await guild.members.fetch(user.userId).catch(() => null);
            const avatarURL = member ? member.user.displayAvatarURL({ extension: 'png', size: 128 }) : 'https://cdn.discordapp.com/embed/avatars/0.png';
            const avatar = await Canvas.loadImage(avatarURL);

            ctx.save();
            ctx.beginPath();
            // Rounded Avatar
            const avatarSize = 60;
            const avatarX = 100;
            const avatarY = y + 10;
            const radius = 10; // Rounded corners

            ctx.moveTo(avatarX + radius, avatarY);
            ctx.lineTo(avatarX + avatarSize - radius, avatarY);
            ctx.quadraticCurveTo(avatarX + avatarSize, avatarY, avatarX + avatarSize, avatarY + radius);
            ctx.lineTo(avatarX + avatarSize, avatarY + avatarSize - radius);
            ctx.quadraticCurveTo(avatarX + avatarSize, avatarY + avatarSize, avatarX + avatarSize - radius, avatarY + avatarSize);
            ctx.lineTo(avatarX + radius, avatarY + avatarSize);
            ctx.quadraticCurveTo(avatarX, avatarY + avatarSize, avatarX, avatarY + avatarSize - radius);
            ctx.lineTo(avatarX, avatarY + radius);
            ctx.quadraticCurveTo(avatarX, avatarY, avatarX + radius, avatarY);
            ctx.closePath();
            ctx.clip();

            ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
            ctx.restore();

            // Username
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px sans-serif';
            const username = member ? member.user.username : 'Unknown User';
            ctx.fillText(username, 180, y + 35);

            // Level
            ctx.fillStyle = '#99aab5';
            ctx.font = '20px sans-serif';
            ctx.fillText(`LVL: ${user.level}`, 180, y + 65);

            // XP Progress Bar
            const nextLevelXp = getXpForNextLevel(user.level);
            const progress = Math.min(user.xp / nextLevelXp, 1);

            const barX = 350;
            const barY = y + 45;
            const barWidth = 300;
            const barHeight = 15;

            // Bar Background
            ctx.fillStyle = '#40444b';
            ctx.fillRect(barX, barY, barWidth, barHeight);

            // Bar Fill (Teal/Cyan)
            ctx.fillStyle = '#00b0f4';
            ctx.fillRect(barX, barY, barWidth * progress, barHeight);

            // XP Text
            ctx.fillStyle = '#ffffff';
            ctx.font = '14px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`${user.xp} XP`, barX + barWidth, y + 35);
            ctx.textAlign = 'left'; // Reset

        } catch (err) {
            console.error(`Error drawing row for ${user.userId}:`, err);
        }
    }

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'leaderboard.png' });
}

module.exports = { generateLeaderboardImage };

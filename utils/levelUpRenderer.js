const Canvas = require('canvas');
const { AttachmentBuilder } = require('discord.js');

async function generateLevelUpImage(member, oldLevel, newLevel) {
    const canvasWidth = 400;
    const canvasHeight = 120;

    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Background (Dark rounded rectangle)
    const cornerRadius = 20;
    ctx.fillStyle = '#23272a';

    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(canvasWidth - cornerRadius, 0);
    ctx.quadraticCurveTo(canvasWidth, 0, canvasWidth, cornerRadius);
    ctx.lineTo(canvasWidth, canvasHeight - cornerRadius);
    ctx.quadraticCurveTo(canvasWidth, canvasHeight, canvasWidth - cornerRadius, canvasHeight);
    ctx.lineTo(cornerRadius, canvasHeight);
    ctx.quadraticCurveTo(0, canvasHeight, 0, canvasHeight - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    ctx.fill();

    // Avatar
    try {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await Canvas.loadImage(avatarURL);

        const avatarSize = 80;
        const avatarX = 20;
        const avatarY = 20;
        const avatarRadius = avatarSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch (err) {
        console.error('Error loading avatar for level up:', err);
    }

    // Text "Level-up!"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Level-up!', 250, 55);

    // Text "Old • New"
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`${oldLevel} • ${newLevel}`, 250, 95);

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'levelup.png' });
}

module.exports = { generateLevelUpImage };

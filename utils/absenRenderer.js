const Canvas = require('canvas');
const { AttachmentBuilder } = require('discord.js');

async function generateAbsenImage(member, xpReward) {
    const canvasWidth = 500;
    const canvasHeight = 150;

    const canvas = Canvas.createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    // Background (Dark rounded rectangle with gradient)
    const cornerRadius = 20;
    const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
    gradient.addColorStop(0, '#23272a');
    gradient.addColorStop(1, '#2c2f33');
    ctx.fillStyle = gradient;

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

    // Border (Green for success)
    ctx.strokeStyle = '#43b581';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Avatar
    try {
        const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 128 });
        const avatar = await Canvas.loadImage(avatarURL);

        const avatarSize = 100;
        const avatarX = 25;
        const avatarY = 25;
        const avatarRadius = avatarSize / 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarRadius, avatarY + avatarRadius, avatarRadius, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
    } catch (err) {
        console.error('Error loading avatar for absen:', err);
    }

    // Text "Absen Berhasil!"
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('Absen Berhasil!', 150, 60);

    // Text Reward
    ctx.fillStyle = '#43b581'; // Green text
    ctx.font = 'bold 32px sans-serif';
    ctx.fillText(`+${xpReward} XP`, 150, 105);

    // Date/Time (Optional, small text)
    ctx.fillStyle = '#99aab5';
    ctx.font = '16px sans-serif';
    const date = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
    ctx.fillText(date, 150, 130);

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'absen.png' });
}

module.exports = { generateAbsenImage };

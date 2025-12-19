const Canvas = require('canvas');
const { AttachmentBuilder } = require('discord.js');

function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

function truncateToWidth(ctx, text, maxWidth) {
    if (!text) return '';
    if (ctx.measureText(text).width <= maxWidth) return text;
    let t = text;
    while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) {
        t = t.slice(0, -1);
    }
    return `${t}…`;
}

async function loadAvatar(url) {
    try {
        return await Canvas.loadImage(url);
    } catch (err) {
        console.error('Failed to load avatar:', err);
        return null;
    }
}

function drawAvatarCircle(ctx, img, cx, cy, size) {
    const r = size / 2;
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    if (img) {
        ctx.drawImage(img, cx - r, cy - r, size, size);
    } else {
        ctx.fillStyle = '#2c2f33';
        ctx.fillRect(cx - r, cy - r, size, size);
    }
    ctx.restore();

    // ring
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
    ctx.stroke();
}

function drawPill(ctx, x, y, w, h, r, fillStyle, strokeStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    drawRoundedRect(ctx, x, y, w, h, r);
    ctx.fill();
    if (strokeStyle) {
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
    ctx.restore();
}

function drawSimpleFlame(ctx, cx, cy, size) {
    // stylized flame (vector), size ~ height in px
    const h = size;
    const w = size * 0.75;

    ctx.save();
    ctx.translate(cx, cy);

    // outer flame
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.55);
    ctx.bezierCurveTo(w * 0.45, -h * 0.25, w * 0.55, h * 0.05, 0, h * 0.55);
    ctx.bezierCurveTo(-w * 0.55, h * 0.05, -w * 0.45, -h * 0.25, 0, -h * 0.55);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -h * 0.55, 0, h * 0.55);
    grad.addColorStop(0, '#ff8a00');
    grad.addColorStop(1, '#ff3d00');
    ctx.fillStyle = grad;
    ctx.fill();

    // inner flame
    ctx.beginPath();
    ctx.moveTo(0, -h * 0.28);
    ctx.bezierCurveTo(w * 0.25, -h * 0.10, w * 0.22, h * 0.12, 0, h * 0.30);
    ctx.bezierCurveTo(-w * 0.22, h * 0.12, -w * 0.25, -h * 0.10, 0, -h * 0.28);
    ctx.closePath();
    const grad2 = ctx.createLinearGradient(0, -h * 0.28, 0, h * 0.30);
    grad2.addColorStop(0, '#ffe082');
    grad2.addColorStop(1, '#ffb300');
    ctx.fillStyle = grad2;
    ctx.fill();

    ctx.restore();
}

async function generateVoicePairStreakCard({ leftUser, rightUser, streak, cardConfig = {} }) {
    const width = 900;
    const height = 300;
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background: cheerful classroom vibe (sky -> warm)
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#b9ecff'); // sky blue
    bg.addColorStop(0.55, '#fff3c7'); // warm light
    bg.addColorStop(1, '#ffe7b1');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // confetti dots (cheerful)
    const confettiColors = ['rgba(255,64,129,0.35)', 'rgba(0,200,83,0.30)', 'rgba(41,121,255,0.30)', 'rgba(255,171,0,0.30)'];
    for (let i = 0; i < 110; i++) {
        ctx.fillStyle = confettiColors[i % confettiColors.length];
        const x = (i * 73) % width;
        const y = (i * 41) % height;
        const r = 1.5 + (i % 3);
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Main board (chalkboard) with frame
    const boardX = 30;
    const boardY = 30;
    const boardW = width - 60;
    const boardH = height - 60;

    // frame
    drawRoundedRect(ctx, boardX - 6, boardY - 6, boardW + 12, boardH + 12, 28);
    ctx.fillStyle = '#b97a3d'; // wood
    ctx.fill();

    // board
    drawRoundedRect(ctx, boardX, boardY, boardW, boardH, 24);
    const boardGrad = ctx.createLinearGradient(0, boardY, 0, boardY + boardH);
    boardGrad.addColorStop(0, '#0a4d3b');
    boardGrad.addColorStop(1, '#083a2d');
    ctx.fillStyle = boardGrad;
    ctx.fill();

    // chalk dust on board
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    for (let i = 0; i < 180; i++) {
        const x = boardX + (i * 59) % boardW;
        const y = boardY + (i * 37) % boardH;
        const r = (i % 5) * 0.6;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
    }

    // Header pill
    drawPill(ctx, boardX + 18, boardY + 14, 360, 34, 18, 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.10)');
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Sekolah Suka Suka • Voice Streak', boardX + 32, boardY + 38);

    // Avatars - use Discord profile avatar (member avatar if available, otherwise user avatar)
    const leftAvatarUrl = leftUser.displayAvatarURL({ extension: 'png', size: 256, forceStatic: false });
    const rightAvatarUrl = rightUser.displayAvatarURL({ extension: 'png', size: 256, forceStatic: false });
    const [leftImg, rightImg] = await Promise.all([
        loadAvatar(leftAvatarUrl).catch(() => null),
        loadAvatar(rightAvatarUrl).catch(() => null)
    ]);

    // Smaller avatars + more breathing room
    const avatarSize = Number(cardConfig.avatarSize ?? 116);
    const leftCx = Number(cardConfig.leftAvatarX ?? (boardX + 130));
    const rightCx = Number(cardConfig.rightAvatarX ?? (boardX + boardW - 130));
    const avatarCy = Number(cardConfig.avatarY ?? (boardY + 142));

    drawAvatarCircle(ctx, leftImg, leftCx, avatarCy, avatarSize);
    drawAvatarCircle(ctx, rightImg, rightCx, avatarCy, avatarSize);

    // Names - use display name (nickname/global name) or fallback to username
    ctx.textAlign = 'center';
    ctx.font = 'bold 22px sans-serif';
    const nameMax = 200;
    const leftDisplayName = leftUser.displayName || leftUser.globalName || leftUser.username;
    const rightDisplayName = rightUser.displayName || rightUser.globalName || rightUser.username;
    const leftName = truncateToWidth(ctx, leftDisplayName, nameMax);
    const rightName = truncateToWidth(ctx, rightDisplayName, nameMax);

    // Put name pills clearly below avatars (no overlap)
    const namePillW = 260;
    const namePillH = 34;
    const namePillY = Number(cardConfig.namePillY ?? (boardY + boardH - 58));
    drawPill(ctx, leftCx - namePillW / 2, namePillY, namePillW, namePillH, 16, 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.10)');
    drawPill(ctx, rightCx - namePillW / 2, namePillY, namePillW, namePillH, 16, 'rgba(255,255,255,0.14)', 'rgba(255,255,255,0.10)');
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fillText(leftName, leftCx, namePillY + 24);
    ctx.fillText(rightName, rightCx, namePillY + 24);

    // Center flame + streak number
    const centerX = boardX + boardW / 2;
    const flameY = Number(cardConfig.flameY ?? (boardY + 122));
    const flameSize = Number(cardConfig.flameSize ?? 82);
    drawSimpleFlame(ctx, centerX, flameY, flameSize);

    // Number with shadow
    ctx.textAlign = 'center';
    const numberFontSize = Number(cardConfig.numberFontSize ?? 76);
    ctx.font = `bold ${numberFontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    const numberY = Number(cardConfig.numberY ?? (boardY + 218));
    ctx.fillText(String(streak), centerX + 2, numberY + 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(streak), centerX, numberY);

    // "hari" label (smaller, below number)
    const labelFontSize = Number(cardConfig.labelFontSize ?? 22);
    ctx.font = `bold ${labelFontSize}px sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const labelY = Number(cardConfig.labelY ?? (boardY + 246));
    ctx.fillText('hari', centerX, labelY);

    // Footer removed (requested)

    return new AttachmentBuilder(canvas.toBuffer(), { name: 'voice-streak.png' });
}

module.exports = { generateVoicePairStreakCard };



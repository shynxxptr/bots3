/**
 * CONTOH KODE: Cara Mengganti Icon dengan File Gambar
 * 
 * Copy-paste fungsi-fungsi ini untuk mengganti icon yang ada di profileCardRenderer.js
 * 
 * CATATAN: Pastikan folder assets/icons/ sudah ada dan berisi file icon Anda
 */

const path = require('path');
const Canvas = require('canvas');

// ============================================
// 1. DRAW STATS ICON (20px) - Title "Stats"
// ============================================
async function drawStatsIcon(ctx, x, y, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_stats.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(iconImage, 0, 0, size, size);
        ctx.restore();
    } catch (err) {
        console.error('Error loading stats icon:', err);
        // Fallback: draw simple bar chart
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.translate(x, y);
        const barWidth = size * 0.2;
        const spacing = size * 0.15;
        ctx.fillRect(0, size * 0.6, barWidth, size * 0.4);
        ctx.fillRect(barWidth + spacing, size * 0.3, barWidth, size * 0.7);
        ctx.fillRect((barWidth + spacing) * 2, size * 0.4, barWidth, size * 0.6);
        ctx.fillRect((barWidth + spacing) * 3, size * 0.1, barWidth, size * 0.9);
        ctx.restore();
    }
}

// ============================================
// 2. DRAW TROPHY ICON (20px) - Title "Achievements"
// ============================================
async function drawTrophyIcon(ctx, x, y, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_trophy.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        ctx.save();
        ctx.translate(x, y);
        ctx.drawImage(iconImage, 0, 0, size, size);
        ctx.restore();
    } catch (err) {
        console.error('Error loading trophy icon:', err);
        // Fallback: draw simple trophy shape
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.translate(x, y);
        const scale = size / 24;
        ctx.fillRect(-6 * scale, 8 * scale, 12 * scale, 2 * scale);
        ctx.beginPath();
        ctx.moveTo(-4 * scale, 8 * scale);
        ctx.lineTo(-6 * scale, -4 * scale);
        ctx.lineTo(-2 * scale, -6 * scale);
        ctx.lineTo(-2 * scale, 2 * scale);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }
}

// ============================================
// 3. DRAW STAT ICON (24px) - Main function untuk stat icons
// ============================================
async function drawStatIcon(ctx, statId, x, y, size) {
    ctx.save();
    ctx.translate(x + size / 2, y + size / 2);
    
    try {
        switch (statId) {
            case 'voice_time':
            case 'voice_streak':
                await drawMicrophoneIcon(ctx, size);
                break;
            case 'messages':
                await drawMessageIcon(ctx, size);
                break;
            case 'prestasi':
                await drawStarIcon(ctx, size);
                break;
            case 'quotes':
                await drawQuoteIcon(ctx, size);
                break;
            case 'streak':
                await drawFireIcon(ctx, size);
                break;
            default:
                await drawDefaultIcon(ctx, size);
        }
    } catch (err) {
        console.error(`Error drawing icon for ${statId}:`, err);
        // Fallback to default
        await drawDefaultIcon(ctx, size);
    }
    
    ctx.restore();
}

// ============================================
// 4. DRAW MICROPHONE ICON (24px)
// ============================================
async function drawMicrophoneIcon(ctx, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_microphone.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        const iconX = -size / 2;
        const iconY = -size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error('Error loading microphone icon:', err);
        // Fallback: simple rectangle
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(-size/4, -size/2, size/2, size);
    }
}

// ============================================
// 5. DRAW MESSAGE ICON (24px)
// ============================================
async function drawMessageIcon(ctx, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_message.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        const iconX = -size / 2;
        const iconY = -size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error('Error loading message icon:', err);
        // Fallback: simple bubble
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, size/2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// 6. DRAW STAR ICON (24px)
// ============================================
async function drawStarIcon(ctx, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_star.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        const iconX = -size / 2;
        const iconY = -size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error('Error loading star icon:', err);
        // Fallback: simple star
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = size / 3;
        const innerRadius = size / 6;
        let rot = Math.PI / 2 * 3;
        ctx.moveTo(0, -outerRadius);
        for (let i = 0; i < spikes; i++) {
            ctx.lineTo(Math.cos(rot) * outerRadius, Math.sin(rot) * outerRadius);
            rot += Math.PI / spikes;
            ctx.lineTo(Math.cos(rot) * innerRadius, Math.sin(rot) * innerRadius);
            rot += Math.PI / spikes;
        }
        ctx.closePath();
        ctx.fill();
    }
}

// ============================================
// 7. DRAW QUOTE ICON (24px)
// ============================================
async function drawQuoteIcon(ctx, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_quote.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        const iconX = -size / 2;
        const iconY = -size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error('Error loading quote icon:', err);
        // Fallback: simple circles
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(-size/4, -size/4, size/8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(size/4, -size/4, size/8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// 8. DRAW FIRE ICON (24px)
// ============================================
async function drawFireIcon(ctx, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_fire.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        const iconX = -size / 2;
        const iconY = -size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error('Error loading fire icon:', err);
        // Fallback: simple flame shape
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.moveTo(0, size/2);
        ctx.quadraticCurveTo(-size/4, 0, -size/3, -size/3);
        ctx.quadraticCurveTo(-size/6, -size/6, 0, -size/2);
        ctx.quadraticCurveTo(size/6, -size/6, size/3, -size/3);
        ctx.quadraticCurveTo(size/4, 0, 0, size/2);
        ctx.closePath();
        ctx.fill();
    }
}

// ============================================
// 9. DRAW DEFAULT ICON (24px)
// ============================================
async function drawDefaultIcon(ctx, size) {
    try {
        const iconPath = path.join(__dirname, '../assets/icons/icon_default.png');
        const iconImage = await Canvas.loadImage(iconPath);
        
        const iconX = -size / 2;
        const iconY = -size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error('Error loading default icon:', err);
        // Fallback: simple circle
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, size/3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ============================================
// PENTING: Fungsi yang Memanggil Juga Harus Async
// ============================================

// Contoh modifikasi di drawStatsSidebar:
/*
async function drawStatsSidebar(ctx, stats, customization, width, height) {
    // ... existing code ...
    
    // Draw stats icon - SEKARANG ASYNC
    await drawStatsIcon(ctx, sidebarX + 20, sidebarY + 20, 20);
    ctx.fillText('Stats', sidebarX + 50, sidebarY + 40);
    
    // ... existing code ...
    
    // Di loop, SEKARANG ASYNC
    for (const statId of customization.stats.enabled) {
        // ... existing code ...
        
        await drawStatIcon(ctx, statId, iconX, iconY, iconSize);
        ctx.restore();
        
        // ... existing code ...
    }
}
*/

// Contoh modifikasi di drawBadgesEnhanced:
/*
async function drawBadgesEnhanced(ctx, achievements, customization, x, y, maxWidth) {
    // ... existing code ...
    
    // Draw trophy icon - SEKARANG ASYNC
    await drawTrophyIcon(ctx, x, y - 40, 20);
    ctx.fillText('Achievements', x + 30, y - 20);
    
    // ... existing code ...
}
*/

// Dan generateProfileCard sudah async, jadi tidak perlu perubahan:
// await drawStatsSidebar(...)
// await drawBadgesEnhanced(...)




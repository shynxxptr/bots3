/**
 * CONTOH KODE: Cara Mengganti Achievement Icon dengan File Gambar
 * 
 * Modifikasi di drawBadgesEnhanced() function di profileCardRenderer.js
 * 
 * Baris ~484: Ganti ctx.fillText(badge.emoji || '★', ...) dengan load image
 */

const path = require('path');
const Canvas = require('canvas');

/**
 * Helper function: Get achievement icon path
 */
function getAchievementIconPath(achievementId) {
    const iconPath = path.join(__dirname, '../assets/icons/achievements', `icon_achievement_${achievementId}.png`);
    return iconPath;
}

/**
 * Helper function: Draw achievement icon (async)
 */
async function drawAchievementIcon(ctx, achievementId, x, y, size) {
    try {
        const iconPath = getAchievementIconPath(achievementId);
        const iconImage = await Canvas.loadImage(iconPath);
        
        // Draw icon centered at x, y with specified size
        const iconX = x - size / 2;
        const iconY = y - size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error(`Error loading achievement icon for ${achievementId}:`, err);
        // Fallback: draw default icon or simple shape
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * MODIFIKASI drawBadgesEnhanced() function
 * 
 * Ganti bagian ini (baris ~478-484):
 * 
 * // OLD CODE:
 * // Badge emoji & text (centered)
 * ctx.fillStyle = '#FFFFFF';
 * ctx.font = 'bold 20px sans-serif';
 * ctx.textAlign = 'center';
 * 
 * // Emoji
 * ctx.fillText(badge.emoji || '★', badgeX + badgeWidth / 2, y + 30);
 * 
 * 
 * // NEW CODE:
 * // Badge icon & text (centered)
 * ctx.fillStyle = '#FFFFFF';
 * ctx.font = 'bold 14px sans-serif';
 * ctx.textAlign = 'center';
 * 
 * // Draw achievement icon (async)
 * const iconX = badgeX + badgeWidth / 2;
 * const iconY = y + 30;
 * const iconSize = 24; // Ukuran icon dalam pixel
 * await drawAchievementIcon(ctx, badge.id, iconX, iconY, iconSize);
 */

// ============================================
// FULL EXAMPLE: drawBadgesEnhanced() dengan icon gambar
// ============================================

async function drawBadgesEnhanced(ctx, achievements, customization, x, y, maxWidth) {
    if (!achievements || achievements.length === 0) return;
    if (!customization.badges || !customization.badges.enabled) return;
    
    // Get enabled badges
    const enabledBadges = achievements.filter(a => {
        if (!a || !a.id) return false;
        return customization.badges.enabled.includes(a.id) || 
               (customization.badges.customAchievements && customization.badges.customAchievements.some(c => c.id === a.id));
    }).slice(0, customization.badges.maxDisplay || 5);
    
    if (enabledBadges.length === 0) return;
    
    // Section title
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    
    // Draw trophy icon (sudah async dari modifikasi sebelumnya)
    await drawTrophyIcon(ctx, x, y - 40, 20);
    ctx.fillText('Achievements', x + 30, y - 20);
    
    // Draw badges
    let badgeX = x;
    const badgeSpacing = 15;
    const badgeHeight = 70;
    const badgeWidth = Math.min(160, (maxWidth - (enabledBadges.length - 1) * badgeSpacing) / enabledBadges.length);
    
    for (const badge of enabledBadges) {
        // Badge background with gradient
        const badgeGradient = ctx.createLinearGradient(badgeX, y, badgeX + badgeWidth, y + badgeHeight);
        badgeGradient.addColorStop(0, badge.color || '#5865F2');
        badgeGradient.addColorStop(1, adjustColor(badge.color || '#5865F2', -30));
        ctx.fillStyle = badgeGradient;
        
        const radius = 12;
        drawRoundedRect(ctx, badgeX, y, badgeWidth, badgeHeight, radius);
        ctx.fill();
        
        // Badge border with glow
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Badge icon & text (centered)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        
        // Draw achievement icon using file image
        const iconX = badgeX + badgeWidth / 2;
        const iconY = y + 30;
        const iconSize = 24; // Ukuran icon dalam pixel
        
        await drawAchievementIcon(ctx, badge.id, iconX, iconY, iconSize);
        
        // Name (truncate if too long)
        const badgeName = badge.name.length > 12 ? badge.name.substring(0, 10) + '...' : badge.name;
        ctx.fillText(badgeName, badgeX + badgeWidth / 2, y + 55);
        
        badgeX += badgeWidth + badgeSpacing;
        
        // Check if exceeds max width
        if (badgeX + badgeWidth > x + maxWidth) break;
    }
}

// ============================================
// ALTERNATIVE: Mapping achievement ID ke icon file name
// ============================================

/**
 * Mapping achievement ID to icon filename
 * Gunakan ini jika naming convention berbeda
 */
const ACHIEVEMENT_ICON_MAP = {
    // Voice Achievements
    'voice_murid_baru': 'icon_achievement_voice_murid_baru.png',
    'voice_siswa_aktif': 'icon_achievement_voice_siswa_aktif.png',
    'voice_enthusiast': 'icon_achievement_voice_enthusiast.png',
    'voice_ketua': 'icon_achievement_voice_ketua.png',
    'voice_master': 'icon_achievement_voice_master.png',
    'voice_legend': 'icon_achievement_voice_legend.png',
    
    // Reputation Achievements
    'prestasi_siswa_biasa': 'icon_achievement_prestasi_siswa_biasa.png',
    'prestasi_berprestasi': 'icon_achievement_prestasi_berprestasi.png',
    'prestasi_emas': 'icon_achievement_prestasi_emas.png',
    'prestasi_platinum': 'icon_achievement_prestasi_platinum.png',
    'prestasi_diamond': 'icon_achievement_prestasi_diamond.png',
    
    // Streak Achievements
    'streak_tidak_bolos': 'icon_achievement_streak_tidak_bolos.png',
    'streak_rajin_absen': 'icon_achievement_streak_rajin_absen.png',
    'streak_siswa_disiplin': 'icon_achievement_streak_siswa_disiplin.png',
    'streak_master': 'icon_achievement_streak_master.png',
    'streak_legend': 'icon_achievement_streak_legend.png',
    
    // Quote Achievements
    'quote_pencatat_kata': 'icon_achievement_quote_pencatat_kata.png',
    'quote_collector': 'icon_achievement_quote_collector.png',
    'quote_king': 'icon_achievement_quote_king.png',
    'quote_master': 'icon_achievement_quote_master.png',
    
    // Message Achievements
    'message_murid_aktif': 'icon_achievement_message_murid_aktif.png',
    'message_siswa_komunikatif': 'icon_achievement_message_siswa_komunikatif.png',
    'message_chat_master': 'icon_achievement_message_chat_master.png',
    'message_chat_legend': 'icon_achievement_message_chat_legend.png',
    'message_chat_god': 'icon_achievement_message_chat_god.png',
    
    // Voice Streak Achievements
    'voice_streak_best_friend': 'icon_achievement_voice_streak_best_friend.png',
    'voice_streak_soulmate': 'icon_achievement_voice_streak_soulmate.png',
    'voice_streak_couple_goals': 'icon_achievement_voice_streak_couple_goals.png',
    'voice_streak_power_couple': 'icon_achievement_voice_streak_power_couple.png',
};

/**
 * Alternative helper function using mapping
 */
async function drawAchievementIconWithMapping(ctx, achievementId, x, y, size) {
    try {
        const iconFilename = ACHIEVEMENT_ICON_MAP[achievementId] || 'icon_achievement_default.png';
        const iconPath = path.join(__dirname, '../assets/icons/achievements', iconFilename);
        const iconImage = await Canvas.loadImage(iconPath);
        
        const iconX = x - size / 2;
        const iconY = y - size / 2;
        ctx.drawImage(iconImage, iconX, iconY, size, size);
    } catch (err) {
        console.error(`Error loading achievement icon for ${achievementId}:`, err);
        // Fallback
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x, y, size / 2, 0, Math.PI * 2);
        ctx.fill();
    }
}




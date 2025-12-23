const Canvas = require('canvas');
const path = require('path');
const fs = require('fs');

/**
 * Generate profile card with customization - ENHANCED VERSION
 * @param {object} user - Discord user object
 * @param {object} member - Discord member object
 * @param {object} customization - User customization data
 * @param {object} rankData - Rank data from leveling
 * @param {array} achievements - User achievements
 * @param {object} stats - User stats (voice time, messages, etc)
 * @returns {Buffer} Canvas buffer
 */
async function generateProfileCard(user, member, customization, rankData, achievements, stats) {
    // Get resolution
    const resolution = customization.layout.resolution || '1280x720';
    const [width, height] = resolution.split('x').map(Number);
    
    // CRITICAL: Ensure template is the source of truth
    // If template exists, ALWAYS use it for background (unless it's an upload)
    const templateName = customization.template || 'classic';
    
    // Force sync: template always overrides background (unless upload)
    if (customization.background && customization.background.type === 'upload') {
        // Keep upload if exists
    } else {
        // ALWAYS use template for background
        customization.template = templateName;
        customization.background = { 
            type: 'template', 
            value: templateName 
        };
    }
    
    // Debug log with detailed info
    console.log(`🎨 Generating profile card:`);
    console.log(`   Template: ${customization.template}`);
    console.log(`   Background type: ${customization.background?.type}`);
    console.log(`   Background value: ${customization.background?.value}`);
    console.log(`   Resolution: ${width}x${height}`);
    
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Load background
    await loadBackground(ctx, customization, width, height);
    
    // Draw animated gradient overlay for depth
    drawAnimatedGradientOverlay(ctx, width, height);
    
    // Draw decorative elements
    drawDecorativeElements(ctx, width, height);
    
    // Draw stats sidebar (left) - Enhanced
    if (customization.stats && customization.stats.enabled.length > 0) {
        await drawStatsSidebar(ctx, stats, customization, width, height);
    }
    
    // Draw main content card (glass morphism effect)
    const mainAreaX = customization.stats && customization.stats.enabled.length > 0 ? 220 : 40;
    const mainAreaY = 40;
    const mainAreaWidth = width - mainAreaX - 40;
    const mainAreaHeight = height - 80;
    
    drawGlassCard(ctx, mainAreaX, mainAreaY, mainAreaWidth, mainAreaHeight);
    
    // Draw avatar with glow effect
    const avatarSize = customization.layout.avatarSize || 180;
    const avatarX = mainAreaX + 60;
    const avatarY = mainAreaY + 60;
    await drawAvatarWithGlow(ctx, user, avatarX, avatarY, avatarSize);
    
    // Draw username with gradient
    const usernameX = avatarX + avatarSize + 40;
    const usernameY = avatarY + 50;
    drawUsernameGradient(ctx, user, usernameX, usernameY, customization);
    
    // Draw user tag
    const tagY = usernameY + 45;
    drawUserTag(ctx, user, usernameX, tagY);
    
    // Draw bio (enhanced)
    if (customization.bio) {
        const bioY = tagY + 40;
        drawBioEnhanced(ctx, customization.bio, usernameX, bioY, mainAreaWidth - (usernameX - mainAreaX) - 80);
    }
    
    // Draw rank & level (enhanced cards)
    const rankY = (customization.bio ? tagY + 100 : tagY + 40);
    drawRankLevelCards(ctx, rankData, usernameX, rankY);
    
    // Draw XP progress bar (enhanced)
    const xpBarY = rankY + 80;
    const xpBarWidth = mainAreaWidth - (usernameX - mainAreaX) - 80;
    drawXPBarEnhanced(ctx, rankData, usernameX, xpBarY, xpBarWidth);
    
    // Draw badges section (enhanced)
    const badgesY = xpBarY + 80;
    await drawBadgesEnhanced(ctx, achievements, customization, usernameX, badgesY, mainAreaWidth - (usernameX - mainAreaX) - 80);
    
    // Draw frame overlay (last, so it's on top)
    await drawFrame(ctx, customization, width, height);
    
    return canvas.toBuffer();
}

/**
 * Draw animated gradient overlay
 */
function drawAnimatedGradientOverlay(ctx, width, height) {
    // Multiple gradient layers for depth
    const overlay1 = ctx.createLinearGradient(0, 0, width, height);
    overlay1.addColorStop(0, 'rgba(88, 101, 242, 0.15)');
    overlay1.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
    overlay1.addColorStop(1, 'rgba(236, 72, 153, 0.15)');
    ctx.fillStyle = overlay1;
    ctx.fillRect(0, 0, width, height);
    
    // Radial gradient overlay
    const overlay2 = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height));
    overlay2.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
    overlay2.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
    ctx.fillStyle = overlay2;
    ctx.fillRect(0, 0, width, height);
}

/**
 * Draw decorative elements
 */
function drawDecorativeElements(ctx, width, height) {
    // Floating particles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137) % width;
        const y = (i * 89) % height;
        const size = 2 + (i % 3);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Corner decorations
    const cornerSize = 100;
    const gradient = ctx.createLinearGradient(0, 0, cornerSize, cornerSize);
    gradient.addColorStop(0, 'rgba(88, 101, 242, 0.2)');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    
    // Top-left corner
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    
    // Bottom-right corner
    ctx.save();
    ctx.translate(width, height);
    ctx.rotate(Math.PI);
    ctx.fillRect(0, 0, cornerSize, cornerSize);
    ctx.restore();
}

/**
 * Draw glass morphism card
 */
function drawGlassCard(ctx, x, y, width, height) {
    const radius = 30;
    
    // Shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 30;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 10;
    
    // Glass card background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Inner glow
    const innerGradient = ctx.createLinearGradient(x, y, x + width, y + height);
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.05)');
    innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0.02)');
    ctx.fillStyle = innerGradient;
    drawRoundedRect(ctx, x + 5, y + 5, width - 10, height - 10, radius - 5);
    ctx.fill();
}

/**
 * Helper: Draw rounded rectangle
 */
function drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
}

/**
 * Draw avatar with glow effect
 */
async function drawAvatarWithGlow(ctx, user, x, y, size) {
    try {
        const avatarURL = user.displayAvatarURL({ extension: 'png', size: 512 });
        const avatar = await Canvas.loadImage(avatarURL);
        
        // Glow effect
        ctx.shadowColor = 'rgba(88, 101, 242, 0.6)';
        ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Circular avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, x, y, size, size);
        ctx.restore();
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        
        // Avatar border with gradient
        const borderGradient = ctx.createLinearGradient(x, y, x + size, y + size);
        borderGradient.addColorStop(0, '#5865F2');
        borderGradient.addColorStop(0.5, '#8B5CF6');
        borderGradient.addColorStop(1, '#EC4899');
        ctx.strokeStyle = borderGradient;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2, true);
        ctx.stroke();
        
        // Outer ring
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x + size / 2, y + size / 2, size / 2 + 3, 0, Math.PI * 2, true);
        ctx.stroke();
    } catch (err) {
        console.error('Error drawing avatar:', err);
    }
}

/**
 * Draw username with gradient
 */
function drawUsernameGradient(ctx, user, x, y, customization) {
    const displayName = user.displayName || user.globalName || user.username;
    
    // Gradient text
    const gradient = ctx.createLinearGradient(x, y - 20, x + 400, y + 20);
    gradient.addColorStop(0, '#FFFFFF');
    gradient.addColorStop(0.5, '#E0E7FF');
    gradient.addColorStop(1, '#C7D2FE');
    
    ctx.fillStyle = gradient;
    ctx.font = `bold 48px sans-serif`;
    ctx.textAlign = 'left';
    
    // Text shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(displayName, x, y);
    
    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

/**
 * Draw user tag
 */
function drawUserTag(ctx, user, x, y) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`@${user.username}`, x, y);
}

/**
 * Draw bio enhanced
 */
function drawBioEnhanced(ctx, bio, x, y, maxWidth) {
    // Bio card background
    const bioCardHeight = 60;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    drawRoundedRect(ctx, x, y, maxWidth, bioCardHeight, 15);
    ctx.fill();
    
    // Bio text
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'italic 22px sans-serif';
    ctx.textAlign = 'left';
    
    // Truncate bio if too long
    const maxLength = 80;
    const displayBio = bio.length > maxLength ? bio.substring(0, maxLength) + '...' : bio;
    
    // Center text vertically in card
    const textY = y + bioCardHeight / 2 + 8;
    ctx.fillText(`"${displayBio}"`, x + 20, textY);
}

/**
 * Draw rank & level cards
 */
function drawRankLevelCards(ctx, rankData, x, y) {
    if (!rankData) return;
    
    const cardWidth = 180;
    const cardHeight = 70;
    const spacing = 20;
    
    // Rank card
    const rankGradient = ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
    rankGradient.addColorStop(0, 'rgba(88, 101, 242, 0.3)');
    rankGradient.addColorStop(1, 'rgba(139, 92, 246, 0.3)');
    ctx.fillStyle = rankGradient;
    drawRoundedRect(ctx, x, y, cardWidth, cardHeight, 15);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(88, 101, 242, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Rank', x + cardWidth / 2, y + 30);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`#${rankData.rank}`, x + cardWidth / 2, y + 60);
    
    // Level card
    const levelX = x + cardWidth + spacing;
    const levelGradient = ctx.createLinearGradient(levelX, y, levelX + cardWidth, y + cardHeight);
    levelGradient.addColorStop(0, 'rgba(236, 72, 153, 0.3)');
    levelGradient.addColorStop(1, 'rgba(251, 146, 60, 0.3)');
    ctx.fillStyle = levelGradient;
    drawRoundedRect(ctx, levelX, y, cardWidth, cardHeight, 15);
    ctx.fill();
    
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Level', levelX + cardWidth / 2, y + 30);
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText(`${rankData.level}`, levelX + cardWidth / 2, y + 60);
}

/**
 * Draw XP progress bar enhanced
 */
function drawXPBarEnhanced(ctx, rankData, x, y, width) {
    if (!rankData) return;
    
    const xpNeeded = rankData.nextLevelXp;
    const currentXp = rankData.xp;
    const progress = Math.min(currentXp / xpNeeded, 1);
    const barHeight = 35;
    const radius = 18;
    
    // Bar background with glass effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    drawRoundedRect(ctx, x, y, width, barHeight, radius);
    ctx.fill();
    
    // Progress bar with gradient
    const progressGradient = ctx.createLinearGradient(x, y, x + width * progress, y + barHeight);
    progressGradient.addColorStop(0, '#5865F2');
    progressGradient.addColorStop(0.5, '#8B5CF6');
    progressGradient.addColorStop(1, '#EC4899');
    ctx.fillStyle = progressGradient;
    
    // Clip to rounded rectangle
    ctx.save();
    drawRoundedRect(ctx, x, y, width * progress, barHeight, radius);
    ctx.clip();
    ctx.fillRect(x, y, width * progress, barHeight);
    ctx.restore();
    
    // Progress bar border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    drawRoundedRect(ctx, x, y, width, barHeight, radius);
    ctx.stroke();
    
    // XP text with shadow
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillText(`${currentXp.toLocaleString()} / ${xpNeeded.toLocaleString()} XP`, x + width / 2, y + barHeight / 2 + 7);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
}

/**
 * Draw badges enhanced
 */
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
    
    // Draw trophy icon
    drawTrophyIcon(ctx, x, y - 40, 20);
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
        
        // Badge emoji & text (centered)
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        
        // Emoji
        ctx.fillText(badge.emoji || '★', badgeX + badgeWidth / 2, y + 30);
        
        // Name (truncate if too long)
        const badgeName = badge.name.length > 12 ? badge.name.substring(0, 10) + '...' : badge.name;
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(badgeName, badgeX + badgeWidth / 2, y + 55);
        
        badgeX += badgeWidth + badgeSpacing;
        
        // Check if exceeds max width
        if (badgeX + badgeWidth > x + maxWidth) break;
    }
}

/**
 * Helper: Adjust color brightness
 */
function adjustColor(color, amount) {
    const usePound = color[0] === '#';
    const col = usePound ? color.slice(1) : color;
    const num = parseInt(col, 16);
    let r = (num >> 16) + amount;
    let g = (num >> 8 & 0x00FF) + amount;
    let b = (num & 0x0000FF) + amount;
    r = r > 255 ? 255 : r < 0 ? 0 : r;
    g = g > 255 ? 255 : g < 0 ? 0 : g;
    b = b > 255 ? 255 : b < 0 ? 0 : b;
    return (usePound ? '#' : '') + (r << 16 | g << 8 | b).toString(16).padStart(6, '0');
}

/**
 * Load and draw background
 */
async function loadBackground(ctx, customization, width, height) {
    try {
        // CRITICAL: Use template field as PRIMARY source of truth
        // If template exists, use it. Otherwise use background.value, then default to 'classic'
        let templateName = customization.template;
        
        // If no template, try to get from background.value
        if (!templateName && customization.background && customization.background.type === 'template') {
            templateName = customization.background.value;
        }
        
        // Final fallback
        if (!templateName) {
            templateName = 'classic';
        }
        
        console.log(`🎨 Loading background:`);
        console.log(`   Template from customization.template: ${customization.template}`);
        console.log(`   Template from background.value: ${customization.background?.value}`);
        console.log(`   Final template name: ${templateName}`);
        console.log(`   Resolution: ${width}x${height}`);
        
        // If background is upload, use that instead (skip template)
        if (customization.background && customization.background.type === 'upload') {
            const userDir = path.join(__dirname, '../assets/profiles', customization.userId);
            const backgroundPath = path.join(userDir, 'background.png');
            if (fs.existsSync(backgroundPath)) {
                try {
                    const bgImage = await Canvas.loadImage(backgroundPath);
                    ctx.drawImage(bgImage, 0, 0, width, height);
                    console.log(`✅ Loaded uploaded background: ${backgroundPath}`);
                    return;
                } catch (err) {
                    console.error('Error loading uploaded background:', err);
                }
            }
        }
        
        // Use template background - SIMPLE AND DIRECT
        const templateDir = path.join(__dirname, '../assets/profiles/templates', templateName);
        console.log(`📁 Template directory: ${templateDir}`);
        console.log(`📁 Directory exists: ${fs.existsSync(templateDir)}`);
        
        let bgImage = null;
        
        // Try resolution-specific file first
        const resSpecificPath = path.join(templateDir, `background_${width}x${height}.png`);
        const resSpecificExists = fs.existsSync(resSpecificPath);
        console.log(`🔍 Resolution-specific path: ${resSpecificPath}`);
        console.log(`🔍 Resolution-specific exists: ${resSpecificExists}`);
        
        if (resSpecificExists) {
            try {
                bgImage = await Canvas.loadImage(resSpecificPath);
                console.log(`✅ Loaded resolution-specific background: ${templateName} (${width}x${height})`);
            } catch (err) {
                console.error('❌ Error loading resolution-specific background:', err);
                console.error('   Error message:', err.message);
            }
        }
        
        // Fallback to default background.png
        if (!bgImage) {
            const defaultPath = path.join(templateDir, 'background.png');
            const defaultExists = fs.existsSync(defaultPath);
            console.log(`🔍 Default path: ${defaultPath}`);
            console.log(`🔍 Default exists: ${defaultExists}`);
            
            if (defaultExists) {
                try {
                    bgImage = await Canvas.loadImage(defaultPath);
                    console.log(`✅ Loaded default background: ${templateName}`);
                } catch (err) {
                    console.error('❌ Error loading default background:', err);
                    console.error('   Error message:', err.message);
                }
            } else {
                console.warn(`⚠️ Background not found for template: ${templateName}`);
                console.warn(`   Tried: ${resSpecificPath}`);
                console.warn(`   Tried: ${defaultPath}`);
            }
        }
        
        if (bgImage) {
            ctx.drawImage(bgImage, 0, 0, width, height);
            console.log(`✅ Background drawn successfully for template: ${templateName}`);
        } else {
            // Fallback: Generate background dynamically based on template
            console.warn(`⚠️ Background file not found for template: ${templateName}, generating dynamically...`);
            generateTemplateBackground(ctx, templateName, width, height);
        }
    } catch (err) {
        console.error('Error loading background:', err);
        // Fallback: Generate background dynamically
        generateTemplateBackground(ctx, customization.template || 'classic', width, height);
    }
}

/**
 * Generate template background dynamically if file not found
 */
function generateTemplateBackground(ctx, templateName, width, height) {
    try {
        // Template-specific color schemes
        const templates = {
            classic: {
                gradient: ['#1a1b2e', '#16213e', '#0f3460', '#533483'],
                radial: 'rgba(88, 101, 242, 0.2)'
            },
            dark: {
                gradient: ['#0a0a0a', '#1a1a1a', '#2a2a2a', '#000000'],
                radial: 'rgba(100, 100, 100, 0.15)'
            },
            light: {
                gradient: ['#f5f5f5', '#e8e8e8', '#d0d0d0', '#b8b8b8'],
                radial: 'rgba(200, 200, 200, 0.2)'
            },
            colorful: {
                gradient: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24'],
                radial: 'rgba(255, 107, 107, 0.2)'
            },
            neon: {
                gradient: ['#0a0a0a', '#1a0033', '#330066', '#6600cc'],
                radial: 'rgba(255, 0, 255, 0.3)'
            },
            gaming: {
                gradient: ['#1a1a2e', '#16213e', '#0f3460', '#533483'],
                radial: 'rgba(0, 255, 0, 0.2)'
            },
            epic: {
                gradient: ['#1a0033', '#330066', '#6600cc', '#9900ff'],
                radial: 'rgba(255, 215, 0, 0.2)'
            },
            minimalist: {
                gradient: ['#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0'],
                radial: 'rgba(0, 0, 0, 0.05)'
            },
            romantic: {
                gradient: ['#ff9a9e', '#fecfef', '#fecfef', '#ffc3a0'],
                radial: 'rgba(255, 182, 193, 0.3)'
            },
            school: {
                gradient: ['#2c3e50', '#34495e', '#3498db', '#2980b9'],
                radial: 'rgba(52, 152, 219, 0.2)'
            }
        };
        
        const template = templates[templateName] || templates.classic;
        
        // Create gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        template.gradient.forEach((color, index) => {
            gradient.addColorStop(index / (template.gradient.length - 1), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        // Add radial gradient overlay
        const radialGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.5);
        radialGrad.addColorStop(0, template.radial);
        radialGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = radialGrad;
        ctx.fillRect(0, 0, width, height);
        
        console.log(`✅ Generated dynamic background for template: ${templateName}`);
    } catch (err) {
        console.error('Error generating template background:', err);
        // Ultimate fallback: simple gradient
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, '#1a1b2e');
        gradient.addColorStop(1, '#533483');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
}

/**
 * Draw stats sidebar (left) - Enhanced
 */
async function drawStatsSidebar(ctx, stats, customization, width, height) {
    if (!customization.stats || !customization.stats.enabled || customization.stats.enabled.length === 0) {
        return;
    }
    
    const sidebarWidth = 200;
    const sidebarX = 20;
    const sidebarY = 40;
    const sidebarHeight = height - 80;
    
    // Glass sidebar background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    drawRoundedRect(ctx, sidebarX, sidebarY, sidebarWidth, sidebarHeight, 25);
    ctx.fill();
    
    // Sidebar border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Stats title with gradient
    const titleGradient = ctx.createLinearGradient(sidebarX + 20, sidebarY + 20, sidebarX + 180, sidebarY + 20);
    titleGradient.addColorStop(0, '#FFFFFF');
    titleGradient.addColorStop(1, '#E0E7FF');
    ctx.fillStyle = titleGradient;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    
    // Draw stats icon
    drawStatsIcon(ctx, sidebarX + 20, sidebarY + 20, 20);
    ctx.fillText('Stats', sidebarX + 50, sidebarY + 40);
    
    // Draw each stat with cards
    let yOffset = sidebarY + 70;
    
    const statLabels = {
        voice_time: 'Voice Time',
        messages: 'Messages',
        prestasi: 'Prestasi',
        quotes: 'Quotes',
        streak: 'Streak',
        voice_streak: 'Voice Streak'
    };
    
    for (const statId of customization.stats.enabled) {
        if (!stats || !stats[statId]) continue;
        
        const icon = statIcons[statId] || '▰';
        const label = statLabels[statId] || statId;
        const value = formatStatValue(statId, stats[statId]);
        
        // Stat card
        const cardHeight = 60;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        drawRoundedRect(ctx, sidebarX + 10, yOffset, sidebarWidth - 20, cardHeight, 12);
        ctx.fill();
        
        // Icon
        ctx.fillStyle = '#FFFFFF';
        ctx.save();
        const iconSize = 24;
        const iconX = sidebarX + 20;
        const iconY = yOffset + (cardHeight / 2) - (iconSize / 2);
        
        drawStatIcon(ctx, statId, iconX, iconY, iconSize);
        ctx.restore();
        
        // Value
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(value, sidebarX + 55, yOffset + 35);
        
        // Label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.font = '14px sans-serif';
        ctx.fillText(label, sidebarX + 60, yOffset + 55);
        
        yOffset += cardHeight + 10;
        
        // Prevent overflow
        if (yOffset > sidebarY + sidebarHeight - 20) break;
    }
}

/**
 * Format stat value for display
 */
function formatStatValue(statId, value) {
    switch (statId) {
        case 'voice_time':
            const hours = Math.floor(value / 3600);
            const minutes = Math.floor((value % 3600) / 60);
            if (hours > 0) return `${hours}j ${minutes}m`;
            return `${minutes}m`;
        case 'messages':
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
            return value.toString();
        case 'prestasi':
        case 'quotes':
        case 'streak':
        case 'voice_streak':
            return value.toString();
        default:
            return value.toString();
    }
}

/**
 * Draw stats icon (chart/bar icon)
 */
function drawStatsIcon(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.translate(x, y);
    
    // Draw bar chart icon
    const barWidth = size * 0.2;
    const spacing = size * 0.15;
    
    // Bar 1
    ctx.fillRect(0, size * 0.6, barWidth, size * 0.4);
    // Bar 2
    ctx.fillRect(barWidth + spacing, size * 0.3, barWidth, size * 0.7);
    // Bar 3
    ctx.fillRect((barWidth + spacing) * 2, size * 0.4, barWidth, size * 0.6);
    // Bar 4
    ctx.fillRect((barWidth + spacing) * 3, size * 0.1, barWidth, size * 0.9);
    
    ctx.restore();
}

/**
 * Draw stat icon based on stat ID
 */
function drawStatIcon(ctx, statId, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.translate(x + size / 2, y + size / 2);
    
    switch (statId) {
        case 'voice_time':
        case 'voice_streak':
            drawMicrophoneIcon(ctx, size);
            break;
        case 'messages':
            drawMessageIcon(ctx, size);
            break;
        case 'prestasi':
            drawStarIcon(ctx, size);
            break;
        case 'quotes':
            drawQuoteIcon(ctx, size);
            break;
        case 'streak':
            drawFireIcon(ctx, size);
            break;
        default:
            drawDefaultIcon(ctx, size);
    }
    
    ctx.restore();
}

/**
 * Draw microphone icon
 */
function drawMicrophoneIcon(ctx, size) {
    const scale = size / 24;
    // Microphone body (rectangle)
    ctx.fillRect(-3 * scale, -8 * scale, 6 * scale, 12 * scale);
    // Microphone stand (base)
    ctx.fillRect(-5 * scale, 4 * scale, 10 * scale, 2 * scale);
    // Microphone stand (vertical)
    ctx.fillRect(-1 * scale, 6 * scale, 2 * scale, 4 * scale);
    // Microphone stand (legs)
    ctx.fillRect(-5 * scale, 10 * scale, 3 * scale, 1 * scale);
    ctx.fillRect(2 * scale, 10 * scale, 3 * scale, 1 * scale);
}

/**
 * Draw message bubble icon
 */
function drawMessageIcon(ctx, size) {
    const scale = size / 24;
    // Message bubble (rounded rectangle using path)
    const x = -8 * scale;
    const y = -8 * scale;
    const w = 16 * scale;
    const h = 12 * scale;
    const r = 3 * scale;
    
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    
    // Tail
    ctx.beginPath();
    ctx.moveTo(-2 * scale, 4 * scale);
    ctx.lineTo(-6 * scale, 10 * scale);
    ctx.lineTo(0 * scale, 6 * scale);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw star icon
 */
function drawStarIcon(ctx, size) {
    const scale = size / 24;
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = 8 * scale;
    const innerRadius = 4 * scale;
    let rot = Math.PI / 2 * 3;
    let x = 0;
    let y = -outerRadius;
    ctx.moveTo(x, y);
    
    for (let i = 0; i < spikes; i++) {
        x = Math.cos(rot) * outerRadius;
        y = Math.sin(rot) * outerRadius;
        ctx.lineTo(x, y);
        rot += Math.PI / spikes;
        
        x = Math.cos(rot) * innerRadius;
        y = Math.sin(rot) * innerRadius;
        ctx.lineTo(x, y);
        rot += Math.PI / spikes;
    }
    ctx.lineTo(0, -outerRadius);
    ctx.closePath();
    ctx.fill();
}

/**
 * Draw quote icon
 */
function drawQuoteIcon(ctx, size) {
    const scale = size / 24;
    // Left quote
    ctx.beginPath();
    ctx.arc(-6 * scale, -4 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-6 * scale, 2 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    // Right quote
    ctx.beginPath();
    ctx.arc(6 * scale, -4 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6 * scale, 2 * scale, 3 * scale, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw fire icon
 */
function drawFireIcon(ctx, size) {
    const scale = size / 24;
    // Save original fill style
    const originalFill = ctx.fillStyle;
    
    // Fire shape (flame) - outer
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, 8 * scale);
    ctx.quadraticCurveTo(-4 * scale, 0, -6 * scale, -6 * scale);
    ctx.quadraticCurveTo(-4 * scale, -4 * scale, -2 * scale, -8 * scale);
    ctx.quadraticCurveTo(0, -10 * scale, 2 * scale, -8 * scale);
    ctx.quadraticCurveTo(4 * scale, -4 * scale, 6 * scale, -6 * scale);
    ctx.quadraticCurveTo(4 * scale, 0, 0, 8 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Inner flame (lighter color for depth)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.moveTo(0, 6 * scale);
    ctx.quadraticCurveTo(-2 * scale, -2 * scale, -3 * scale, -5 * scale);
    ctx.quadraticCurveTo(-1 * scale, -3 * scale, 0, -6 * scale);
    ctx.quadraticCurveTo(1 * scale, -3 * scale, 3 * scale, -5 * scale);
    ctx.quadraticCurveTo(2 * scale, -2 * scale, 0, 6 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Restore fill style
    ctx.fillStyle = originalFill;
}

/**
 * Draw default icon (circle)
 */
function drawDefaultIcon(ctx, size) {
    const scale = size / 24;
    ctx.beginPath();
    ctx.arc(0, 0, 6 * scale, 0, Math.PI * 2);
    ctx.fill();
}

/**
 * Draw trophy icon for achievements
 */
function drawTrophyIcon(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#FFFFFF';
    ctx.translate(x, y);
    const scale = size / 24;
    
    // Trophy base
    ctx.fillRect(-6 * scale, 8 * scale, 12 * scale, 2 * scale);
    // Trophy body (cup shape)
    ctx.beginPath();
    ctx.moveTo(-4 * scale, 8 * scale);
    ctx.lineTo(-6 * scale, -4 * scale);
    ctx.lineTo(-2 * scale, -6 * scale);
    ctx.lineTo(-2 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(4 * scale, 8 * scale);
    ctx.lineTo(6 * scale, -4 * scale);
    ctx.lineTo(2 * scale, -6 * scale);
    ctx.lineTo(2 * scale, 2 * scale);
    ctx.closePath();
    ctx.fill();
    
    // Trophy top (handle area)
    ctx.fillRect(-2 * scale, -6 * scale, 4 * scale, 2 * scale);
    
    // Trophy handles
    ctx.beginPath();
    ctx.arc(-6 * scale, 0, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(6 * scale, 0, 2 * scale, 0, Math.PI * 2);
    ctx.fill();
    
    // Trophy star on top
    ctx.beginPath();
    const spikes = 5;
    const outerRadius = 3 * scale;
    const innerRadius = 1.5 * scale;
    let rot = Math.PI / 2 * 3;
    let starX = 0;
    let starY = -8 * scale;
    ctx.moveTo(starX, starY - outerRadius);
    
    for (let i = 0; i < spikes; i++) {
        starX = Math.cos(rot) * outerRadius;
        starY = Math.sin(rot) * outerRadius - 8 * scale;
        ctx.lineTo(starX, starY);
        rot += Math.PI / spikes;
        
        starX = Math.cos(rot) * innerRadius;
        starY = Math.sin(rot) * innerRadius - 8 * scale;
        ctx.lineTo(starX, starY);
        rot += Math.PI / spikes;
    }
    ctx.closePath();
    ctx.fill();
    
    ctx.restore();
}

/**
 * Draw frame overlay
 */
async function drawFrame(ctx, customization, width, height) {
    try {
        if (!customization.frame || customization.frame.type !== 'preset') return;
        
        const framePath = path.join(__dirname, '../assets/profiles/frames', 
            customization.frame.value.includes('/') ? customization.frame.value : 
            `free/${customization.frame.value}`);
        
        let frameFile = null;
        if (fs.existsSync(framePath)) {
            frameFile = framePath;
        } else {
            const premiumPath = path.join(__dirname, '../assets/profiles/frames/premium', customization.frame.value);
            if (fs.existsSync(premiumPath)) {
                frameFile = premiumPath;
            }
        }
        
        if (frameFile) {
            const frame = await Canvas.loadImage(frameFile);
            ctx.drawImage(frame, 0, 0, width, height);
        }
    } catch (err) {
        console.error('Error drawing frame:', err);
    }
}

module.exports = {
    generateProfileCard,
};

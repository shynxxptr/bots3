const Canvas = require('canvas');
const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../assets/profiles/templates');

// Ensure directories exist
function ensureDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

// Helper: Draw rounded rectangle
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
 * Generate Classic template background
 */
function generateClassic(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1b2e');
    gradient.addColorStop(0.3, '#16213e');
    gradient.addColorStop(0.6, '#0f3460');
    gradient.addColorStop(1, '#533483');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Radial overlay
    const radial = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, Math.max(width, height) / 1.5);
    radial.addColorStop(0, 'rgba(88, 101, 242, 0.2)');
    radial.addColorStop(1, 'transparent');
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
    
    // Subtle pattern
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    for (let i = 0; i < 100; i++) {
        const x = (i * 137) % width;
        const y = (i * 89) % height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas.toBuffer();
}

/**
 * Generate School template background (S3 theme)
 */
function generateSchool(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // School colors: blue and white theme
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#e3f2fd'); // Light blue sky
    gradient.addColorStop(0.4, '#bbdefb'); // Medium blue
    gradient.addColorStop(0.6, '#90caf9'); // Blue
    gradient.addColorStop(1, '#64b5f6'); // Deeper blue
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // School building silhouette at bottom
    ctx.fillStyle = '#1976d2';
    ctx.fillRect(0, height * 0.7, width, height * 0.3);
    
    // Windows
    ctx.fillStyle = '#ffd54f';
    const windowSize = 40;
    const windowSpacing = 60;
    for (let x = 50; x < width - 50; x += windowSpacing) {
        for (let y = height * 0.75; y < height - 50; y += windowSpacing) {
            ctx.fillRect(x, y, windowSize, windowSize);
        }
    }
    
    // School elements: books, pencils
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let i = 0; i < 30; i++) {
        const x = (i * 173) % width;
        const y = (i * 97) % (height * 0.6);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate((i * 23) * Math.PI / 180);
        ctx.fillRect(-10, -5, 20, 10);
        ctx.restore();
    }
    
    // Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 5; i++) {
        const x = (i * 200) % width;
        const y = 50 + (i * 30) % 100;
        ctx.beginPath();
        ctx.arc(x, y, 30, 0, Math.PI * 2);
        ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
        ctx.arc(x + 50, y, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas.toBuffer();
}

/**
 * Generate Minimalist template background
 */
function generateMinimalist(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Clean white to light gray gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.5, '#f5f5f5');
    gradient.addColorStop(1, '#e0e0e0');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Subtle geometric shapes
    ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
    
    // Circles
    for (let i = 0; i < 8; i++) {
        const x = (i * 250) % width;
        const y = (i * 150) % height;
        const radius = 50 + (i % 3) * 20;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.03)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i++) {
        const y = (i * 200) % height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    return canvas.toBuffer();
}

/**
 * Generate Dark template background
 */
function generateDark(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Deep dark gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a0a');
    gradient.addColorStop(0.3, '#1a1a1a');
    gradient.addColorStop(0.6, '#0d1117');
    gradient.addColorStop(1, '#161b22');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Subtle grid pattern
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Glowing dots
    ctx.fillStyle = 'rgba(88, 101, 242, 0.3)';
    for (let i = 0; i < 20; i++) {
        const x = (i * 137) % width;
        const y = (i * 89) % height;
        const size = 3 + (i % 3);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas.toBuffer();
}

/**
 * Generate Light template background
 */
function generateLight(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Bright light gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#f8f9fa');
    gradient.addColorStop(0.3, '#e9ecef');
    gradient.addColorStop(0.6, '#dee2e6');
    gradient.addColorStop(1, '#ced4da');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Soft pastel accents
    ctx.fillStyle = 'rgba(88, 101, 242, 0.08)';
    for (let i = 0; i < 15; i++) {
        const x = (i * 200) % width;
        const y = (i * 120) % height;
        const radius = 60 + (i % 3) * 20;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Light rays
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 8; i++) {
        const angle = (i * 45) * Math.PI / 180;
        const x1 = width / 2;
        const y1 = height / 2;
        const length = Math.max(width, height);
        const x2 = x1 + Math.cos(angle) * length;
        const y2 = y1 + Math.sin(angle) * length;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    
    return canvas.toBuffer();
}

/**
 * Generate Colorful template background
 */
function generateColorful(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Vibrant gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ff6b6b');
    gradient.addColorStop(0.25, '#4ecdc4');
    gradient.addColorStop(0.5, '#45b7d1');
    gradient.addColorStop(0.75, '#f9ca24');
    gradient.addColorStop(1, '#f0932b');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Colorful shapes
    const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b'];
    for (let i = 0; i < 30; i++) {
        ctx.fillStyle = colors[i % colors.length] + '80'; // 50% opacity
        const x = (i * 137) % width;
        const y = (i * 89) % height;
        const size = 40 + (i % 5) * 10;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas.toBuffer();
}

/**
 * Generate Romantic template background
 */
function generateRomantic(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Pink romantic gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ffeef8');
    gradient.addColorStop(0.3, '#ffd6e8');
    gradient.addColorStop(0.6, '#ffb3d9');
    gradient.addColorStop(1, '#ff99cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Hearts
    ctx.fillStyle = 'rgba(255, 182, 193, 0.4)';
    for (let i = 0; i < 20; i++) {
        const x = (i * 173) % width;
        const y = (i * 97) % height;
        const size = 20 + (i % 3) * 5;
        
        // Draw heart shape
        ctx.save();
        ctx.translate(x, y);
        ctx.beginPath();
        ctx.moveTo(0, size / 4);
        ctx.bezierCurveTo(0, -size / 4, -size / 2, -size / 2, -size / 2, 0);
        ctx.bezierCurveTo(-size / 2, size / 2, 0, size, 0, size);
        ctx.bezierCurveTo(0, size, size / 2, size / 2, size / 2, 0);
        ctx.bezierCurveTo(size / 2, -size / 2, 0, -size / 4, 0, size / 4);
        ctx.fill();
        ctx.restore();
    }
    
    // Sparkles
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137) % width;
        const y = (i * 89) % height;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas.toBuffer();
}

/**
 * Generate Gaming template background
 */
function generateGaming(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dark gaming theme
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0e27');
    gradient.addColorStop(0.5, '#1a1f3a');
    gradient.addColorStop(1, '#2d1b4e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Neon grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    // Gaming elements: pixels, blocks
    const neonColors = ['#00ffff', '#ff00ff', '#00ff00', '#ffff00'];
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = neonColors[i % neonColors.length] + '40';
        const x = (i * 73) % width;
        const y = (i * 41) % height;
        const size = 10 + (i % 5) * 5;
        ctx.fillRect(x, y, size, size);
    }
    
    return canvas.toBuffer();
}

/**
 * Generate Neon template background
 */
function generateNeon(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Dark base
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // Neon gradient overlays
    const neon1 = ctx.createRadialGradient(width * 0.3, height * 0.3, 0, width * 0.3, height * 0.3, Math.max(width, height));
    neon1.addColorStop(0, 'rgba(255, 0, 255, 0.4)');
    neon1.addColorStop(1, 'transparent');
    ctx.fillStyle = neon1;
    ctx.fillRect(0, 0, width, height);
    
    const neon2 = ctx.createRadialGradient(width * 0.7, height * 0.7, 0, width * 0.7, height * 0.7, Math.max(width, height));
    neon2.addColorStop(0, 'rgba(0, 255, 255, 0.4)');
    neon2.addColorStop(1, 'transparent');
    ctx.fillStyle = neon2;
    ctx.fillRect(0, 0, width, height);
    
    // Neon lines
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 3;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#00ffff';
    for (let i = 0; i < 10; i++) {
        const y = (i * 80) % height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
    
    return canvas.toBuffer();
}

/**
 * Generate Epic template background
 */
function generateEpic(width, height) {
    const canvas = Canvas.createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Epic dark gradient
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a0033');
    gradient.addColorStop(0.3, '#330066');
    gradient.addColorStop(0.6, '#4d0099');
    gradient.addColorStop(1, '#6600cc');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Epic rays
    const centerX = width / 2;
    const centerY = height / 2;
    for (let i = 0; i < 12; i++) {
        const angle = (i * 30) * Math.PI / 180;
        const gradient2 = ctx.createLinearGradient(centerX, centerY, centerX + Math.cos(angle) * width, centerY + Math.sin(angle) * height);
        gradient2.addColorStop(0, 'rgba(255, 215, 0, 0.3)');
        gradient2.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, Math.max(width, height), angle - 0.1, angle + 0.1);
        ctx.closePath();
        ctx.fill();
    }
    
    // Epic particles
    ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
    for (let i = 0; i < 50; i++) {
        const x = (i * 137) % width;
        const y = (i * 89) % height;
        const size = 3 + (i % 4);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
    
    return canvas.toBuffer();
}

/**
 * Generate all template backgrounds
 */
async function generateAllTemplates() {
    const resolutions = [
        { name: '1280x720', width: 1280, height: 720 },
        { name: '1920x1080', width: 1920, height: 1080 }
    ];
    
    const templates = [
        { id: 'classic', generator: generateClassic },
        { id: 'school', generator: generateSchool },
        { id: 'minimalist', generator: generateMinimalist },
        { id: 'dark', generator: generateDark },
        { id: 'light', generator: generateLight },
        { id: 'colorful', generator: generateColorful },
        { id: 'romantic', generator: generateRomantic },
        { id: 'gaming', generator: generateGaming },
        { id: 'neon', generator: generateNeon },
        { id: 'epic', generator: generateEpic }
    ];
    
    console.log('Generating template backgrounds...');
    
    for (const template of templates) {
        const templateDir = path.join(TEMPLATES_DIR, template.id);
        ensureDir(templateDir);
        
        for (const res of resolutions) {
            console.log(`Generating ${template.id} - ${res.name}...`);
            const buffer = template.generator(res.width, res.height);
            const filename = `background_${res.name}.png`;
            const filepath = path.join(templateDir, filename);
            fs.writeFileSync(filepath, buffer);
        }
        
        // Also create default background.png (1280x720)
        const defaultBuffer = template.generator(1280, 720);
        const defaultPath = path.join(templateDir, 'background.png');
        fs.writeFileSync(defaultPath, defaultBuffer);
        
        console.log(`✅ Generated ${template.id} template`);
    }
    
    console.log('✅ All templates generated!');
}

// Run if called directly
if (require.main === module) {
    generateAllTemplates().catch(console.error);
}

module.exports = {
    generateAllTemplates,
    generateClassic,
    generateSchool,
    generateMinimalist,
    generateDark,
    generateLight,
    generateColorful,
    generateRomantic,
    generateGaming,
    generateNeon,
    generateEpic
};






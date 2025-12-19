const Canvas = require('canvas');
const path = require('path');
const fs = require('fs');
const { getWelcomeConfig } = require('./configLoader');

const createGoodbyeImage = async (member) => {
    // Load config
    const config = getWelcomeConfig();
    const goodbyeConfig = config.goodbye || {};

    // Load background
    const bgFilename = goodbyeConfig.backgroundImage || 'goodbye_template.png';
    const backgroundPath = path.join(__dirname, `../assets/${bgFilename}`);

    let background;
    try {
        background = await Canvas.loadImage(backgroundPath);
    } catch (e) {
        console.error("Failed to load goodbye background", e);
        throw e;
    }

    const canvas = Canvas.createCanvas(background.width, background.height);
    const context = canvas.getContext('2d');

    // Draw Background
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Draw Avatar
    if (goodbyeConfig.avatar && goodbyeConfig.avatar.enabled) {
        try {
            const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 });
            const avatar = await Canvas.loadImage(avatarURL);
            context.drawImage(avatar, goodbyeConfig.avatar.x, goodbyeConfig.avatar.y, goodbyeConfig.avatar.width, goodbyeConfig.avatar.height);
        } catch (e) {
            console.error("Failed to load avatar", e);
        }
    }

    // Draw Stamp
    if (goodbyeConfig.stamp && goodbyeConfig.stamp.enabled) {
        try {
            const stampPath = path.join(__dirname, '../assets/goodbye_stamp.png');
            const stamp = await Canvas.loadImage(stampPath);

            context.save();
            // Translate to center of stamp
            const centerX = goodbyeConfig.stamp.x + goodbyeConfig.stamp.width / 2;
            const centerY = goodbyeConfig.stamp.y + goodbyeConfig.stamp.height / 2;
            context.translate(centerX, centerY);

            // Rotate
            context.rotate(goodbyeConfig.stamp.rotation * Math.PI / 180);

            // Draw image centered at (0,0)
            context.drawImage(stamp, -goodbyeConfig.stamp.width / 2, -goodbyeConfig.stamp.height / 2, goodbyeConfig.stamp.width, goodbyeConfig.stamp.height);

            context.restore();
        } catch (e) {
            console.error("Failed to load goodbye stamp", e);
        }
    }

    // Draw Text Fields
    if (goodbyeConfig.textFields) {
        goodbyeConfig.textFields.forEach(field => {
            context.font = `${field.fontSize}px ${field.fontFamily || 'sans-serif'}`;
            context.fillStyle = field.color;

            let text = '';
            switch (field.id) {
                case 'username':
                    text = member.user.username;
                    break;
                case 'userId':
                    text = member.id;
                    break;
                default:
                    text = field.label; // Fallback
            }

            context.fillText(text, field.x, field.y);
        });
    }

    return canvas.toBuffer();
};

module.exports = { createGoodbyeImage };

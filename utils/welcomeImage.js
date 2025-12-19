const Canvas = require('canvas');
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const createWelcomeImage = async (member, data = {}) => {
    // Reload config to get latest dashboard changes
    let config;
    try {
        const configData = fs.readFileSync(path.join(__dirname, '../config.json'), 'utf8');
        config = JSON.parse(configData);
    } catch (err) {
        console.error("Error reloading config:", err);
        config = require('../config.json'); // Fallback
    }

    // Load background image
    let backgroundPath;
    // Check if it's a Kartu Pelajar generation (data.class exists) or user has student role
    const isStudent = (data && data.class) || (config.class && config.class.studentRoleId && member.roles.cache.has(config.class.studentRoleId));

    if (isStudent && config.class) {
        // Check for Female Role
        if (config.class.studentFemaleRoleId && member.roles.cache.has(config.class.studentFemaleRoleId) && config.class.femaleBackgroundImage) {
            backgroundPath = path.join(__dirname, `../assets/${config.class.femaleBackgroundImage}`);
        } else {
            backgroundPath = path.join(__dirname, `../assets/${config.class.backgroundImage}`);
        }
    } else if (config.goodbye && config.goodbye.enabled && member.guild && !member.guild.members.cache.has(member.id)) {
        // This is a goodbye event (approximate check)
        backgroundPath = path.join(__dirname, `../assets/${config.goodbye.backgroundImage}`);
    } else {
        backgroundPath = path.join(__dirname, `../assets/${config.backgroundImage || 'template.png'}`);
    }

    let background;
    try {
        background = await Canvas.loadImage(backgroundPath);
    } catch (e) {
        console.error("Failed to load background, falling back to default if possible or erroring out", e);
        throw e;
    }

    const canvas = Canvas.createCanvas(background.width, background.height);
    const context = canvas.getContext('2d');

    // Draw Background
    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    // Draw Avatar - Select the correct avatar config based on mode
    let avatarConfig;
    if (isStudent) {
        // Check if it's female student card
        const isFemale = config.class.studentFemaleRoleId && member.roles.cache.has(config.class.studentFemaleRoleId);
        avatarConfig = isFemale ? (config.class.femaleAvatar || config.class.avatar || config.avatar) : (config.class.avatar || config.avatar);
    } else {
        // Welcome/Goodbye uses root avatar config
        avatarConfig = config.avatar;
    }

    if (avatarConfig && avatarConfig.enabled) {
        try {
            const avatarURL = member.user.displayAvatarURL({ extension: 'png', size: 512 });
            const avatar = await Canvas.loadImage(avatarURL);

            if (isStudent) {
                // Circular Avatar for Student Card
                context.save();
                context.beginPath();
                const avatarX = avatarConfig.x;
                const avatarY = avatarConfig.y;
                const avatarWidth = avatarConfig.width;
                const avatarHeight = avatarConfig.height;
                const radius = Math.min(avatarWidth, avatarHeight) / 2;

                context.arc(avatarX + avatarWidth / 2, avatarY + avatarHeight / 2, radius, 0, Math.PI * 2, true);
                context.closePath();
                context.clip();

                context.drawImage(avatar, avatarX, avatarY, avatarWidth, avatarHeight);
                context.restore();
            } else {
                // Standard Square Avatar for Welcome Image
                context.drawImage(avatar, avatarConfig.x, avatarConfig.y, avatarConfig.width, avatarConfig.height);
            }
        } catch (e) {
            console.error("Failed to load avatar", e);
        }
    }

    // Draw Stamp
    if (!isStudent && config.stamp && config.stamp.enabled) {
        try {
            const stampPath = path.join(__dirname, '../assets/stamp.png');
            const stamp = await Canvas.loadImage(stampPath);

            context.save();
            // Translate to center of stamp
            const centerX = config.stamp.x + config.stamp.width / 2;
            const centerY = config.stamp.y + config.stamp.height / 2;
            context.translate(centerX, centerY);

            // Rotate (convert degrees to radians)
            context.rotate(config.stamp.rotation * Math.PI / 180);

            // Draw image centered at (0,0)
            context.drawImage(stamp, -config.stamp.width / 2, -config.stamp.height / 2, config.stamp.width, config.stamp.height);

            context.restore();
        } catch (e) {
            console.error("Failed to load stamp", e);
        }
    }

    // Draw Class Checkmark
    if (config.class && config.class.enabled && data.class) {
        const classOption = config.class.options[data.class];
        if (classOption) {
            try {
                const checklistPath = path.join(__dirname, `../assets/${config.class.checklistImage}`);
                const checklist = await Canvas.loadImage(checklistPath);

                const width = config.class.checklistWidth || 50;
                const height = config.class.checklistHeight || 50;

                // Draw image centered at the coordinates
                context.drawImage(checklist, classOption.x - width / 2, classOption.y - height / 2, width, height);
            } catch (e) {
                console.error("Failed to load checklist image", e);
                // Fallback to text if image fails
                context.font = `${config.class.fontSize}px sans-serif`;
                context.fillStyle = config.class.color;
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(config.class.symbol, classOption.x, classOption.y);
                context.textAlign = 'start';
                context.textBaseline = 'alphabetic';
            }
        }
    }

    // Draw Text Fields
    let fieldsToDraw;
    if (isStudent) {
        // Check if user has female role
        const isFemale = config.class.studentFemaleRoleId && member.roles.cache.has(config.class.studentFemaleRoleId);
        fieldsToDraw = isFemale ? (config.class.femaleStudentFields || config.class.studentFields || []) : (config.class.studentFields || []);
    } else {
        fieldsToDraw = config.textFields;
    }

    fieldsToDraw.forEach(field => {
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
            case 'joinDate':
                text = member.joinedAt.toLocaleDateString('id-ID');
                break;
            case 'memberCount':
                text = (data.memberCount || member.guild.memberCount).toString();
                break;

            case 'namaSiswa':
                text = data.namaSiswa || member.displayName;
                break;
            case 'nisn':
                text = member.id;
                break;
            case 'jurusan':
                // Auto-assign jurusan based on roles
                if (config.selfRoles) {
                    const foundRole = config.selfRoles.find(role => member.roles.cache.has(role.value));
                    if (foundRole) {
                        text = foundRole.label;
                    } else {
                        text = "Belum Ada Jurusan";
                    }
                } else {
                    text = "Jurusan Tidak Dikonfigurasi";
                }
                break;
            default:
                text = data[field.id] || field.label; // Use data if available, else fallback to label
        }

        context.fillText(text, field.x, field.y);
    });

    return canvas.toBuffer();
};

module.exports = { createWelcomeImage };

const canvas = document.getElementById('previewCanvas');
const ctx = canvas.getContext('2d');
let config = {};
let currentMode = 'welcome';
let backgroundImage = new Image();
let voicePreviewImage = new Image();

// Load initial config
fetch('/config')
    .then(res => res.json())
    .then(data => {
        config = data;
        // Ensure goodbye config exists
        if (!config.goodbye) {
            config.goodbye = {
                backgroundImage: 'goodbye_template.png',
                avatar: { x: 50, y: 50, width: 200, height: 200, enabled: true },
                stamp: { x: 100, y: 100, width: 150, height: 150, rotation: 0, enabled: true },
                textFields: []
            };
        }
        // Ensure class config exists
        if (!config.class) {
            config.class = {
                enabled: true,
                symbol: "X",
                fontSize: 40,
                color: "#000000",
                options: {
                    X: { x: 725, y: 800 },
                    XI: { x: 830, y: 800 },
                    XII: { x: 935, y: 800 }
                }
            };
        }
        switchMode('welcome');
    });

function getActiveConfig() {
    return (currentMode === 'welcome' || currentMode === 'kartuPelajar' || currentMode === 'kartuPelajarFemale') ? config : config.goodbye;
}

function switchMode(mode) {
    currentMode = mode;

    // Update buttons
    document.getElementById('btnWelcome').style.backgroundColor = mode === 'welcome' ? '#0056b3' : '#6c757d';
    document.getElementById('btnKartuPelajar').style.backgroundColor = mode === 'kartuPelajar' ? '#0056b3' : '#6c757d';
    document.getElementById('btnKartuPelajarFemale').style.backgroundColor = mode === 'kartuPelajarFemale' ? '#0056b3' : '#6c757d';
    document.getElementById('btnGoodbye').style.backgroundColor = mode === 'goodbye' ? '#0056b3' : '#6c757d';
    const btnVoice = document.getElementById('btnVoiceStreak');
    if (btnVoice) btnVoice.style.backgroundColor = mode === 'voiceStreak' ? '#0056b3' : '#6c757d';

    if (mode === 'voiceStreak') {
        renderControls();
        drawVoiceStreakPreview();
    } else {
        loadBackground();
        renderControls();
    }
}

function loadBackground() {
    const activeConfig = getActiveConfig();
    let defaultBg = 'template.png';
    let bgFilename = activeConfig.backgroundImage;

    if (currentMode === 'goodbye') {
        defaultBg = 'goodbye_template.png';
        bgFilename = activeConfig.backgroundImage || defaultBg;
    } else if (currentMode === 'kartuPelajar') {
        defaultBg = 'kartu_pelajar_template.png';
        if (activeConfig.class && activeConfig.class.backgroundImage) {
            bgFilename = activeConfig.class.backgroundImage;
        } else {
            bgFilename = defaultBg;
        }
    } else if (currentMode === 'kartuPelajarFemale') {
        defaultBg = 'kartu_pelajar_cewe.png';
        if (activeConfig.class && activeConfig.class.femaleBackgroundImage) {
            bgFilename = activeConfig.class.femaleBackgroundImage;
        } else {
            bgFilename = defaultBg;
        }
    } else {
        bgFilename = activeConfig.backgroundImage || defaultBg;
    }

    backgroundImage.src = `/assets/${bgFilename}?t=${new Date().getTime()}`;
    backgroundImage.onload = () => {
        canvas.width = backgroundImage.width;
        canvas.height = backgroundImage.height;
        draw();
    };
}

function draw() {
    const activeConfig = getActiveConfig();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(backgroundImage, 0, 0);

    // Draw Avatar Preview
    // Draw Avatar Preview - Select correct avatar config based on mode
    let avatarConfig;
    if (currentMode === 'kartuPelajar') {
        avatarConfig = activeConfig.class?.avatar || activeConfig.avatar;
    } else if (currentMode === 'kartuPelajarFemale') {
        avatarConfig = activeConfig.class?.femaleAvatar || activeConfig.avatar;
    } else {
        avatarConfig = activeConfig.avatar;
    }

    if (avatarConfig && avatarConfig.enabled) {
        if (currentMode === 'kartuPelajar' || currentMode === 'kartuPelajarFemale') {
            // Circular Avatar
            ctx.save();
            ctx.beginPath();
            const radius = Math.min(avatarConfig.width, avatarConfig.height) / 2;
            ctx.arc(avatarConfig.x + avatarConfig.width / 2, avatarConfig.y + avatarConfig.height / 2, radius, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();

            ctx.fillStyle = '#ccc';
            ctx.fillRect(avatarConfig.x, avatarConfig.y, avatarConfig.width, avatarConfig.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(avatarConfig.x, avatarConfig.y, avatarConfig.width, avatarConfig.height);

            ctx.restore();

            ctx.fillStyle = '#000';
            ctx.font = '20px sans-serif';
            ctx.fillText("Avatar", avatarConfig.x + 10, avatarConfig.y + 30);
        } else {
            // Square Avatar
            ctx.fillStyle = '#ccc';
            ctx.fillRect(avatarConfig.x, avatarConfig.y, avatarConfig.width, avatarConfig.height);
            ctx.strokeStyle = '#000';
            ctx.strokeRect(avatarConfig.x, avatarConfig.y, avatarConfig.width, avatarConfig.height);
            ctx.fillStyle = '#000';
            ctx.font = '20px sans-serif';
            ctx.fillText("Avatar", avatarConfig.x + 10, avatarConfig.y + 30);
        }
    }

    // Draw Stamp Preview (Only for Welcome/Goodbye)
    if (currentMode !== 'kartuPelajar' && currentMode !== 'kartuPelajarFemale' && activeConfig.stamp && activeConfig.stamp.enabled) {
        ctx.save();
        const centerX = activeConfig.stamp.x + activeConfig.stamp.width / 2;
        const centerY = activeConfig.stamp.y + activeConfig.stamp.height / 2;
        ctx.translate(centerX, centerY);
        ctx.rotate(activeConfig.stamp.rotation * Math.PI / 180);

        ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
        ctx.fillRect(-activeConfig.stamp.width / 2, -activeConfig.stamp.height / 2, activeConfig.stamp.width, activeConfig.stamp.height);
        ctx.strokeStyle = '#00f';
        ctx.strokeRect(-activeConfig.stamp.width / 2, -activeConfig.stamp.height / 2, activeConfig.stamp.width, activeConfig.stamp.height);
        ctx.fillStyle = '#00f';
        ctx.font = '20px sans-serif';
        ctx.fillText("Stamp", -20, 5);

        ctx.restore();
    }

    // Draw Class Checkmark Preview
    if ((currentMode === 'kartuPelajar' || currentMode === 'kartuPelajarFemale') && activeConfig.class && activeConfig.class.enabled) {
        if (activeConfig.class.options) {
            Object.keys(activeConfig.class.options).forEach(key => {
                const opt = activeConfig.class.options[key];

                // Draw Checklist Image Placeholder
                const width = activeConfig.class.checklistWidth || 50;
                const height = activeConfig.class.checklistHeight || 50;

                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.fillRect(opt.x - width / 2, opt.y - height / 2, width, height);
                ctx.strokeStyle = 'red';
                ctx.strokeRect(opt.x - width / 2, opt.y - height / 2, width, height);

                // Draw label
                ctx.save();
                ctx.font = '12px sans-serif';
                ctx.fillStyle = 'red';
                ctx.textAlign = 'center';
                ctx.fillText(key, opt.x, opt.y - height / 2 - 5);
                ctx.restore();
            });
        }
    }

    // Draw Text Fields
    let fields = [];
    if ((currentMode === 'kartuPelajar' || currentMode === 'kartuPelajarFemale') && activeConfig.class && activeConfig.class.studentFields) {
        fields = activeConfig.class.studentFields;
    } else if (activeConfig.textFields) {
        fields = activeConfig.textFields;
    }

    if (fields) {
        fields.forEach(field => {
            ctx.font = `${field.fontSize}px ${field.fontFamily || 'sans-serif'}`;
            ctx.fillStyle = field.color;
            ctx.fillText(field.label + " (Preview)", field.x, field.y);
        });
    }
}

function renderControls() {
    // Don't load other configs when in voiceStreak mode
    if (currentMode === 'voiceStreak') {
        // Voice Streak Controls
        const voiceStreakDiv = document.getElementById('voiceStreakSettings');
        if (voiceStreakDiv) voiceStreakDiv.style.display = 'block';
        
        // Hide other settings
        const bgSettings = document.getElementById('bgSettings');
        if (bgSettings) bgSettings.style.display = 'none';
        const avatarSettings = document.getElementById('avatarSettings');
        if (avatarSettings) avatarSettings.style.display = 'none';
        const stampSettings = document.getElementById('stampSettings');
        if (stampSettings) stampSettings.style.display = 'none';
        const classSettings = document.getElementById('classSettings');
        if (classSettings) classSettings.style.display = 'none';
        
        // Load voice streak config
        if (!config.voicePairStreakCard) config.voicePairStreakCard = {};
        const c = config.voicePairStreakCard;
        
        // defaults should match renderer defaults
        document.getElementById('vscAvatarSize').value = c.avatarSize ?? 116;
        document.getElementById('vscAvatarY').value = c.avatarY ?? 172;
        document.getElementById('vscLeftAvatarX').value = c.leftAvatarX ?? 160;
        document.getElementById('vscRightAvatarX').value = c.rightAvatarX ?? 740;
        document.getElementById('vscNamePillY').value = c.namePillY ?? 212;
        document.getElementById('vscFlameSize').value = c.flameSize ?? 82;
        document.getElementById('vscFlameY').value = c.flameY ?? 152;
        document.getElementById('vscNumberFontSize').value = c.numberFontSize ?? 76;
        document.getElementById('vscNumberY').value = c.numberY ?? 248;
        document.getElementById('vscLabelFontSize').value = c.labelFontSize ?? 22;
        document.getElementById('vscLabelY').value = c.labelY ?? 276;
        
        return; // Exit early for voiceStreak mode
    }
    
    const activeConfig = getActiveConfig();

    // Background Settings
    const bgSettings = document.getElementById('bgSettings');
    if (bgSettings) bgSettings.style.display = (currentMode === 'welcome' || currentMode === 'goodbye') ? 'block' : 'none';

    // Avatar Controls - Select the correct avatar config based on mode
    const avatarSettings = document.getElementById('avatarSettings');
    if (avatarSettings) avatarSettings.style.display = 'block';
    
    // Hide voice streak settings
    const voiceStreakDiv = document.getElementById('voiceStreakSettings');
    if (voiceStreakDiv) voiceStreakDiv.style.display = 'none';

    let avatarConfig;
    if (currentMode === 'kartuPelajar') {
        avatarConfig = activeConfig.class?.avatar || activeConfig.avatar;
    } else if (currentMode === 'kartuPelajarFemale') {
        avatarConfig = activeConfig.class?.femaleAvatar || activeConfig.avatar;
    } else {
        avatarConfig = activeConfig.avatar;
    }

    if (avatarConfig) {
        document.getElementById('avatarEnabled').checked = avatarConfig.enabled;
        document.getElementById('avatarX').value = avatarConfig.x;
        document.getElementById('avatarY').value = avatarConfig.y;
        document.getElementById('avatarSize').value = avatarConfig.width;
    }

    // Stamp Controls
    const stampSettings = document.getElementById('stampSettings');
    if (stampSettings) stampSettings.style.display = (currentMode === 'welcome' || currentMode === 'goodbye') ? 'block' : 'none';

    if (activeConfig.stamp) {
        document.getElementById('stampEnabled').checked = activeConfig.stamp.enabled;
        document.getElementById('stampX').value = activeConfig.stamp.x;
        document.getElementById('stampY').value = activeConfig.stamp.y;
        document.getElementById('stampSize').value = activeConfig.stamp.width;
        document.getElementById('stampRotation').value = activeConfig.stamp.rotation;
    }

    // Class Settings Controls
    const classSettingsDiv = document.getElementById('classSettings');
    if ((currentMode === 'kartuPelajar' || currentMode === 'kartuPelajarFemale') && activeConfig.class) {
        classSettingsDiv.style.display = 'block';

        // Common Settings (Shared)
        document.getElementById('classEnabled').checked = activeConfig.class.enabled;
        document.getElementById('checklistImage').value = activeConfig.class.checklistImage || 'checklist.png';
        document.getElementById('checklistWidth').value = activeConfig.class.checklistWidth || 50;
        document.getElementById('checklistHeight').value = activeConfig.class.checklistHeight || 50;
        document.getElementById('classSymbol').value = activeConfig.class.symbol;
        document.getElementById('classSize').value = activeConfig.class.fontSize;
        document.getElementById('classColor').value = activeConfig.class.color;

        // Populate Jurusan Settings
        if (activeConfig.class.studentFields) {
            const jurusanField = activeConfig.class.studentFields.find(f => f.id === 'jurusan');
            if (jurusanField) {
                document.getElementById('jurusanX').value = jurusanField.x;
                document.getElementById('jurusanY').value = jurusanField.y;
                document.getElementById('jurusanSize').value = jurusanField.fontSize;
                document.getElementById('jurusanColor').value = jurusanField.color;
            }
        }

        // Populate Class Options (X, XI, XII)
        if (activeConfig.class.options) {
            if (activeConfig.class.options.X) {
                document.getElementById('classX_x').value = activeConfig.class.options.X.x;
                document.getElementById('classX_y').value = activeConfig.class.options.X.y;
                document.getElementById('classX_roleId').value = activeConfig.class.options.X.roleId || '';
            }
            if (activeConfig.class.options.XI) {
                document.getElementById('classXI_x').value = activeConfig.class.options.XI.x;
                document.getElementById('classXI_y').value = activeConfig.class.options.XI.y;
                document.getElementById('classXI_roleId').value = activeConfig.class.options.XI.roleId || '';
            }
            if (activeConfig.class.options.XII) {
                document.getElementById('classXII_x').value = activeConfig.class.options.XII.x;
                document.getElementById('classXII_y').value = activeConfig.class.options.XII.y;
                document.getElementById('classXII_roleId').value = activeConfig.class.options.XII.roleId || '';
            }
        }

        // Mode Specific Settings - Toggle male/female settings
        const maleSettings = document.getElementById('maleSettings');
        const femaleSettings = document.getElementById('femaleSettings');

        if (maleSettings && femaleSettings) {
            if (currentMode === 'kartuPelajar') {
                maleSettings.style.display = 'block';
                femaleSettings.style.display = 'none';
                if (document.getElementById('studentRoleId')) {
                    document.getElementById('studentRoleId').value = activeConfig.class.studentRoleId || '';
                }
            } else if (currentMode === 'kartuPelajarFemale') {
                maleSettings.style.display = 'none';
                femaleSettings.style.display = 'block';
                if (document.getElementById('studentFemaleRoleId')) {
                    document.getElementById('studentFemaleRoleId').value = activeConfig.class.studentFemaleRoleId || '';
                }
            }
        }
    } else {
        classSettingsDiv.style.display = 'none';
    }


    const container = document.getElementById('textFields');
    container.innerHTML = '<h3>Text Fields (Positioning)</h3>';

    // Show text fields only in Kartu Pelajar or Goodbye mode
    let fields = [];
    if ((currentMode === 'kartuPelajar' || currentMode === 'kartuPelajarFemale') && activeConfig.class && activeConfig.class.studentFields) {
        fields = activeConfig.class.studentFields;
    } else if (activeConfig.textFields) {
        fields = activeConfig.textFields;
    }

    if (fields.length > 0) {
        fields.forEach((field, index) => {
            const div = document.createElement('div');
            div.className = 'field-group';
            div.innerHTML = `
                <label>${field.label}</label>
                X: <input type="number" value="${field.x}" onchange="updateField(${index}, 'x', this.value)">
                Y: <input type="number" value="${field.y}" onchange="updateField(${index}, 'y', this.value)">
                Size: <input type="number" value="${field.fontSize}" onchange="updateField(${index}, 'fontSize', this.value)">
                Color: <input type="color" value="${field.color}" onchange="updateField(${index}, 'color', this.value)">
            `;
            container.appendChild(div);
        });
    }
}

function updateVoiceStreakCard(key, value) {
    if (!config.voicePairStreakCard) config.voicePairStreakCard = {};
    config.voicePairStreakCard[key] = parseInt(value);
    drawVoiceStreakPreview();
}

function drawVoiceStreakPreview() {
    // server-rendered PNG into the same canvas
    // Send current config to preview endpoint for live updates
    const cardConfig = config.voicePairStreakCard || {};
    const configStr = encodeURIComponent(JSON.stringify(cardConfig));
    voicePreviewImage = new Image();
    voicePreviewImage.src = `/preview-voice-streak?t=${Date.now()}&config=${configStr}`;
    voicePreviewImage.onload = () => {
        canvas.width = voicePreviewImage.width;
        canvas.height = voicePreviewImage.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(voicePreviewImage, 0, 0);
    };
    voicePreviewImage.onerror = (err) => {
        console.error('Failed to load preview:', err);
        ctx.fillStyle = '#ff0000';
        ctx.font = '20px sans-serif';
        ctx.fillText('Preview Error - Check console', 10, 30);
    };
}

function updateAvatar(key, value) {
    const activeConfig = getActiveConfig();

    // Select the correct avatar config to update based on current mode
    let avatarConfig;
    if (currentMode === 'kartuPelajar') {
        if (!activeConfig.class) activeConfig.class = {};
        if (!activeConfig.class.avatar) activeConfig.class.avatar = { x: 755, y: 185, width: 183, height: 183, enabled: true };
        avatarConfig = activeConfig.class.avatar;
    } else if (currentMode === 'kartuPelajarFemale') {
        if (!activeConfig.class) activeConfig.class = {};
        if (!activeConfig.class.femaleAvatar) activeConfig.class.femaleAvatar = { x: 755, y: 185, width: 183, height: 183, enabled: true };
        avatarConfig = activeConfig.class.femaleAvatar;
    } else {
        if (!activeConfig.avatar) activeConfig.avatar = { x: 50, y: 50, width: 200, height: 200, enabled: true };
        avatarConfig = activeConfig.avatar;
    }

    if (key === 'size') {
        avatarConfig.width = parseInt(value);
        avatarConfig.height = parseInt(value);
    } else if (key === 'enabled') {
        avatarConfig.enabled = value;
    } else {
        avatarConfig[key] = parseInt(value);
    }
    draw();
}

function updateStamp(key, value) {
    const activeConfig = getActiveConfig();
    if (!activeConfig.stamp) activeConfig.stamp = { x: 100, y: 100, width: 150, height: 150, rotation: 0, enabled: true };

    if (key === 'size') {
        activeConfig.stamp.width = parseInt(value);
        activeConfig.stamp.height = parseInt(value);
    } else if (key === 'enabled') {
        activeConfig.stamp.enabled = value;
    } else {
        activeConfig.stamp[key] = parseInt(value);
    }
    draw();
}

function updateClass(key, value, optionKey) {
    const activeConfig = getActiveConfig();
    if (!activeConfig.class) return;

    if (key === 'enabled') {
        activeConfig.class.enabled = value;
    } else if (key === 'fontSize') {
        activeConfig.class.fontSize = parseInt(value);
    } else if (key === 'checklistWidth' || key === 'checklistHeight') {
        activeConfig.class[key] = parseInt(value);
    } else if (key === 'x' || key === 'y') {
        if (optionKey && activeConfig.class.options[optionKey]) {
            activeConfig.class.options[optionKey][key] = parseInt(value);
        }
    } else if (key === 'roleId') {
        if (optionKey && activeConfig.class.options[optionKey]) {
            activeConfig.class.options[optionKey][key] = value;
        }
    } else {
        activeConfig.class[key] = value;
    }
    draw();
}

function updateField(index, key, value) {
    const activeConfig = getActiveConfig();
    let fields = [];

    if (currentMode === 'kartuPelajar' || currentMode === 'kartuPelajarFemale') {
        if (activeConfig.class && activeConfig.class.studentFields) {
            fields = activeConfig.class.studentFields;
        }
    } else if (activeConfig.textFields) {
        fields = activeConfig.textFields;
    }

    if (fields[index]) {
        fields[index][key] = key === 'fontSize' || key === 'x' || key === 'y' ? parseInt(value) : value;
    }
    draw();
}

function updateJurusan(key, value) {
    const activeConfig = getActiveConfig();
    if (!activeConfig.class || !activeConfig.class.studentFields) return;

    const jurusanField = activeConfig.class.studentFields.find(f => f.id === 'jurusan');
    if (jurusanField) {
        jurusanField[key] = key === 'fontSize' || key === 'x' || key === 'y' ? parseInt(value) : value;
        draw();
    }
}

function saveConfig() {
    // Read current config from server first to avoid overwriting other changes
    fetch('/config')
        .then(res => res.json())
        .then(serverConfig => {
            // Merge: keep server config, but update current mode's config
            if (currentMode === 'voiceStreak') {
                serverConfig.voicePairStreakCard = config.voicePairStreakCard || {};
            } else if (currentMode === 'welcome') {
                serverConfig.backgroundImage = config.backgroundImage;
                serverConfig.avatar = config.avatar;
                serverConfig.stamp = config.stamp;
                serverConfig.textFields = config.textFields;
            } else if (currentMode === 'goodbye') {
                if (!serverConfig.goodbye) serverConfig.goodbye = {};
                serverConfig.goodbye.backgroundImage = config.goodbye.backgroundImage;
                serverConfig.goodbye.avatar = config.goodbye.avatar;
                serverConfig.goodbye.stamp = config.goodbye.stamp;
                serverConfig.goodbye.textFields = config.goodbye.textFields;
            } else if (currentMode === 'kartuPelajar' || currentMode === 'kartuPelajarFemale') {
                if (!serverConfig.class) serverConfig.class = {};
                serverConfig.class.backgroundImage = config.class?.backgroundImage;
                serverConfig.class.femaleBackgroundImage = config.class?.femaleBackgroundImage;
                serverConfig.class.avatar = config.class?.avatar;
                serverConfig.class.femaleAvatar = config.class?.femaleAvatar;
                serverConfig.class.studentFields = config.class?.studentFields;
                serverConfig.class.options = config.class?.options;
                serverConfig.class.enabled = config.class?.enabled;
                serverConfig.class.symbol = config.class?.symbol;
                serverConfig.class.fontSize = config.class?.fontSize;
                serverConfig.class.color = config.class?.color;
                serverConfig.class.checklistImage = config.class?.checklistImage;
                serverConfig.class.checklistWidth = config.class?.checklistWidth;
                serverConfig.class.checklistHeight = config.class?.checklistHeight;
                serverConfig.class.studentRoleId = config.class?.studentRoleId;
                serverConfig.class.studentFemaleRoleId = config.class?.studentFemaleRoleId;
            }
            
            return fetch('/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(serverConfig)
            });
        })
        .then(() => {
            alert('Configuration saved!');
            // Reload config from server to sync
            return fetch('/config');
        })
        .then(res => res.json())
        .then(data => {
            config = data;
            renderControls();
            if (currentMode === 'voiceStreak') {
                drawVoiceStreakPreview();
            } else {
                loadBackground();
            }
        })
        .catch(err => {
            console.error('Save error:', err);
            alert('Error saving configuration');
        });
}

function uploadBackground() {
    const input = document.getElementById('bgUpload');
    if (input.files.length === 0) return alert('Select a file first');

    const formData = new FormData();
    formData.append('background', input.files[0]);

    const endpoint = currentMode === 'welcome' ? '/upload' : '/upload-goodbye';

    fetch(endpoint, {
        method: 'POST',
        body: formData
    }).then(() => {
        alert('Background uploaded!');
        loadBackground();
    });
}

function uploadKartuPelajarBackground() {
    const input = document.getElementById('kpBgUpload');
    if (input.files.length === 0) return alert('Select a file first');

    const formData = new FormData();
    formData.append('background', input.files[0]);

    fetch('/upload-kartu-pelajar', {
        method: 'POST',
        body: formData
    }).then(() => {
        alert('Kartu Pelajar Background uploaded!');
        loadBackground();
    });
}

function uploadKartuPelajarFemale() {
    const input = document.getElementById('kartuPelajarFemaleUpload');
    if (input.files.length === 0) return alert('Select a file first');

    const formData = new FormData();
    formData.append('background', input.files[0]);

    fetch('/upload-kartu-pelajar-female', {
        method: 'POST',
        body: formData
    }).then(() => {
        alert('Kartu Pelajar (Female) Background uploaded!');
        loadBackground();
    });
}

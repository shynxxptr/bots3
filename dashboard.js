const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { generateVoicePairStreakCard } = require('./utils/voicePairStreakRenderer');

const app = express();
const port = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/');
    },
    filename: (req, file, cb) => {
        cb(null, 'template.png'); // Always overwrite template.png for simplicity
    }
});
const upload = multer({ storage: storage });

// Routes
app.get('/config', (req, res) => {
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading config');
        res.json(JSON.parse(data));
    });
});

app.post('/config', (req, res) => {
    const newConfig = req.body;
    fs.writeFile('config.json', JSON.stringify(newConfig, null, 4), (err) => {
        if (err) return res.status(500).send('Error saving config');
        res.send('Config saved');
    });
});

// Voice Streak preview (PNG)
app.get('/preview-voice-streak', async (req, res) => {
    try {
        // Read base config
        const baseConfig = JSON.parse(fs.readFileSync('config.json', 'utf8'));
        
        // Get cardConfig from query string if provided (for live preview)
        let cardConfig = baseConfig.voicePairStreakCard || {};
        if (req.query.config) {
            try {
                const queryConfig = JSON.parse(decodeURIComponent(req.query.config));
                cardConfig = { ...cardConfig, ...queryConfig };
            } catch (e) {
                console.warn('Invalid config JSON in query:', e.message);
                // Invalid JSON, use base config
            }
        }

        // Use local placeholder avatars for preview
        // Try multiple possible avatar files
        const possibleAvatars = ['logo.png', 'stamp.png', 'template.png'];
        let leftAvatar = null;
        let rightAvatar = null;
        
        for (const avatar of possibleAvatars) {
            const avatarPath = path.join(__dirname, 'assets', avatar);
            if (fs.existsSync(avatarPath)) {
                if (!leftAvatar) leftAvatar = avatarPath;
                else if (!rightAvatar) {
                    rightAvatar = avatarPath;
                    break;
                }
            }
        }
        
        // Fallback: create a simple colored square if no avatar found
        if (!leftAvatar) {
            leftAvatar = path.join(__dirname, 'assets', 'logo.png'); // Will be handled by renderer
        }
        if (!rightAvatar) {
            rightAvatar = path.join(__dirname, 'assets', 'stamp.png'); // Will be handled by renderer
        }

        const leftUser = {
            username: 'Aza..-',
            displayAvatarURL: () => leftAvatar,
        };
        const rightUser = {
            username: 'nezura',
            displayAvatarURL: () => rightAvatar,
        };

        const attachment = await generateVoicePairStreakCard({
            leftUser,
            rightUser,
            streak: 24,
            cardConfig: cardConfig,
        });

        res.setHeader('Content-Type', 'image/png');
        res.send(attachment.attachment);
    } catch (err) {
        console.error('Preview error:', err);
        // Return a simple error image
        const Canvas = require('canvas');
        const canvas = Canvas.createCanvas(900, 300);
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 900, 300);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Preview Error: ' + err.message, 450, 150);
        res.setHeader('Content-Type', 'image/png');
        res.send(canvas.toBuffer());
    }
});

app.post('/upload', upload.single('background'), (req, res) => {
    // Update config to ensure it points to the correct file (though we overwrite template.png)
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading config');
        const config = JSON.parse(data);
        config.backgroundImage = 'template.png';
        fs.writeFile('config.json', JSON.stringify(config, null, 4), (err) => {
            if (err) return res.status(500).send('Error saving config');
            res.send('Image uploaded');
        });
    });
});

// Goodbye Upload
const storageGoodbye = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/');
    },
    filename: (req, file, cb) => {
        cb(null, 'goodbye_template.png');
    }
});
const uploadGoodbye = multer({ storage: storageGoodbye });

app.post('/upload-goodbye', uploadGoodbye.single('background'), (req, res) => {
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading config');
        const config = JSON.parse(data);
        if (!config.goodbye) config.goodbye = {};
        config.goodbye.backgroundImage = 'goodbye_template.png';
        fs.writeFile('config.json', JSON.stringify(config, null, 4), (err) => {
            if (err) return res.status(500).send('Error saving config');
            res.send('Goodbye Image uploaded');
        });
    });
});

// Kartu Pelajar Upload
const storageKartuPelajar = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/');
    },
    filename: (req, file, cb) => {
        cb(null, 'kartu_pelajar_template.png');
    }
});
const uploadKartuPelajar = multer({ storage: storageKartuPelajar });

app.post('/upload-kartu-pelajar', uploadKartuPelajar.single('background'), (req, res) => {
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading config');
        const config = JSON.parse(data);
        if (!config.class) config.class = {};
        config.class.backgroundImage = 'kartu_pelajar_template.png';
        fs.writeFile('config.json', JSON.stringify(config, null, 4), (err) => {
            if (err) return res.status(500).send('Error saving config');
            res.send('Kartu Pelajar Image uploaded');
        });
    });
});

// Kartu Pelajar Female Upload
const storageKartuPelajarFemale = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'assets/');
    },
    filename: (req, file, cb) => {
        cb(null, 'kartu_pelajar_cewe.png');
    }
});
const uploadKartuPelajarFemale = multer({ storage: storageKartuPelajarFemale });

app.post('/upload-kartu-pelajar-female', uploadKartuPelajarFemale.single('background'), (req, res) => {
    fs.readFile('config.json', 'utf8', (err, data) => {
        if (err) return res.status(500).send('Error reading config');
        const config = JSON.parse(data);
        if (!config.class) config.class = {};
        config.class.femaleBackgroundImage = 'kartu_pelajar_cewe.png';
        fs.writeFile('config.json', JSON.stringify(config, null, 4), (err) => {
            if (err) return res.status(500).send('Error saving config');
            res.send('Kartu Pelajar (Female) Image uploaded');
        });
    });
});

app.listen(port, () => {
    console.log(`Dashboard running at http://localhost:${port}`);
});

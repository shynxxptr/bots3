const fs = require('fs');
const path = require('path');

const TEMPLATES_DIR = path.join(__dirname, '../assets/profiles/templates');
const TEMPLATES_DB_PATH = path.join(__dirname, '../data/profile_templates.json');

// Ensure directories exist
if (!fs.existsSync(TEMPLATES_DIR)) {
    fs.mkdirSync(TEMPLATES_DIR, { recursive: true });
}

// Default templates definition
const DEFAULT_TEMPLATES = [
    {
        id: 'classic',
        name: 'Classic',
        premium: false,
        description: 'Simple & clean design',
        path: 'assets/profiles/templates/classic/'
    },
    {
        id: 'school',
        name: 'School',
        premium: false,
        description: 'Tema sekolah S3',
        path: 'assets/profiles/templates/school/'
    },
    {
        id: 'minimalist',
        name: 'Minimalist',
        premium: false,
        description: 'Minimal design',
        path: 'assets/profiles/templates/minimalist/'
    },
    {
        id: 'dark',
        name: 'Dark',
        premium: false,
        description: 'Dark theme',
        path: 'assets/profiles/templates/dark/'
    },
    {
        id: 'light',
        name: 'Light',
        premium: false,
        description: 'Light theme',
        path: 'assets/profiles/templates/light/'
    },
    {
        id: 'colorful',
        name: 'Colorful',
        premium: true,
        description: 'Bright & vibrant',
        path: 'assets/profiles/templates/colorful/'
    },
    {
        id: 'romantic',
        name: 'Romantic',
        premium: true,
        description: 'Pink & romantic theme',
        path: 'assets/profiles/templates/romantic/'
    },
    {
        id: 'gaming',
        name: 'Gaming',
        premium: true,
        description: 'Gaming theme',
        path: 'assets/profiles/templates/gaming/'
    },
    {
        id: 'neon',
        name: 'Neon',
        premium: true,
        description: 'Neon colors',
        path: 'assets/profiles/templates/neon/'
    },
    {
        id: 'epic',
        name: 'Epic',
        premium: true,
        description: 'Epic & dramatic',
        path: 'assets/profiles/templates/epic/'
    }
];

function loadTemplatesDB() {
    try {
        if (!fs.existsSync(TEMPLATES_DB_PATH)) {
            const initial = {
                templates: DEFAULT_TEMPLATES,
                userTemplates: {}
            };
            fs.writeFileSync(TEMPLATES_DB_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        const db = JSON.parse(fs.readFileSync(TEMPLATES_DB_PATH, 'utf8'));
        // Merge with defaults to ensure all templates exist
        db.templates = DEFAULT_TEMPLATES;
        return db;
    } catch (err) {
        console.error('Failed to load templates database:', err);
        return {
            templates: DEFAULT_TEMPLATES,
            userTemplates: {}
        };
    }
}

function saveTemplatesDB(db) {
    try {
        fs.writeFileSync(TEMPLATES_DB_PATH, JSON.stringify(db, null, 4));
    } catch (err) {
        console.error('Failed to save templates database:', err);
    }
}

/**
 * Get all templates
 * @param {string} role - User role (to filter premium)
 * @returns {array} Array of available templates
 */
function getAllTemplates(role = 'free') {
    const db = loadTemplatesDB();
    return db.templates.filter(t => !t.premium || role === 'premium' || role === 'staff');
}

/**
 * Get template by ID
 * @param {string} templateId - Template ID
 * @returns {object|null} Template data
 */
function getTemplate(templateId) {
    const db = loadTemplatesDB();
    return db.templates.find(t => t.id === templateId) || null;
}

/**
 * Load template config
 * @param {string} templateId - Template ID
 * @returns {object|null} Template config
 */
function loadTemplateConfig(templateId) {
    const template = getTemplate(templateId);
    if (!template) return null;
    
    const configPath = path.join(__dirname, '..', template.path, 'template.json');
    if (!fs.existsSync(configPath)) {
        // Return default config if file doesn't exist
        return {
            id: template.id,
            name: template.name,
            premium: template.premium,
            description: template.description,
            background: 'background.png',
            frame: 'frame_basic.png',
            defaultLayout: {
                avatarPosition: 'left',
                avatarSize: 160,
                textColor: '#FFFFFF',
                fontStyle: 'bold'
            },
            defaultStats: {
                enabled: ['voice_time', 'messages', 'prestasi', 'quotes', 'streak', 'voice_streak'],
                position: 'left'
            }
        };
    }
    
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
        console.error(`Failed to load template config for ${templateId}:`, err);
        return null;
    }
}

/**
 * Get user's custom templates
 * @param {string} userId - User ID
 * @returns {array} Array of user templates
 */
function getUserTemplates(userId) {
    const db = loadTemplatesDB();
    return db.userTemplates[userId] || [];
}

/**
 * Save user template (premium only)
 * @param {string} userId - User ID
 * @param {string} templateName - Template name
 * @param {object} customization - Customization data to save
 * @returns {object} Result object
 */
function saveUserTemplate(userId, templateName, customization) {
    const db = loadTemplatesDB();
    
    // Check if user already has 3 templates
    if (!db.userTemplates[userId]) {
        db.userTemplates[userId] = [];
    }
    
    if (db.userTemplates[userId].length >= 3) {
        return { success: false, error: 'Kamu sudah punya 3 custom templates! Hapus salah satu dulu.' };
    }
    
    // Generate template ID
    const templateId = `user_template_${Date.now()}`;
    const templatePath = path.join(TEMPLATES_DIR, `user_${userId}`, templateId);
    
    // Create directory
    if (!fs.existsSync(templatePath)) {
        fs.mkdirSync(templatePath, { recursive: true });
    }
    
    // Save template config
    const configPath = path.join(templatePath, 'template.json');
    const templateConfig = {
        id: templateId,
        name: templateName,
        premium: true,
        description: `Custom template by user`,
        userId: userId,
        customization: customization,
        createdAt: Date.now()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(templateConfig, null, 4));
    
    // Add to database
    db.userTemplates[userId].push({
        id: templateId,
        name: templateName,
        path: `assets/profiles/templates/user_${userId}/${templateId}/`
    });
    
    saveTemplatesDB(db);
    
    return { success: true, templateId, template: db.userTemplates[userId][db.userTemplates[userId].length - 1] };
}

/**
 * Delete user template
 * @param {string} userId - User ID
 * @param {string} templateId - Template ID
 * @returns {object} Result object
 */
function deleteUserTemplate(userId, templateId) {
    const db = loadTemplatesDB();
    
    if (!db.userTemplates[userId]) {
        return { success: false, error: 'Template tidak ditemukan!' };
    }
    
    const templateIndex = db.userTemplates[userId].findIndex(t => t.id === templateId);
    if (templateIndex === -1) {
        return { success: false, error: 'Template tidak ditemukan!' };
    }
    
    // Delete template directory
    const template = db.userTemplates[userId][templateIndex];
    const templatePath = path.join(__dirname, '..', template.path);
    if (fs.existsSync(templatePath)) {
        fs.rmSync(templatePath, { recursive: true, force: true });
    }
    
    // Remove from database
    db.userTemplates[userId].splice(templateIndex, 1);
    saveTemplatesDB(db);
    
    return { success: true };
}

/**
 * Load user template config
 * @param {string} userId - User ID
 * @param {string} templateId - Template ID
 * @returns {object|null} Template config
 */
function loadUserTemplateConfig(userId, templateId) {
    const db = loadTemplatesDB();
    const userTemplates = db.userTemplates[userId] || [];
    const template = userTemplates.find(t => t.id === templateId);
    
    if (!template) return null;
    
    const configPath = path.join(__dirname, '..', template.path, 'template.json');
    if (!fs.existsSync(configPath)) return null;
    
    try {
        return JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch (err) {
        console.error(`Failed to load user template config:`, err);
        return null;
    }
}

module.exports = {
    getAllTemplates,
    getTemplate,
    loadTemplateConfig,
    getUserTemplates,
    saveUserTemplate,
    deleteUserTemplate,
    loadUserTemplateConfig,
    TEMPLATES_DIR,
    TEMPLATES_DB_PATH,
};


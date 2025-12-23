const fs = require('fs');
const path = require('path');

const STORE_PATH = path.join(__dirname, '../data/quotes.json');

function loadStore() {
    try {
        if (!fs.existsSync(STORE_PATH)) {
            const initial = { quotes: [], authors: {} };
            fs.writeFileSync(STORE_PATH, JSON.stringify(initial, null, 4));
            return initial;
        }
        return JSON.parse(fs.readFileSync(STORE_PATH, 'utf8'));
    } catch (err) {
        console.error('Failed to load quote store:', err);
        return { quotes: [], authors: {} };
    }
}

function saveStore(store) {
    try {
        fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 4));
    } catch (err) {
        console.error('Failed to save quote store:', err);
    }
}

/**
 * Save a quote
 * @param {string} guildId - Guild ID
 * @param {string} authorId - User ID yang buat quote (yang di-quote)
 * @param {string} savedBy - User ID yang save quote
 * @param {string} content - Quote content
 * @param {string} messageId - Original message ID (optional)
 * @param {string} channelId - Original channel ID (optional)
 * @returns {object} Saved quote data
 */
function saveQuote(guildId, authorId, savedBy, content, messageId = null, channelId = null) {
    const store = loadStore();
    
    // Validate content
    if (!content || content.trim().length === 0) {
        return { success: false, error: 'Quote tidak boleh kosong!' };
    }
    
    if (content.length > 2000) {
        return { success: false, error: 'Quote terlalu panjang! Maksimal 2000 karakter.' };
    }
    
    const quote = {
        id: Date.now().toString(),
        guildId,
        authorId,
        savedBy,
        content: content.trim(),
        messageId,
        channelId,
        createdAt: Date.now(),
    };
    
    store.quotes.push(quote);
    
    // Track quote count per author
    const authorKey = `${guildId}-${authorId}`;
    if (!store.authors[authorKey]) {
        store.authors[authorKey] = {
            guildId,
            userId: authorId,
            quoteCount: 0,
        };
    }
    store.authors[authorKey].quoteCount = (store.authors[authorKey].quoteCount || 0) + 1;
    
    saveStore(store);
    
    return {
        success: true,
        quote: {
            id: quote.id,
            content: quote.content,
            authorId: quote.authorId,
            savedBy: quote.savedBy,
            createdAt: quote.createdAt,
        },
        totalQuotes: store.quotes.filter(q => q.guildId === guildId).length,
        authorQuoteCount: store.authors[authorKey].quoteCount,
    };
}

/**
 * Get random quote
 * @param {string} guildId - Guild ID
 * @param {string} authorId - Optional: filter by author
 * @returns {object|null} Random quote
 */
function getRandomQuote(guildId, authorId = null) {
    const store = loadStore();
    let quotes = store.quotes.filter(q => q.guildId === guildId);
    
    if (authorId) {
        quotes = quotes.filter(q => q.authorId === authorId);
    }
    
    if (quotes.length === 0) {
        return null;
    }
    
    const randomIndex = Math.floor(Math.random() * quotes.length);
    return quotes[randomIndex];
}

/**
 * Get quote by ID
 * @param {string} guildId - Guild ID
 * @param {string} quoteId - Quote ID
 * @returns {object|null} Quote data
 */
function getQuoteById(guildId, quoteId) {
    const store = loadStore();
    return store.quotes.find(q => q.guildId === guildId && q.id === quoteId) || null;
}

/**
 * Get quotes by author
 * @param {string} guildId - Guild ID
 * @param {string} authorId - Author user ID
 * @param {number} limit - Number of quotes to return
 * @returns {array} Array of quotes
 */
function getQuotesByAuthor(guildId, authorId, limit = 10) {
    const store = loadStore();
    return store.quotes
        .filter(q => q.guildId === guildId && q.authorId === authorId)
        .sort((a, b) => b.createdAt - a.createdAt)
        .slice(0, limit);
}

/**
 * Get top quoted users
 * @param {string} guildId - Guild ID
 * @param {number} limit - Number of users to return
 * @returns {array} Array of author data
 */
function getTopQuotedUsers(guildId, limit = 10) {
    const store = loadStore();
    const authors = Object.values(store.authors || {})
        .filter(a => a.guildId === guildId && a.quoteCount > 0)
        .sort((a, b) => (b.quoteCount || 0) - (a.quoteCount || 0))
        .slice(0, limit);
    
    return authors;
}

/**
 * Get total quotes count
 * @param {string} guildId - Guild ID
 * @returns {number} Total quotes count
 */
function getTotalQuotes(guildId) {
    const store = loadStore();
    return store.quotes.filter(q => q.guildId === guildId).length;
}

/**
 * Delete quote (staff-only)
 * @param {string} guildId - Guild ID
 * @param {string} quoteId - Quote ID
 * @returns {object} Result object
 */
function deleteQuote(guildId, quoteId) {
    const store = loadStore();
    const quoteIndex = store.quotes.findIndex(q => q.guildId === guildId && q.id === quoteId);
    
    if (quoteIndex === -1) {
        return { success: false, error: 'Quote tidak ditemukan!' };
    }
    
    const quote = store.quotes[quoteIndex];
    
    // Decrease author quote count
    const authorKey = `${guildId}-${quote.authorId}`;
    if (store.authors[authorKey]) {
        store.authors[authorKey].quoteCount = Math.max(0, (store.authors[authorKey].quoteCount || 0) - 1);
    }
    
    // Remove quote
    store.quotes.splice(quoteIndex, 1);
    saveStore(store);
    
    return { success: true, quote };
}

module.exports = {
    saveQuote,
    getRandomQuote,
    getQuoteById,
    getQuotesByAuthor,
    getTopQuotedUsers,
    getTotalQuotes,
    deleteQuote,
    STORE_PATH,
};





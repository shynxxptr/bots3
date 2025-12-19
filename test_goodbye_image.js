const fs = require('fs');
const { createGoodbyeImage } = require('./utils/goodbyeImage');

// Mock member object
const mockMember = {
    id: '123456789012345678',
    user: {
        username: 'TestUser',
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
    },
    guild: {
        memberCount: 100
    },
    joinedAt: new Date()
};

async function run() {
    try {
        console.log('Generating goodbye image...');
        const buffer = await createGoodbyeImage(mockMember);
        fs.writeFileSync('test_goodbye_output.png', buffer);
        console.log('Success! Saved to test_goodbye_output.png');
    } catch (error) {
        console.error('Error:', error);
    }
}

run();

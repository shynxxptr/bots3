const fs = require('fs');
const { createWelcomeImage } = require('./utils/welcomeImage');

const mockMember = {
    user: {
        username: 'TestUser',
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png' // Default Discord avatar
    },
    id: '123456789012345678',
    joinedAt: new Date(),
    guild: {
        memberCount: 100
    },
    displayName: 'Test User Display Name'
};

const runTest = async () => {
    try {
        console.log('Generating test image...');
        const buffer = await createWelcomeImage(mockMember);
        fs.writeFileSync('test_output.png', buffer);
        console.log('Test image saved to test_output.png');
    } catch (error) {
        console.error('Error generating image:', error);
    }
};

runTest();

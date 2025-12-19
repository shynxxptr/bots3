const fs = require('fs');
const { createWelcomeImage } = require('./utils/welcomeImage');

// Mock config to simulate roles
const config = require('./config.json');

const mockMember = {
    user: {
        username: 'SiswaTeladan',
        displayAvatarURL: () => 'https://cdn.discordapp.com/embed/avatars/0.png'
    },
    id: '123456789012345678', // NISN
    joinedAt: new Date(),
    guild: {
        memberCount: 100
    },
    roles: {
        cache: {
            has: (roleId) => {
                // Simulate having the "TGM" role
                const tgmRole = config.selfRoles.find(r => r.label.includes('TGM'));
                return roleId === tgmRole.value;
            }
        }
    },
    displayName: 'Siswa Display Name'
};

const runTest = async () => {
    try {
        console.log('Generating Kartu Pelajar test image...');

        // Test Case 1: Class X
        console.log('Generating for Class X...');
        const bufferX = await createWelcomeImage(mockMember, {
            namaSiswa: 'Budi Santoso',
            class: 'X'
        });
        fs.writeFileSync('test_kartu_pelajar_X.png', bufferX);
        console.log('Saved test_kartu_pelajar_X.png');

        // Test Case 2: Class XI
        console.log('Generating for Class XI...');
        const bufferXI = await createWelcomeImage(mockMember, {
            namaSiswa: 'Siti Aminah',
            class: 'XI'
        });
        fs.writeFileSync('test_kartu_pelajar_XI.png', bufferXI);
        console.log('Saved test_kartu_pelajar_XI.png');

        // Test Case 3: Class XII
        console.log('Generating for Class XII...');
        const bufferXII = await createWelcomeImage(mockMember, {
            namaSiswa: 'Joko Widodo',
            class: 'XII'
        });
        fs.writeFileSync('test_kartu_pelajar_XII.png', bufferXII);
        console.log('Saved test_kartu_pelajar_XII.png');

    } catch (error) {
        console.error('Error generating image:', error);
    }
};

runTest();

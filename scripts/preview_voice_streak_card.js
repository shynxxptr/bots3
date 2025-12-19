const path = require('path');
const fs = require('fs');

const { generateVoicePairStreakCard } = require('../utils/voicePairStreakRenderer');

async function main() {
    const leftAvatar = path.join(__dirname, '..', 'assets', 'logo.png');
    const rightAvatar = path.join(__dirname, '..', 'assets', 'stamp.png');

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
    });

    const outPath = path.join(__dirname, '..', 'preview_voice_streak.png');
    fs.writeFileSync(outPath, attachment.attachment);
    console.log(`Wrote preview to: ${outPath}`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});



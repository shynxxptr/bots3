const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const TARGET_GUILD_ID = '1356957569729560596';

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const guild = await client.guilds.fetch(TARGET_GUILD_ID);
        if (!guild) {
            console.error('Could not find target guild!');
            process.exit(1);
        }
        console.log(`Checking guild: ${guild.name} (${guild.id})`);

        const channels = await guild.channels.fetch();
        const logChannels = channels.filter(c => ['menfess-log', 'reply-log', 'mod-log'].includes(c.name));

        if (logChannels.size > 0) {
            console.log('Found existing log channels:');
            logChannels.forEach(c => console.log(`${c.name}: ${c.id}`));
        } else {
            console.log('No log channels found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.destroy();
    }
});

client.login(process.env.DISCORD_TOKEN);

const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const OLD_CHANNELS = [
    '1444842744861167668', // Old Total Members
    '1444842748648620093'  // Old Online Members
];

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    for (const channelId of OLD_CHANNELS) {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel) {
                await channel.delete();
                console.log(`Deleted old channel: ${channel.name} (${channel.id})`);
            }
        } catch (error) {
            if (error.code === 10003) {
                console.log(`Channel ${channelId} already deleted or not found.`);
            } else {
                console.error(`Failed to delete ${channelId}:`, error.message);
            }
        }
    }

    client.destroy();
});

client.login(process.env.DISCORD_TOKEN);

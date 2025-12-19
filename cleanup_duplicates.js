const { Client, GatewayIntentBits, ChannelType } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
const MAIN_GUILD_ID = '1444648380428062822';

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    try {
        const guild = await client.guilds.fetch(MAIN_GUILD_ID);
        if (!guild) {
            console.error('Main guild not found!');
            process.exit(1);
        }

        console.log(`Cleaning up channels in ${guild.name}...`);
        const channels = await guild.channels.fetch();

        // Find all voice channels that look like stats channels
        const statsChannels = channels.filter(c =>
            c.type === ChannelType.GuildVoice &&
            (c.name.startsWith('Total Siswa:') || c.name.startsWith('Siswa Aktif:') || c.name.startsWith('Member Online:'))
        );

        console.log(`Found ${statsChannels.size} stats channels.`);

        for (const [id, channel] of statsChannels) {
            try {
                await channel.delete();
                console.log(`Deleted: ${channel.name} (${id})`);
            } catch (err) {
                console.error(`Failed to delete ${channel.name}:`, err.message);
            }
        }

        console.log('Cleanup complete. Restart the bot to recreate the single correct pair.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.destroy();
    }
});

client.login(process.env.DISCORD_TOKEN);

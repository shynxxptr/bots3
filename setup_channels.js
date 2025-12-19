const { Client, GatewayIntentBits, ChannelType, PermissionsBitField } = require('discord.js');
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
        console.log(`Found guild: ${guild.name} (${guild.id})`);

        // Create Category
        const category = await guild.channels.create({
            name: 'MENFESS LOGS',
            type: ChannelType.GuildCategory,
        });
        console.log(`Created Category: ${category.name}`);

        // Create Channels
        const menfessLog = await guild.channels.create({
            name: 'menfess-log',
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });
        console.log(`Created Menfess Log: ${menfessLog.id}`);

        const replyLog = await guild.channels.create({
            name: 'reply-log',
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });
        console.log(`Created Reply Log: ${replyLog.id}`);

        const modLog = await guild.channels.create({
            name: 'mod-log',
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites: [
                {
                    id: guild.id,
                    deny: [PermissionsBitField.Flags.ViewChannel],
                },
            ],
        });
        // console.log(`Created Mod Log: ${modLog.id}`);

        // console.log('--- JSON OUTPUT ---');
        console.log(JSON.stringify({
            menfessLogChannelId: menfessLog.id,
            replyLogChannelId: replyLog.id,
            modLogChannelId: modLog.id
        }));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        client.destroy();
    }
});

client.login(process.env.DISCORD_TOKEN);

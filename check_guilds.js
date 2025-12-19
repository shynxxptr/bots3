const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const fs = require('fs');

client.once('ready', async () => {
    let output = `Logged in as ${client.user.tag}\n--- Joined Guilds ---\n`;
    client.guilds.cache.forEach(guild => {
        output += `${guild.name} (ID: ${guild.id})\n`;
    });
    output += '---------------------\n';

    fs.writeFileSync('guilds.txt', output);
    console.log('Guild list written to guilds.txt');
    client.destroy();
});

client.login(process.env.DISCORD_TOKEN);

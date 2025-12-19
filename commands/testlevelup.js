const { SlashCommandBuilder } = require('discord.js');
const { generateLevelUpImage } = require('../utils/levelUpRenderer');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('testlevelup')
        .setDescription('Test simulasi notifikasi level up'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        try {
            // Simulate Level 1 -> 2
            const oldLevel = 1;
            const newLevel = 2;
            const member = interaction.member;

            const attachment = await generateLevelUpImage(member, oldLevel, newLevel);

            // Send to configured channel
            const levelUpChannelId = config.levelUpChannelId;
            const channel = interaction.guild.channels.cache.get(levelUpChannelId);

            if (channel) {
                await channel.send({
                    content: `(Test) Simulasi Level Up untuk <@${member.id}>`,
                    files: [attachment]
                });
                await interaction.editReply(`✅ Notifikasi test level up dikirim ke <#${levelUpChannelId}>`);
            } else {
                await interaction.editReply(`❌ Channel level up tidak ditemukan. Cek config.`);
            }

        } catch (error) {
            console.error(error);
            await interaction.editReply('Terjadi kesalahan saat test level up.');
        }
    },
};

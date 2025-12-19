const { SlashCommandBuilder } = require('discord.js');
const { addDailyXp } = require('../utils/leveling');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('absen')
        .setDescription('Absen harian untuk mendapatkan XP tambahan'),
    async execute(interaction) {
        // Channel Restriction
        const allowedChannelId = '1445442876426293388';
        if (interaction.channelId !== allowedChannelId) {
            return interaction.reply({
                content: `❌ Command ini hanya bisa digunakan di <#${allowedChannelId}>!`,
                ephemeral: true
            });
        }

        await interaction.deferReply();

        const result = addDailyXp(interaction.user.id, interaction.guild.id);

        if (result.success) {
            let message = `✅ **Absen Berhasil!**\nKamu mendapatkan **+100 XP** hari ini.\n🔥 Streak: **${result.streak || 1} hari**`;

            if (result.leveledUp) {
                message += `\n\n🎉 **Selamat!** Kamu naik ke **Level ${result.level}**!`;

                // Trigger visual level up if configured
                const config = require('../config.json');
                if (config.levelUpChannelId) {
                    const { generateLevelUpImage } = require('../utils/levelUpRenderer');
                    const levelUpAttachment = await generateLevelUpImage(interaction.member, result.level - 1, result.level);
                    const levelUpChannel = interaction.guild.channels.cache.get(config.levelUpChannelId);
                    if (levelUpChannel) {
                        await levelUpChannel.send({
                            content: `Selamat <@${interaction.user.id}>! Kamu naik ke **Level ${result.level}**! 🎉`,
                            files: [levelUpAttachment]
                        });
                    }
                }
            }

            await interaction.editReply(message);
        } else {
            await interaction.editReply(`⏳ **Kamu sudah absen hari ini.**\nCoba lagi **besok** ya! (cek: \`!streak\`)`);
        }
    },
};

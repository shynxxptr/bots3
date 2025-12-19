const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isUserTimedOut, createMenfessModal } = require('../utils/menfessFeature.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('menfess')
        .setDescription('Kirim menfess baru (akan memunculkan pop-up).'),

    async execute(interaction) {
        try {
            if (isUserTimedOut(interaction.user.id)) {
                return await interaction.reply({
                    content: 'Kamu tidak bisa mengirim menfess saat ini (status: timeout).',
                    flags: [MessageFlags.Ephemeral]
                });
            }
            const modal = createMenfessModal();
            await interaction.showModal(modal);
        } catch (error) {
            console.error('Error saat showModal /menfess:', error);
            if (!interaction.replied) {
                await interaction.reply({ content: 'Gagal memunculkan form. Coba lagi.', flags: [MessageFlags.Ephemeral] });
            }
        }
    },
};

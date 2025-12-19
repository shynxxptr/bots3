const { Events, AttachmentBuilder, EmbedBuilder, Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');
const { createWelcomeImage } = require('../utils/welcomeImage');
const { getWelcomeConfig } = require('../utils/configLoader');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const welcomeChannelId = process.env.WELCOME_CHANNEL_ID;
        const inviteChannelId = process.env.INVITE_TRACKER_CHANNEL_ID || welcomeChannelId;

        const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
        const inviteChannel = member.guild.channels.cache.get(inviteChannelId);

        // Invite Tracker Logic
        const cachedInvites = member.client.invites.get(member.guild.id);
        const newInvites = await member.guild.invites.fetch();
        let inviter = null;
        let inviterCount = 0;

        try {
            const usedInvite = newInvites.find(inv => cachedInvites.get(inv.code) < inv.uses);
            if (usedInvite) {
                inviter = usedInvite.inviter;
                inviterCount = usedInvite.uses;
                console.log(`Member joined via invite code ${usedInvite.code} by ${inviter.tag}`);
            }
        } catch (err) {
            console.error('Error tracking invite:', err);
        }

        // Update cache
        const codeUses = new Collection();
        newInvites.each(inv => codeUses.set(inv.code, inv.uses));
        member.client.invites.set(member.guild.id, codeUses);

        // 1. Send Welcome Message
        if (welcomeChannel) {
            try {
                // Persistent Member Counter Logic
                const counterPath = path.join(__dirname, '../data/counter.json');
                let memberCount = member.guild.memberCount; // Default fallback

                try {
                    let counterData = { count: 0 };
                    if (fs.existsSync(counterPath)) {
                        const fileContent = fs.readFileSync(counterPath, 'utf8');
                        counterData = JSON.parse(fileContent);
                    }

                    counterData.count += 1;
                    memberCount = counterData.count;

                    fs.writeFileSync(counterPath, JSON.stringify(counterData));
                } catch (err) {
                    console.error('Error updating persistent member counter:', err);
                }

                const buffer = await createWelcomeImage(member, { memberCount: memberCount });
                const attachment = new AttachmentBuilder(buffer, { name: 'welcome.png' });
                const logoAttachment = new AttachmentBuilder(path.join(__dirname, '../assets/logo.png'), { name: 'logo.png' });

                const config = getWelcomeConfig();
                let messageContent = config.welcomeMessage || `Welcome to the server, ${member}!`;
                messageContent = messageContent.replace(/{{userId}}/g, member.id);

                const embed = new EmbedBuilder()
                    .setDescription(messageContent)
                    .setImage('attachment://welcome.png')
                    .setThumbnail('attachment://logo.png')
                    .setColor(config.embedColor || '#00008B');

                await welcomeChannel.send({
                    embeds: [embed],
                    files: [attachment, logoAttachment]
                });
            } catch (error) {
                console.error('Error sending welcome message:', error);
            }
        } else {
            console.log('Welcome channel not found');
        }

        // 2. Send Invite Tracker Message (if inviter found)
        if (inviteChannel && inviter) {
            try {
                const jalurKhususAttachment = new AttachmentBuilder(path.join(__dirname, '../assets/jalur_khusus.jpg'), { name: 'jalur_khusus.jpg' });
                const logoAttachment = new AttachmentBuilder(path.join(__dirname, '../assets/logo.png'), { name: 'logo.png' });

                const config = getWelcomeConfig();
                let inviteMessageContent = config.inviteMessage || `Invited by {{inviter}}`;

                inviteMessageContent = inviteMessageContent
                    .replace(/{{userId}}/g, member.id)
                    .replace(/{{inviter}}/g, inviter.toString())
                    .replace(/{{inviterCount}}/g, inviterCount.toString());

                const inviteEmbed = new EmbedBuilder()
                    .setDescription(inviteMessageContent)
                    .setThumbnail('attachment://logo.png')
                    .setImage('attachment://jalur_khusus.jpg')
                    .setColor(config.embedColor || '#00008B');

                await inviteChannel.send({
                    embeds: [inviteEmbed],
                    files: [jalurKhususAttachment, logoAttachment]
                });
            } catch (error) {
                console.error('Error sending invite tracker message:', error);
            }
        }

        // 3. Send Random Welcome Message to General Chat
        const config = getWelcomeConfig();
        const generalChannelId = config.generalChannelId;
        const generalChannel = member.guild.channels.cache.get(generalChannelId);

        if (generalChannel && config.randomWelcomeMessages && config.randomWelcomeMessages.length > 0) {
            try {
                const randomMessage = config.randomWelcomeMessages[Math.floor(Math.random() * config.randomWelcomeMessages.length)];
                const finalMessage = randomMessage.replace(/{{userId}}/g, member.id);

                await generalChannel.send(finalMessage);
            } catch (error) {
                console.error('Error sending random welcome message:', error);
            }
        }

        // Update Server Stats
        const { updateServerStats } = require('../utils/serverStats');
        updateServerStats(member.guild);
    },
};

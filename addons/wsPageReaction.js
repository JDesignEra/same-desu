import pageReaction from "./pageReaction.js";

export default async (client, interaction, authorId, duration, embeds, content) => {
  interaction.followUp({ content, embeds: [embeds[0]] }).then(interact => {
    if (Array.isArray(embeds) && embeds.length > 1) {
      client.channels.fetch(interaction.channelID).then(async channel => {
        channel.fetch(interaction.id).then(async message => {
          await pageReaction(interact, authorId, duration, embeds, content)
        });
      });
    }
  });
}
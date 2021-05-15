import { ChannelManager, MessageManager } from "discord.js";
import embedPageReaction from "./embedPageReaction.js";
import wsPatch from "./wsPatch.js";

export default async (client, interaction, duration, authorId, embedMessages) => {
  await wsPatch(client, interaction, embedMessages[0]).then(data => {
    client.channels.fetch(data.channel_id).then(channel => {
      channel.messages.fetch(data.id).then(async message => {
        await embedPageReaction(authorId, duration, embedMessages, message);
      });
    });
  });
}
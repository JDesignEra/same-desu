import embedPageReaction from "./embedPageReaction.js";
import wsPatch from "./wsPatch.js";

export default async (client, interaction, duration, authorId, embedMessages) => {
  await wsPatch(client, interaction, embedMessages[0]).then(data => {
    if (embedMessages.length > 1) {
      client.channels.fetch(data.channel_id).then(channel => {
        channel.messages.fetch(data.id).then(async message => {
          await embedPageReaction(authorId, duration, embedMessages, message);
        });
      });
    }
  });
}
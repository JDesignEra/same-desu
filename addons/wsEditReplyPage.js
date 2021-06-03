import pageReaction from "./pageReaction.js";
import wsPatch from "./wsPatch.js";

export default async (client, interaction, duration, authorId, contents, extras = undefined) => {
  await wsPatch(client, interaction, Array.isArray(extras) ? extras[0] : contents[0], extras ? extras[0] : undefined).then(data => {
    if (contents.length > 1) {
      client.channels.fetch(data.channel_id).then(channel => {
        channel.messages.fetch(data.id).then(async message => {
          await pageReaction(authorId, duration, extras ?? contents, message, extras ? extras : undefined);
        });
      });
    }
  });
}
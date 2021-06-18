import pageReaction from "./pageReaction.js";

export default async (interaction, authorId, duration, embeds, contents, files) => {
  interaction.followUp({
      content: contents?.length > 0 ? contents[0] : undefined,
      embeds: [embeds[0]],
      files: files?.length > 0 ? [files[0]] : undefined
    }).then(async interact => {
      if (Array.isArray(embeds) && embeds.length > 1) {
        await pageReaction(interact, authorId, duration, embeds, contents, files);
      }
    });
}
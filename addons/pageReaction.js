export default async (interaction, authorId, duration, embeds, contents = undefined, files = undefined) => {
  await interaction.react("⬅️");
  await interaction.react("➡️");

  let currentPage = 0;
  const filter = (reaction, user) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && !user.bot && user.id === authorId;
  const collector = interaction.createReactionCollector(filter, { time: duration, dispose: true });

  collector.on("collect remove", (reaction, user) => currentPage = updateEmbedPage(interaction, currentPage, reaction, embeds, contents, files));
}

const updateEmbedPage = (interaction, currentPage, reaction, embeds, contents, files) => {
  let page = currentPage;

  if (reaction.emoji.name === "⬅️" && page > 0) {
    page--;
    interaction.edit({content: contents[page], embeds: [embeds[page]], files});
  }
  else if (reaction.emoji.name === "➡️" && page < embeds.length - 1) {
    page++;
    interaction.edit({content: contents[page], embeds: [embeds[page]], files});
  }

  return page;
}
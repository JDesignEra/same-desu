export default async (interaction, authorId, duration, embeds, content = undefined) => {
  await interaction.react("⬅️");
  await interaction.react("➡️");

  let currentPage = 0;
  const filter = (reaction, user) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && !user.bot && user.id === authorId;
  const collector = interaction.createReactionCollector(filter, { time: duration, dispose: true });

  collector.on("collect", (reaction, user) => currentPage = updateEmbedPage(interaction, currentPage, reaction, embeds, content));
  collector.on("remove", (reaction, user) => currentPage = updateEmbedPage(interaction, currentPage, reaction, embeds, content));
}

const updateEmbedPage = (interaction, currentPage, reaction, embeds, content) => {
  let page = currentPage;

  if (reaction.emoji.name === "⬅️" && page > 0) {
    page--;
    interaction.edit({content, embeds: [embeds[page]]});
  }
  else if (reaction.emoji.name === "➡️" && page < embeds.length - 1) {
    page++;
    interaction.edit({content, embeds: [embeds[page]]});
  }

  return page;
}
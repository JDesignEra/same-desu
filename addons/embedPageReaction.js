export default async (authorId, duration, embedMessages, message) => {
  await message.react("⬅️");
  await message.react("➡️");

  let currentPage = 0;
  const filter = (reaction, user) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && !user.bot && user.id === authorId;
  const collector = message.createReactionCollector(filter, { time: duration, dispose: true });

  collector.on("collect", (reaction, user) => currentPage = updateEmbedPage(message, embedMessages, currentPage, reaction));
  collector.on("remove", (reaction, user) => currentPage = updateEmbedPage(message, embedMessages, currentPage, reaction));
}

const updateEmbedPage = (msg, embedMessages, currentPage, reaction) => {
  let page = currentPage;

  if (reaction.emoji.name === "⬅️" && page > 0) {
    page--;
    msg.edit(embedMessages[page]);
  }
  else if (reaction.emoji.name === "➡️" && page < embedMessages.length - 1) {
    page++;
    msg.edit(embedMessages[page]);
  }
  
  return page;
}
export default async (authorId, duration, contents, message, extras = undefined) => {
  await message.react("⬅️");
  await message.react("➡️");

  let currentPage = 0;
  const filter = (reaction, user) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && !user.bot && user.id === authorId;
  const collector = message.createReactionCollector(filter, { time: duration, dispose: true });

  collector.on("collect", (reaction, user) => currentPage = updateEmbedPage(message, contents, currentPage, reaction, extras));
  collector.on("remove", (reaction, user) => currentPage = updateEmbedPage(message, contents, currentPage, reaction, extras));
}

const updateEmbedPage = (msg, contents, currentPage, reaction, extras) => {
  let page = currentPage;

  if (reaction.emoji.name === "⬅️" && page > 0) {
    page--;
    msg.edit(contents[page], Array.isArray(extras) ? extras[page] : undefined);
  }
  else if (reaction.emoji.name === "➡️" && page < contents.length - 1) {
    page++;
    msg.edit(contents[page], Array.isArray(extras) ? extras[page] : undefined);
  }

  return page;
}
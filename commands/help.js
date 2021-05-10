import chalk from "chalk";
import { getAllCommands } from "./../databases/commandsDb.js";
import { MessageEmbed } from "discord.js";
import trimExtraSpace from "../utils/trimExtraSpace.js";

export const name = "help";
export const execute = async (client, message, args) => {
  const DURATION = 60000;
  const data = await getAllCommands();
  const embedMsgs = [
    new MessageEmbed().setColor("#2576A3")
      .setTitle("COMMANDS")
      .setFooter(`Living in AWS EC2  \u2022  Page 1 / ${data.length}`, client.user.avatarURL())
      .setTimestamp()
      .setDescription(trimExtraSpace(`
        Use \`help <Command Name>\` for more information about that command.

        You can also navigate with the reaction below to navigate through the list of commands for more information.

        **Note:** The help menu will be deleted after **${Math.floor(DURATION / 60000)}** minute.

        **Commands**
        ${data.map(cmd => {
          return `\u2022 ${cmd.command}`;
        }).join("\n")}
      `))
  ];

  data.forEach((cmd, i) => {
    embedMsgs.push(
      new MessageEmbed().setColor("#2576A3")
        .setTitle(cmd.command.toUpperCase())
        .setFooter(`Living in AWS EC2  \u2022  Page ${i + 2} / ${data.length}`, client.user.avatarURL())
        .setTimestamp()
        .setDescription(trimExtraSpace(`
          ${cmd.description}

          **USAGE**
          \u2022 ${cmd.usage.replace(/::/gm, "\n\u2022")}
        `))
    )
  })

  message.channel.send(embedMsgs[0]).then(async msg => {      
    await msg.react("⬅️");
    await msg.react("➡️");

    let currentPage = 0;
    const filter = (reaction, user) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && !user.bot && user.id === message.author.id;
    const collector = msg.createReactionCollector(filter, { time: DURATION, dispose: true });
    
    collector.on("collect", (reaction, user) => currentPage = updateEmbedPage(msg, embedMsgs, currentPage, reaction, user));
    collector.on("remove", (reaction, user) => currentPage = updateEmbedPage(msg, embedMsgs, currentPage, reaction, user));

    collector.on("end", () => {
      msg.delete();
      console.log(chalk.yellow("Embed help message deleted.\n"));
    });
  });
}

const updateEmbedPage = (msg, embedMsgs, currentPage, reaction, user) => {
  let page = currentPage;

  if (reaction.emoji.name === "⬅️" && page > 0) {
    page--;
    msg.edit(embedMsgs[page]);
  }
  else if (reaction.emoji.name === "➡️" && page < embedMsgs.length) {
    page++;
    msg.edit(embedMsgs[page]);
  }
  
  return page;
}
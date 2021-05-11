import chalk from "chalk";
import { getAllCommands } from "./../databases/commandsDb.js";
import { MessageEmbed } from "discord.js";
import trimExtraSpaces from "../utils/trimExtraSpaces.js";

export const name = "help";
export const execute = async (client, message, args) => {
  const DURATION = 60000;
  const data = await getAllCommands();
  let detailedHelpCmd = false;

  const embedMsgs = [
    new MessageEmbed()
      .setColor("#2576A3")
      .setTitle("COMMANDS")
      .setFooter(`Living in ${process.env.HOST_PLATFORM}  \u2022  Page 1 / ${data.length + 1}`, client.user.avatarURL())
      .setTimestamp()
      .setDescription(trimExtraSpaces(`
        Use \`help <Command Name>\` for more information about that command.

        You can also navigate with the reaction below to navigate through the list of commands for more information.

        **Note:** This embed message will be deleted after **${Math.floor(DURATION / 60000)}** minute.

        **Commands**
        ${data.map(cmd => {
          return `\u2022 ${cmd.command}`;
        }).join("\n")}
      `))
  ];

  data.forEach((cmd, i) => {
    if (args[1] && args[1] === cmd.command && args[1] !== "help") {
      detailedHelpCmd = cmd;
      return;
    }

    embedMsgs.push(
      new MessageEmbed()
        .setColor("#2576A3")
        .setTitle(cmd.command.toUpperCase())
        .setFooter(`Living in ${process.env.HOST_PLATFORM}  \u2022  Page ${i + 2} / ${data.length + 1}`, client.user.avatarURL())
        .setTimestamp()
        .setDescription(trimExtraSpaces(`
          ${cmd.description}

          **Usage**
          \u2022 ${cmd.usage.replace(/::/gm, "\n\u2022 ")}
        `))
    );
  });

  message.delete();
  
  if (!detailedHelpCmd) {
    message.channel.send(embedMsgs[0]).then(async msg => {
      await msg.react("⬅️");
      await msg.react("➡️");
  
      let currentPage = 0;
      const filter = (reaction, user) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && !user.bot && user.id === message.author.id;
      const collector = msg.createReactionCollector(filter, { time: DURATION, dispose: true });
      
      collector.on("collect", (reaction, user) => currentPage = updateEmbedPage(msg, embedMsgs, currentPage, reaction));
      collector.on("remove", (reaction, user) => currentPage = updateEmbedPage(msg, embedMsgs, currentPage, reaction));
  
      collector.on("end", () => {
        try {
          msg.delete();
          console.log(chalk.yellow("Embed help message deleted.\n"));
        }
        catch (e) {
          console.log(chalk.yellow("Embed message might have been delete already."));
          console.log(chalk.yellow(`${e.name}: ${e.message}\n`));
        }
      });
    }).catch(e => {
      console.log(chalk.red("Failed to send message"));
      console.log(chalk.red(`${e.name}: ${e.message}\n`));
      message.channel.send(`${message.author.toString()}, this is embarrassing. But it seems that you have stumble upon a bug. Please let <@156834654140235776> know so he can fix me up.`);
    });
  }
  else {
    const embed = new MessageEmbed()
      .setColor("#2576A3")
      .setTitle(detailedHelpCmd.command.toUpperCase())
      .setFooter(`Living in ${process.env.HOST_PLATFORM} ${data.length + 1}`, client.user.avatarURL())
      .setTimestamp()
      .setDescription(trimExtraSpaces(`
        ${detailedHelpCmd.description}

        **Usage**
        \u2022 ${detailedHelpCmd.usage.replace(/::/gm, "\n\u2022 ")}
      `));

    message.channel.send(embed);
  }
}

const updateEmbedPage = (msg, embedMsgs, currentPage, reaction) => {
  let page = currentPage;

  if (reaction.emoji.name === "⬅️" && page > 0) {
    page--;
    msg.edit(embedMsgs[page]);
  }
  else if (reaction.emoji.name === "➡️" && page < embedMsgs.length - 1) {
    page++;
    msg.edit(embedMsgs[page]);
  }
  
  return page;
}
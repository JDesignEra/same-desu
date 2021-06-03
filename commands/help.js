import chalk from "chalk";
import { getAllCommands } from "./../databases/commandsDb.js";
import { MessageEmbed } from "discord.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import pageReaction from "../addons/pageReaction.js";
import wsReply from "../addons/wsReply.js";
import wsEditReplyPage from "../addons/wsEditReplyPage.js";

export const name = "help";
export const description = "I will tell you about what I can do.";
export const options = [
  {
    name: "command",
    description: "Command detailed help information, leave it empty for all commands information.",
    type: 3
  }
]

export const execute = async (client, message, args, isWs = false) => {
  const duration = 60000;
  const authorId = message.author?.id ?? message.member?.user?.id;
  const data = await getAllCommands();
  let detailedHelpCmd = false;

  const embedMsgs = [
    new MessageEmbed()
      .setColor("#2576A3")
      .setTitle("COMMANDS")
      .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page 1 / ${data.length + 1}`, client.user.avatarURL())
      .setTimestamp()
      .setDescription(trimStartingIndent(`
        Use / or tag me with \`help <Command Name>\` for more information about that command.
        
        All commands are available in either \`/\` variant prefix or a tag me variant.

        You can react with the reaction below to navigate through the list of commands for more information.

        **Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.

        **Commands**
        ${data.map(cmd => {
          return `\u2022 ${cmd.command}`;
        }).join("\n")}
      `))
  ];

  data.forEach((cmd, i) => {
    if (args[0] && args[0] === cmd.command && args[1] !== "help") {
      detailedHelpCmd = cmd;
      return;
    }

    embedMsgs.push(
      new MessageEmbed()
        .setColor("#2576A3")
        .setTitle(cmd.command.toUpperCase())
        .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${data.length + 1}`, client.user.avatarURL())
        .setTimestamp()
        .setDescription(trimStartingIndent(`
          ${cmd.description}

          **Usage**
          \u2022 ${cmd.usage.replace(/::/gm, "\n\u2022 ")}
        `))
    );
  });
  
  if (!detailedHelpCmd) {
    if (isWs) {
      await wsReply(client, message, "", embedMsgs[0], 5);
      wsEditReplyPage(client, message, duration, authorId, embedMsgs);
    }
    else {
      message.channel.send(embedMsgs[0]).then(async msg => {
        pageReaction(authorId, duration, embedMsgs, msg);
      }).catch(e => {
        console.log(chalk.red("\nFailed to send message"));
        console.log(chalk.red(`${e.name}: ${e.message}`));
        message.channel.send(`${message.author?.toString()}, this is embarrassing. But it seems that you have stumble upon a bug. Please let <@156834654140235776> know so he can fix me up.`);
      });
    }
  }
  else {
    const embed = new MessageEmbed()
      .setColor("#2576A3")
      .setTitle(detailedHelpCmd.command.toUpperCase())
      .setFooter(`${process.env.EMBED_HOST_FOOTER}`, client.user.avatarURL())
      .setTimestamp()
      .setDescription(trimStartingIndent(`
        ${detailedHelpCmd.description}

        **Usage**
        \u2022 ${detailedHelpCmd.usage.replace(/::/gm, "\n\u2022 ")}
      `));

    if (isWs) {
      wsReply(client, message, "", embed);
    }
    else {
      message.channel.send(embed);
    }
  }
}
import chalk from "chalk";
import { MessageEmbed } from "discord.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import pageReaction from "../addons/pageReaction.js";
import commands from "../data/commands.js";
import wsPageReaction from "../addons/wsPageReaction.js";

export const name = "help";
export const description = "I will tell you about what I can do.";
export const options = [
  {
    name: "command",
    description: "Command detailed help information, leave it empty for all commands information.",
    type: 3
  }
];
export const execute = async (client, interaction, args, isWs = false) => {
  const reactDuration = 60000;
  const authorId = interaction.author?.id ?? interaction.member?.user?.id;
  let detailedHelpCmd = false;

  const embedMsgs = [
    new MessageEmbed()
      .setColor("#2576A3")
      .setTitle("COMMANDS")
      .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page 1 / ${commands.length + 1}`, client.user.avatarURL())
      .setTimestamp()
      .setDescription(trimStartingIndent(`
        Use / or tag me with \`help <Command Name>\` for more information about that command.
        
        All commands are available in either \`/\` variant prefix or a tag me variant.

        You can react with the reaction below to navigate through the list of commands for more information.

        **Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.

        **Commands**
        ${commands.map(cmd => {
          return `\u2022 ${cmd.command}`;
        }).join("\n")}
      `))
  ];

  commands.forEach((cmd, i) => {
    if (args[0] && args[0] === cmd.command && args[1] !== "help") {
      detailedHelpCmd = cmd;
      return;
    }

    embedMsgs.push(
      new MessageEmbed()
        .setColor("#2576A3")
        .setTitle(cmd.command.toUpperCase())
        .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${commands.length + 1}`, client.user.avatarURL())
        .setTimestamp()
        .setDescription(trimStartingIndent(`
          ${cmd.description}

          **Usage**
          \u2022 ${cmd.usage.join("\n\u2022 ")}
        `))
    );
  });
  
  if (!detailedHelpCmd) {
    if (isWs) {
      interaction.defer();
      wsPageReaction(client, interaction, authorId, reactDuration, embedMsgs);
    }
    else {
      interaction.channel.send({ embeds: [embedMsgs[0]] }).then(async msg => {
        pageReaction(msg, authorId, reactDuration, embedMsgs);
      }).catch(e => {
        console.log(chalk.red("\nFailed to send message"));
        console.log(chalk.red(`${e.name}: ${e.message}`));
        interaction.channel.send(`${interaction.author?.toString()}, this is embarrassing. But it seems that you have stumble upon a bug. Please let <@156834654140235776> know so he can fix me up.`);
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
        \u2022 ${detailedHelpCmd.usage.join("\n\u2022 ")}
      `));

    if (isWs) interaction.reply({ embeds: [embed] });
    else interaction.channel.send({ embeds: [embed] });
  }
}
import { MessageEmbed } from "discord.js";

export const name = "help";
export function execute(client, message, args) {
  const embed = new MessageEmbed()
    .setColor(process.env.MAIN_COLOR)
    .setTitle("サメです、I am here to help!")
    .addFields(
      {
        name: "Command",
        value: `
          \`hello\`,
          \`insult <@user>\`,
          \`clear <all / int>\`
        `.replace(/  +/g, ''),
        inline: true
      },
      {
        name: "Description",
        value: `
          I shall greet you.
          I shall insult someone for you.
          Clear messages in that channel. **(Admin)**
        `.replace(/  +/g, ''),
        inline: true
      },
    )
    .setFooter("Powered on AWS EC2.");

    message.channel.send(embed);
}
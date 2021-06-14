import { MessageAttachment } from "discord.js";
import insults from "../data/insults.js";

export const name = "insult";
export const description = "I shall insult someone for you or yourself.";
export const options = [
  {
    name: "user",
    description: "Tag a user you want to insult, leaving it blank and I will insult you instead.",
    type: 6
  }
];
export const execute = async (client, interaction, args, isWs = false) => {
  const tagUser = interaction.author?.toString() ?? `<@${interaction.member.user.id.toString()}>`;

  const randomInt = Math.floor(Math.random() * insults.length);
  let insult;
  let files;
  
  if (interaction.mentions?.users?.size > 1) {
    const users = interaction?.mentions?.users?.filter(user => user != client.user.id);

    insult = insults[randomInt]?.insult?.replace("<user>", users.map(u => u.toString()).join(" "));
  }
  else {
    insult = insults[randomInt]?.insult?.replace("<user>", isWs && args[0] ? `<@${args[0]}>` : tagUser);
  }

  if (insults[randomInt]?.attachmentType === "audio") {
    files = [{
      attachment:  `./static/audios/${insults[randomInt]?.attachment}`,
      name: `${insults[randomInt]?.attachment.split("/")[0]} ${insults[randomInt]?.attachment.split("/").slice(-1)[0]}`
    }];
  }

  if (isWs) interaction.reply({ content: insult, files });
  else interaction.channel.send({ content: insult, files });
}
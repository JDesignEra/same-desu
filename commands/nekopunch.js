import { MessageAttachment, MessageEmbed } from "discord.js";
import wsReply from "../addons/wsReply.js";

export const name = "nekopunch";
export const description = "I will Neko Punch you or someone.";
export const options = [
  {
    name: "user",
    description: "Tag a user you want to Neko Punch, leaving it blank and I will Neko Punch you instead.",
    type: 6
  }
]

export const execute = async (client, message, args, isWs = false) => {
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;
  const nekoPunchGif = "https://media.tenor.com/images/b03ee5ecf261c9073f62dfd9d7b9bb75/tenor.gif";
  let nekoPunchMsg = "**Neko Punch** <user>!";
  
  if (message.mentions?.users?.size > 1) {
    const users = message?.mentions?.users?.filter(user => user != client.user.id);
    nekoPunchMsg = nekoPunchMsg.replace("<user>", users.map(u => u.toString()).join(" "));
  }
  else {
    nekoPunchMsg = nekoPunchMsg.replace("<user>", isWs && args[0] ? `<@${args[0]}>` : tagUser);
  }

  if (isWs) {
    const attachment = new MessageEmbed()
      .setColor("#2576A3")
      .setImage(nekoPunchGif)
      .setFooter(process.env.EMBED_HOST_FOOTER, client.user.avatarURL())
      .setTimestamp();

    wsReply(client, message, nekoPunchMsg, attachment);
  }
  else {
    message.channel.send(nekoPunchMsg, new MessageAttachment(nekoPunchGif));
  }
}
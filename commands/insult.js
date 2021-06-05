import { MessageAttachment } from "discord.js";
import wsDelReply from "../addons/wsDelReply.js";
import wsReply from "../addons/wsReply.js";
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
export const execute = async (client, message, args, isWs = false) => {
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;

  const randomInt = Math.floor(Math.random() * insults.length);
  let insult;
  let attachment;
  
  if (message.mentions?.users?.size > 1) {
    const users = message?.mentions?.users?.filter(user => user != client.user.id);

    insult = insults[randomInt]?.insult?.replace("<user>", users.map(u => u.toString()).join(" "));
  }
  else {
    insult = insults[randomInt]?.insult?.replace("<user>", isWs && args[0] ? `<@${args[0]}>` : tagUser);
  }

  if (insults[randomInt]?.attachmentType === "audio") attachment = `./static/audios/${insults[randomInt]?.attachment}`

  const filename = `${insult.replace(/<@\d+>/gm, "")}.${attachment.split(".").slice(-1)[0]}`

  if (isWs) {
    wsReply(client, message, insult, null, 5);
    wsDelReply(client, message);

    client.channels.cache.get(message.channel_id).send(insult, new MessageAttachment(attachment, filename));
  }
  else message.channel.send(insult, new MessageAttachment(attachment, filename));
}
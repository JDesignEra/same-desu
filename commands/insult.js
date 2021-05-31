import wsReply from "../addons/wsReply.js";
import { getAllInsults } from "../databases/insultsDb.js";

export const name = "insult";
export const description = "I shall insult someone for you or yourself.";
export const options = [
  {
    name: "user",
    description: "Tag a user you want to insult, leaving it blank and I will insult you instead.",
    type: 6
  }
]

export const execute = async (client, message, args, isWs = false) => {
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;

  const data = await getAllInsults();
  const insults = data?.filter(insult => insult.state)?.map(data => {
    return data.insult;
  });

  const randomInt = Math.floor(Math.random() * insults.length);
  let insult;
  
  if (message.mentions?.users?.size > 1) {
    const users = message?.mentions?.users?.filter(user => user != client.user.id);

    insult = insults[randomInt]?.replace("<user>", users.map(u => u.toString()).join(" "));
  }
  else {
    insult = insults[randomInt]?.replace("<user>", isWs && args[0] ? `<@${args[0]}>` : tagUser);
  }

  if (isWs) {
    wsReply(client, message, insult);
  }
  else {
    message.channel.send(insult);
  }
}
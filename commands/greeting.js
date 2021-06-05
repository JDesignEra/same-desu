import wsReply from "../addons/wsReply.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import greetings from "../data/greetings.js";

export const name = "hello";
export const description = "I shall greet you.";
export const options = [
  {
    name: "greeting",
    description: "I will try my best to respond to your greeting.",
    type: 3,
    required: true
  }
];
export const execute = async (client, message, args, isWs = false) => {
  const greetingWords = greetings?.filter(greeting => greeting.state);
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;

  const messageContents = message?.content ?? args[0];

  if (greetingWords?.some(word => messageContents.search(new RegExp(`\\b${word?.greeting}\\b`, "gmi")) > -1)) {
    const greeting = greetingWords?.filter(word => messageContents.search(new RegExp(`\\b${word?.greeting}\\b`, "gmi")) > -1).pop()?.greeting;

    if (isWs) wsReply(client, message, `${greeting.replace(/^\w/, (c) => c.toUpperCase())} ${tagUser}, サメです。 <a:guraWave:840734876964749342>`);
    else message.channel.send(`${greeting.replace(/^\w/, (c) => c.toUpperCase())} ${tagUser}, サメです。 <a:guraWave:840734876964749342>`);

    return true;
  }
  else if (isWs) {
    wsReply(client, message, trimStartingIndent(`
      **どうも <@${message.member.user.id.toString()}>, サメです。**
      How may I help you?\n${client.emojis.cache.find(emoji => emoji.name === "guraShy")}
    `));
  }

  return false;
}
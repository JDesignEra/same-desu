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
export const execute = async (client, interaction, args, isWs = false) => {
  const greetingWords = greetings?.filter(greeting => greeting.state);
  const tagUser = interaction.author?.toString() ?? `<@${interaction.member.user.id.toString()}>`;

  const messageContents = interaction?.content ?? args[0];

  if (greetingWords?.some(word => messageContents.search(new RegExp(`\\b${word?.greeting}\\b`, "gmi")) > -1)) {
    const greeting = greetingWords?.filter(word => messageContents.search(new RegExp(`\\b${word?.greeting}\\b`, "gmi")) > -1).pop()?.greeting;
    const greetingMsg = `${greeting.replace(/^\w/, (c) => c.toUpperCase())} ${tagUser}, サメです。 <a:guraWave:840734876964749342>`

    if (isWs) interaction.reply(greetingMsg);
    else interaction.channel.send(greetingMsg);

    return true;
  }
  else if (isWs) {
    interaction.reply(trimStartingIndent(`
      **どうも <@${interaction.member.user.id.toString()}>, サメです。**
      How may I help you?\n${client.emojis.cache.find(emoji => emoji.name === "guraShy")}
    `));
  }

  return false;
}
export const name = "hello";
export function execute(client, message, args) {
  const greetingWords = [
    "bonjour",
    "domo",
    "hello",
    "hey",
    "hi",
    "howdy",
    "sup",
    "greeting",
    "greetings",
    "ども",
    "こんにちわ"
  ];

  if (greetingWords.some(word => message.content.includes(word))) {
    const greeting = greetingWords.filter(word => message.content.includes(word)).pop();

    message.channel.send(`${greeting[0].toUpperCase() + greeting.substring(1)} ${message.author.toString()}, 鮫です。 <a:guraWave:840734876964749342>`);

    return true;
  }

  return false;
}
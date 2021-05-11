import { getAllGreetings } from "./../databases/greetingsDb.js";

export const name = "hello";
export const execute = async (client, message, args) => {
  const data = await getAllGreetings();
  const greetingWords = data?.filter(greeting => greeting.state);

  if (args.length > 0 && greetingWords?.some(word => message.content.includes(word.greeting))) {
    const greeting = greetingWords?.filter(word => message.content.includes(word?.greeting)).pop()?.greeting;

    message.channel.send(`${greeting[0]?.toUpperCase() + greeting?.substring(1)} ${message.author.toString()}, 鮫です。 <a:guraWave:840734876964749342>`);

    return true;
  }
  
  return false;
}
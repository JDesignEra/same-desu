import { getAllInsults } from "../databases/insultsDb";

export const name = "insult";
export const execute = async (client, message, args) => {
  const data = await getAllInsults();
  const insults = data.filter(insult => insult.state).map(data => {
    return data.insult;
  });

  const randomInt = Math.floor(Math.random() * (insults.length));
  const users = message.mentions.users.filter(user => user != client.user.id);
  let insult;

  if (message.mentions.users.size > 1) {
    insult = insults[randomInt].replace("<user>", users.map(u => u.toString()).join(" "));
  }
  else {
    console.log(message.author.toString());
    insult = insults[randomInt].replace("<user>", message.author.toString());
  }

  message.channel.send(insult);
}
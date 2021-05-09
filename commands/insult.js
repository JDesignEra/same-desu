export const name = "insult";
export function execute(client, message, args) {
  const insults = [
    "FAQ <user>!",
    "FAQ you <user>!",
    "F*ck you <user>!",
    "Are you fucking kidding me <user>!?",
    "Stay home dayo <user>!",
    "You're too small <user>.",
    "Stop it <user>, eeewwww.",
    "<user> weirdo, or dare I say ばか。",
    "<user>、ボコボコにするよ、まじで。"
  ];

  const randomInt = Math.floor(Math.random() * (insults.length));
  const users = message.mentions.users.filter(user => user != client.user.id);
  let insult;

  if (message.mentions.users.size > 0) {
    insult = insults[randomInt].replace("<user>", users.map(u => u.toString()).join(" "));
  }
  else {
    insult = insults[randomInt].replace("<user>", message.author.toString());
  }

  message.channel.send(insult);
}
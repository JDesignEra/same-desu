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
  let nekoPunchMsg = "**Neko Punch** <user>!\nhttps://media.tenor.com/images/daf6d9ec9db76043fc9fcbfff6ae9442/tenor.gif";
  
  if (message.mentions?.users?.size > 1) {
    const users = message?.mentions?.users?.filter(user => user != client.user.id);
    nekoPunchMsg = nekoPunchMsg.replace("<user>", users.map(u => u.toString()).join(" "));
  }
  else {
    nekoPunchMsg = nekoPunchMsg.replace("<user>", isWs && args[0] ? `<@${args[0]}>` : tagUser);
  }

  if (isWs) {
    wsReply(client, message, nekoPunchMsg);
  }
  else {
    message.channel.send(nekoPunchMsg);
  }
}
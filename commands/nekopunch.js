export const name = "nekopunch";
export const description = "I will Neko Punch you or someone.";
export const options = [
  {
    name: "user",
    description: "Tag a user you want to Neko Punch, leaving it blank and I will Neko Punch you instead.",
    type: 6
  }
];
export const execute = async (client, interaction, args, isWs = false) => {
  const tagUser = interaction.author?.toString() ?? `<@${interaction.member.user.id.toString()}>`;
  const files = [{
    attachment: `./static/images/Neko Punch.gif`,
    name: "Neko Punch.gif"
  }];
  let nekoPunchMsg = "**Neko Punch** <user>!";
  
  if (interaction.mentions?.users?.size > 1) {
    const users = interaction?.mentions?.users?.filter(user => user != client.user.id);
    nekoPunchMsg = nekoPunchMsg.replace("<user>", users.map(u => u.toString()).join(" "));
  }
  else nekoPunchMsg = nekoPunchMsg.replace("<user>", isWs && args[0] ? `<@${args[0]}>` : tagUser);

  if (isWs) interaction.reply({ content: nekoPunchMsg, files });
  else interaction.channel.send({ content: nekoPunchMsg, files });
}
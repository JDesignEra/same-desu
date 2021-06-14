import chalk from "chalk";

export const name = "clear";
export const description = "(Administrator) I shall clean the chat for you.";
export const options = [
  {
    name: "amount",
    description: "Number of messages to delete, use <all> to delete all messages in that channel.",
    type: 3,
    required: true
  }
];
export const execute = async (client, interaction, args, isWs = false) => {
  const channel = isWs? await client?.channels?.fetch(interaction.channelID) : interaction.channel;
  const tagUser = interaction.author?.toString() ?? `<@${interaction.member.user.id.toString()}>`;

  let amt = args[0] ?? null;

  if (amt === "all" || !isNaN(amt) && parseInt(amt) > 0) {
    amt = isNaN(amt) ? amt : parseInt(amt);
    let deletedCount = 0;
    let deleted;

    if (isWs) {
      await interaction.reply("I am cleaning up the channel messages.");

      if (!isNaN(amt)) amt++;
    }
    else {
      await interaction.channel.send("I am cleaning up the channel messages.");

      if (!isNaN(amt)) amt += 2;
    }

    do {
      try {
        deleted = await channel.bulkDelete(amt === "all" ? 100 : amt, true);
        if (amt !== "all") deletedCount += amt;
      }
      catch (e) {
        console.log(chalk.red("Failed to bulk delete messages."));
        console.log(chalk.red(`${e.name}: ${e.message}\n`));
      }
    } while (amt === "all" ? deleted?.size < 1 : deletedCount < amt);

    channel.send(`${tagUser}, I have deleted ${isNaN(amt) ? amt : isWs ? amt - 1 : amt - 2} messages that are less then 14 days old.`);
  }
  else if (isWs) interaction.reply(`${tagUser}, \`<amount>\` parameter only allows "all" or an Integer greater then 0.`);
  else channel.send(`${tagUser}, \`<amount>\` parameter only allows "all" or an Integer greater then 0.`);
}
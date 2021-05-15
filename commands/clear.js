import chalk from "chalk";
import wsReply from "../addons/wsReply.js";

export const name = "clear";
export const description = "I shall clean the chat for you. This is an administrator only command.";
export const options = [
  {
    name: "amount",
    description: "Number of messages to delete, use (all) to delete all messages in that channel.",
    type: 3,
    required: true
  }
]
export const default_permission = false;

export const execute = async (client, message, args, isWs = false) => {
  const channel = isWs? await client?.channels?.fetch(message.channel_id) : message.channel;
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;

  let amt = args[0] ?? null;

  if (amt === "all" || !isNaN(amt)) {
    amt = isNaN(amt) ? amt : parseInt(amt);
    let msg;
    let deletedCount = 0;
    let deleted;

    if (isWs) {
      await wsReply(client, message, "I am cleaning up the channel messages.");

      if (!isNaN(amt)) amt++;
    }
    else {
      await message.channel.send("I am cleaning up the channel messages.");

      if (!isNaN(amt)) amt += 2;
    }

    do {
      try {
        deleted = await channel.bulkDelete(amt === "all" ? 100 : amt);
        if (amt !== "all") deletedCount += amt;
      }
      catch (e) {
        console.log(chalk.red("Failed to bulk delete messages."));
        console.log(chalk.red(`${e.name}: ${e.message}\n`));
      }
    } while (amt === "all" ? deleted.size < 1 : deletedCount < amt);

    channel.send(`${tagUser}, I have deleted ${isNaN(amt) ? amt : isWs ? amt - 1 : amt - 2} messages.`);
  }
}
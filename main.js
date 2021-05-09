import dotenv from "dotenv";
import chalk from "chalk";
import fs from "fs";
import { Client, Collection } from "discord.js";

dotenv.config();

const client = new Client();
client.commands = new Collection();

fs.readdirSync("./commands/").filter(file => file.endsWith(".js")).map(file => {
  const cmd = require(`./commands/${file}`);

  client.commands.set(cmd.name, cmd);
});

client.once("ready", () => {
  console.log(`${chalk.blue(client.user.tag)} is ${chalk.green("ONLINE")}.\n`);

  client.user.setActivity("help for commands");
});

client.on("message", message => {
  if (message.author.bot || message.content.includes("@here") || message.content.includes("@everyone")) return;

  if (message.mentions.has(client.user.id)) {
    const args = message.content.split(" ").slice(1);
    const cmd = args[0] ? args[0].toLowerCase() : null;
    console.log(message.content);

    if (client.commands.has(cmd)) {
      client.commands.get(cmd).execute(client, message, args);
    }
    else {
      if (!client.commands.get("hello").execute(client, message, args)) {
        message.channel.send(`
          **どうも ${message.author.toString()}, サメです。**
          How may I help you?\n<a:guraShy:840735051305713697>
        `.replace(/  +/g, ''));
      }
    }
  }
});

client.login(process.env.TOKEN);
import dotenv from "dotenv";
import chalk from "chalk";
import fs from "fs";
import { Client, Collection } from "discord.js";
import trimExtraSpace from "./utils/trimExtraSpace.js";

dotenv.config();

const maxArgs = 2;
const client = new Client();

client.once("ready", () => {
  console.log(`${chalk.blue(client.user.tag)} is ${chalk.green("ONLINE")}.\n`);
  client.user.setActivity(process.env.STATUS);

  // Set bot commands
  client.commands = new Collection();
  
  fs.readdirSync("./commands/").filter(file => file.endsWith(".js")).map(async file => {
    const cmd = await import(`./commands/${file}`);
    client.commands.set(cmd.name, cmd);
  });

  // Sync DB
  fs.readdirSync("./databases/").filter(file => file.endsWith(".js")).map(async file => {
    const db = await import(`./databases/${file}`);
    db.execute();
    
    // Create database.
    // (async () => {
    //   await db.init();
    // })();
  });
});

client.on("message", async message => {
  if (message.author.bot || message.content.includes("@here") || message.content.includes("@everyone") || message.author.bot) return;

  if (message.mentions.has(client.user.id)) {
    const commands = client.commands.map(cmd => cmd.name);
    const msg = message.content.replace(/\s?<@!\w*>\s?/gm, "");
    let args = [];

    const possibleArgs = msg.split(" ").filter(arg => arg.trim() !== "");
    let idx;
    
    possibleArgs.forEach((arg, i) => {
      if (commands.indexOf(arg) > -1) {
        idx = i;
        return;
      }
    });
    
    if (idx != null && idx > -1) args = possibleArgs.slice(idx, idx + maxArgs);
    
    if (args.length > 0 && client.commands.filter(cmd => cmd.name === args[0])) {
      client.commands.get(args[0])?.execute(client, message, args);
    }
    else {
      if (!await client.commands.get("hello").execute(client, message, args)) {
        message.channel.send(trimExtraSpace(`
          **どうも ${message.author.toString()}, サメです。**
          How may I help you?\n${client.emojis.cache.find(emoji => emoji.name === "guraShy")}
        `));
      }
    }
  }
});

client.login(process.env.TOKEN);
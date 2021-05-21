import dotenv from "dotenv";
import chalk from "chalk";
import fs from "fs";
import { Client, Collection } from "discord.js";
import wsReply from "./addons/wsReply.js";
import { getCommandRoles } from "./databases/commandsDb.js";
import trimStartingIndent from "./utils/trimStartingIndent.js";

dotenv.config();

const guildId = process.env.GUILD_ID;
const client = new Client();
client.commands = new Collection();

const getApp = (guildId) => {
  const app = client.api.applications(client.user.id)
  if (guildId) app.guilds(guildId);

  return app;
}

fs.readdirSync("./commands/").filter(file => file.endsWith(".js")).map(async file => {
  const cmd = await import(`./commands/${file}`);
  client.commands.set(cmd.name, cmd);
});

fs.readdirSync("./databases/").filter(file => file.endsWith(".js")).map(async file => {
  const db = await import(`./databases/${file}`);
  await db.execute();

  await db.init();  // Create or Re-create tables comment out when not needed
});

client.once("ready", async () => {
  console.log(`${chalk.blue(client.user.tag)} is ${chalk.green("ONLINE")}.\n`);
  client.user.setActivity(process.env.STATUS_MSG, {
    url: "https://jdesignera.com",
    type: process.env.STATUS_TYPE
  });
  
  client.commands.each(async cmd => {
    const data = {};
    
    if (cmd.name) {
      data.name = cmd.name;
      data.description = cmd.description ?? "サメです";
      
      if (cmd.options) data.options = cmd.options;
      if (cmd.default_permission) data.default_permission = cmd.default_permission;

      await getApp(guildId).commands.post({ data: data });
    }
  });
});

// Slash Commands
client.ws.on("INTERACTION_CREATE", async (interaction) => {
  const member = interaction.member;
  const { name, options } = interaction.data
  const command = name.toLowerCase();
  var args = [];

  const buildArgs = (obj) => {
    if (obj?.name && !obj.value) args.push(obj.name);
    if (obj?.value) args.push(obj.value);
    if (obj?.options?.length < 1) return;
    
    if (Array.isArray(obj)) {
      obj.forEach(options => buildArgs(options));
    }
    else {
      obj?.options?.forEach(options => buildArgs(options));
    }
  }

  buildArgs(options);

  console.log(
    chalk.magenta.bold("WS > ") +
    chalk.green.bold(`${member?.user?.username}#${member?.user?.discriminator}: `) +
    chalk.cyan(`\/${command} ${args.join(" ")}`)
  );
  
  const userRoles = member?.roles ?? [];
  let cmdRoles = await getCommandRoles(command);
  cmdRoles = cmdRoles?.split("::") ?? cmdRoles;
  
  if (cmdRoles == null || cmdRoles && userRoles.length > 0 && userRoles.filter(roleId => cmdRoles?.indexOf(roleId) > -1)) {
    await client.commands.get(command).execute(client, interaction, args, true);
  }
  else {
    wsReply(client, interaction, trimStartingIndent(`
      <@${interaction.member.user.id.toString()}> 申し訳ありませんが、その許可はありません。
      Sorry, you do not have that permission.
    `));
  }
});

// Tag Commands
client.on("message", async message => {
  if (message.author.bot || message.content.includes("@here") || message.content.includes("@everyone") || message.author.bot) return;

  if (message.mentions.has(client.user.id)) {
    const commands = client.commands.map(cmd => cmd.name);
    const msg = message.content.slice(client.user.id.length + 4);
    let command;
    let args = [];

    console.log(chalk.magenta.bold("@ > ") + chalk.green.bold(`${message.member.user.tag}: `) + chalk.cyan(message.content));

    const possibleArgs = msg.split(" ").filter(arg => arg.trim() !== "");
    let idx;

    for (let i = 0; i < possibleArgs.length && idx == null; i++) {
      if (commands.indexOf(possibleArgs[i]) > -1) {
        idx = i;
      }
    }
    
    if (idx != null && idx > -1) {
      args = possibleArgs.slice(idx);
      command = args.shift();
    }
    
    if (command) {
      let cmdRoles = await getCommandRoles(command);
      cmdRoles = cmdRoles?.split("::") ?? cmdRoles;

      let userRoles = message.member?.roles?.cache;

      if (cmdRoles === null || cmdRoles && userRoles.size > 0 && userRoles.find(role => cmdRoles.indexOf(role.id) > -1)) {
        client.commands.get(command)?.execute(client, message, args);
      }
      else {
        message.channel.send(trimStartingIndent(`
          ${message.author?.toString()} 申し訳ありませんが、その許可はありません。
          Sorry, you do not have that permission.
        `));
      }
    }
    else {
      if (!await client.commands.get("hello").execute(client, message, args)) {
        message.channel.send(trimStartingIndent(`
          **どうも ${message.author?.toString()}, サメです。**
          How may I help you?\n${client.emojis.cache.find(emoji => emoji.name === "guraShy")}
        `));
      }
    }
  }
});

process.on("SIGINT", function(){
  console.log(`${chalk.blue(client.user.tag)} has ${chalk.red("DISCONNECTED")}.\n`);
  process.exit();
});

client.login(process.env.TOKEN);
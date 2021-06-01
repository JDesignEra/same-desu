import dotenv from "dotenv";
import chalk from "chalk";
import fs from "fs";
import { Client, Collection, MessageEmbed } from "discord.js";
import wsReply from "./addons/wsReply.js";
import { getCommandAdmin, getCommandRoles } from "./databases/commandsDb.js";
import { deleteReminder, getAllReminders } from "./databases/remindersDb.js";
import trimStartingIndent from "./utils/trimStartingIndent.js";
import moment from "moment-timezone";

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
  // await db.init();  // Create or Re-create tables comment out when not needed
});

client.once("ready", async () => {
  console.log(`${chalk.blue(client.user.tag)} is ${chalk.green("ONLINE")}.\n`);

  let activityStatuses = client.commands.map(cmd => `for /${cmd.name}`);
  activityStatuses.unshift(process.env.STATUS_MSG);
  
  client.user.setActivity(activityStatuses[0], { type: process.env.STATUS_TYPE });
  
  client.commands.each(async cmd => {
    const data = {};
    
    if (cmd.name) {
      data.name = cmd.name;
      data.description = cmd.description ?? "サメです";
      
      if (cmd.options) data.options = cmd.options;
      if (cmd.default_permission) data.default_permission = cmd.default_permission;

      getApp(guildId).commands.post({ data: data });
    }
  });

  // Interval checks every 30 secs
  setInterval(async () => {
    // Rotate bot activity message
    client.user.setActivity(activityStatuses[Math.floor(Math.random() * activityStatuses.length)], { type: process.env.STATUS_TYPE });

    // Reminders check
    const reminders = await getAllReminders();
    
    for (const reminder of reminders) {
      if (moment().isSameOrAfter(new Date(reminder.dateTime))) {
        const embedMsg = new MessageEmbed()
          .setColor("#2576A3")
          .setTitle("Reminder")
          .setDescription(reminder.roleId && reminder.channelId ? `<@&${reminder.roleId}>, ${reminder.message}` : reminder.message)
          .addFields({
            name: "When",
            value: moment(reminder.dateTime).format("DD/MM/YYYY hh:mm a")
          },
          {
            name: "Created by",
            value: client.users.cache.get(reminder.authorId).toString()
          })
          .setFooter(process.env.EMBED_HOST_FOOTER, client.user.avatarURL())
          .setTimestamp();

        if (reminder.roleId && reminder.channelId) client.channels.cache.get(reminder.channelId).send(embedMsg);
        else client.users.cache.get(reminder.authorId).send(embedMsg);
        
        deleteReminder(reminder.authorId, reminder.message, reminder.dateTime, reminder.roleId, reminder.channelId);
      }
    }
  }, 30000);
});

// Slash Commands
client.ws.on("INTERACTION_CREATE", async interaction => {
  const member = interaction.member;
  const { name, options } = interaction.data
  const command = name.toLowerCase();
  var args = [];

  const buildArgs = (obj) => {
    if (obj?.name && !obj.value) args.push(obj.name);
    if (obj?.value) args.push(obj.value);
    if (obj?.options?.length < 1) return;
    
    if (Array.isArray(obj)) {
      obj.forEach(option => buildArgs(option));
    }
    else {
      obj?.options?.forEach(option => buildArgs(option));
    }
  }

  buildArgs(options);

  console.log(
    chalk.magenta.bold("WS > ") +
    chalk.green.bold(`${member?.user?.username}#${member?.user?.discriminator}: `) +
    chalk.cyan(`\/${command} ${args.join(" ")}`)
  );
  
  const reqAdmin = await getCommandAdmin(command);
  const userRoles = member?.roles ?? [];
  let cmdRoles = await getCommandRoles(command);
  cmdRoles = cmdRoles?.split("::") ?? cmdRoles;
  
  if (!reqAdmin && cmdRoles == null ||
    !reqAdmin && cmdRoles && userRoles.length > 0 && userRoles.filter(roleId => cmdRoles?.indexOf(roleId) > -1) ||
    reqAdmin && client.guilds.cache.get(interaction.guild_id).member(interaction.member.user.id).hasPermission("ADMINISTRATOR")) {
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
      const reqAdmin = await getCommandAdmin(command);
      
      let cmdRoles = await getCommandRoles(command);
      cmdRoles = cmdRoles?.split("::") ?? cmdRoles;

      let userRoles = message.member?.roles?.cache;

      if (!reqAdmin && cmdRoles === null ||
        !reqAdmin && cmdRoles && userRoles.size > 0 && userRoles.find(role => cmdRoles.indexOf(role.id) > -1) ||
        reqAdmin && message.member.hasPermission("ADMINISTRATOR")) {
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
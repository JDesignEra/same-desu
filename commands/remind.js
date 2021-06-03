import dotenv from "dotenv";
import { MessageEmbed } from 'discord.js';
import moment from 'moment';
import wsReply from "../addons/wsReply.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import { createReminder, deleteReminder, getAllReminders } from "../databases/remindersDb.js";

dotenv.config();

export const name = "remind";
export const description = "I shall remind you or a role about something.";
export const options = [
  {
    name: "when",
    description: "When should I remind you?",
    type: 3,
    required: true
  },
  {
    name: "message",
    description: "Message of this reminder.",
    type: 3,
    required: true
  },
  {
    name: "role",
    description: "Which role should I remind? (Leave it empty and I will remind you instead)",
    type: 8
  }
]

export const execute = async (client, message, args, isWs = false) => {
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;
  const authorId = message.author?.id ?? message.member?.user?.id;
  const usageMessage = trimStartingIndent(`
    **どうも ${tagUser}, サメです。**
    \u2022 Use \`/remind <when> <message> <role?>\` or tag me with \`remind <when> <message> <role?>\` to set a reminder.
  `);

  if (isWs && args.length > 0 || !isWs && args.length > 1) {
    const momentFormat = [
      "DD/MM/YYYY HH:mm",
      "DD/MM/YYYY hh:mm a",
      "DD/MM/YYYY h:mm a",
      "DD/M/YYYY HH:mm",
      "DD/M/YYYY hh:mm a",
      "DD/M/YYYY h:mm a",
      "D/MM/YYYY HH:mm",
      "D/MM/YYYY hh:mm a",
      "D/MM/YYYY h:mm a",
      "D/M/YYYY HH:mm",
      "D/M/YYYY hh:mm a",
      "D/M/YYYY h:mm a",
      "HH:mm",
      "hh:mm a",
      "h:mm a"
    ];
    const keywords = {
      "years": ["years", "year", "yrs", "yr"],
      "months": ["months", "month", "mths", "mth"],
      "days": ["days", "day"],
      "hours": ["hours", "hour", "hrs", "hr"],
      "minutes": ["minutes", "minute", "mins", "min"]
    }
    const whenArgs = isWs ? args[0].split(" ") : args;

    let momentReminder = moment(`${args[0]} ${args[1]} ${args[2]} ${args[3]}`, momentFormat, true);
    let whenIdx = 3;

    if (!momentReminder.isValid()) {
      momentReminder = moment(`${args[0]} ${args[1]} ${args[2]}`, momentFormat, true);
      whenIdx = 2;
    }

    if (!momentReminder.isValid()) {
      momentReminder = moment(`${args[0]} ${args[1]}`, momentFormat, true);
      whenIdx = 1;
    }

    if (!momentReminder.isValid()) {
      momentReminder = moment(args[0], momentFormat, true);
      whenIdx = 0;
    }

    if (!momentReminder.isValid()) {
      let addYears = 0;
      let addMonths = 0;
      let addDays = 0;
      let addHours = 0;
      let addMinutes = 0;
      
      const yearIdx = whenArgs.findIndex(arg => keywords.years?.filter(key => arg.includes(key)).length > 0);
      const monthIdx = whenArgs.findIndex(arg => keywords.months?.filter(key => arg.includes(key)).length > 0);
      const dayIdx = whenArgs.findIndex(arg => keywords.days?.filter(key => arg.includes(key)).length > 0);
      const hourIdx = whenArgs.findIndex(arg => keywords.hours?.filter(key => arg.includes(key)).length > 0);
      const minuteIdx = whenArgs.findIndex(arg => keywords.minutes?.filter(key => arg.includes(key)).length > 0);

      if (yearIdx > -1) {
        if (whenArgs[yearIdx].match(/\d+/g)) { addYears = parseInt(whenArgs[yearIdx].match(/\d+/g)[0]); }
        else if (yearIdx > 0 && !isNaN(whenArgs[yearIdx - 1])) addYears = parseInt(whenArgs[yearIdx - 1]);

        if (yearIdx > whenIdx) whenIdx = yearIdx;
      }

      if (monthIdx > -1) {
        if (whenArgs[monthIdx].match(/\d+/g)) addMonths = parseInt(whenArgs[monthIdx].match(/\d+/g)[0]);
        else if (monthIdx > 0 && !isNaN(whenArgs[monthIdx - 1])) addMonths = parseInt(whenArgs[monthIdx - 1]);

        if (monthIdx > whenIdx) whenIdx = monthIdx;
      }

      if (dayIdx > -1) {
        if (whenArgs[dayIdx].match(/\d+/g)) addDays = parseInt(whenArgs[dayIdx].match(/\d+/g)[0]);
        else if (dayIdx > 0 && !isNaN(whenArgs[dayIdx - 1])) addDays = parseInt(whenArgs[dayIdx - 1]);

        if (dayIdx > whenIdx) whenIdx = dayIdx;
      }

      if (hourIdx > -1) {
        if (whenArgs[hourIdx].match(/\d+/g)) addHours = parseInt(whenArgs[hourIdx].match(/\d+/g)[0]);
        else if (hourIdx > 0 && !isNaN(whenArgs[hourIdx - 1])) addHours = parseInt(whenArgs[hourIdx - 1]);

        if (hourIdx > whenIdx) whenIdx = hourIdx;
      }

      if (minuteIdx > -1) {
        if (whenArgs[minuteIdx].match(/\d+/g)) addMinutes = parseInt(whenArgs[minuteIdx].match(/\d+/g)[0]);
        else if (minuteIdx > 0 && !isNaN(whenArgs[minuteIdx - 1])) addMinutes = parseInt(whenArgs[minuteIdx - 1]);

        if (minuteIdx > whenIdx) whenIdx = minuteIdx;
      }

      if (addYears > 0 || addMonths > 0 || addDays > 0 || addHours > 0 || addMinutes > 0) {
        momentReminder = moment().add({
          years: addYears,
          months: addMonths,
          days: addDays,
          hours: addHours,
          minutes: addMinutes
        });
      }
      else {
        if (isWs) wsReply(client, message, usageMessage);
        else message.channel.send(usageMessage);
      }
    }

    if (moment().isSameOrAfter(new Date(momentReminder))) {
      if (isWs) wsReply(client, message, `\`<when>\` argument has to be later then ${moment().format("DD/MM/YYYY hh:mm a")}.`)
      else message.channel.send(`${tagUser}, \`<when>\` argument has to be later then ${moment().format("DD/MM/YYYY hh:mm a")}.`);
    }
    else {
      const roleId = isWs ? args[2] ?? null : /^<@&\d+>$/g.test(whenArgs[whenArgs.length - 1]) ? whenArgs[whenArgs.length - 1].slice(3, -1) : null;
      const reminderMsg = isWs ? args[1] : whenArgs.slice(whenIdx + 1, roleId ? -1 : whenArgs.length).join(" ");
      
      const channelId = roleId ? isWs ? message.channel_id : message.channel.id : null;
      await createReminder(authorId, reminderMsg, momentReminder.format(), roleId, channelId);

      if (isWs) wsReply(client, message, `${tagUser}, ${roleId ? `<@&${roleId}>` : "you"} will be reminded about **${reminderMsg}** on **${momentReminder.format("DD/MM/YYYY hh:mm a")}**.`);
      else message.channel.send(`${tagUser}, ${roleId ? `<@&${roleId}>` : "you"} will be reminded about **${reminderMsg}** on **${momentReminder.format("DD/MM/YYYY hh:mm a")}**.`);

      // Schedule Send Reminder
      setTimeout(() => {
        const embedMsg = new MessageEmbed()
          .setColor("#2576A3")
          .setTitle("Reminder")
          .setDescription(roleId && channelId ? `<@&${roleId}>, ${reminderMsg}` : reminderMsg)
          .addFields({
            name: "When",
            value: momentReminder.format("DD/MM/YYYY hh:mm a")
          },
          {
            name: "Created by",
            value: client.users.cache.get(authorId).toString()
          })
          .setFooter(process.env.EMBED_HOST_FOOTER, client.user.avatarURL())
          .setTimestamp();

          if (roleId && channelId) client.channels.cache.get(channelId).send(embedMsg);
          else client.users.cache.get(authorId).send(embedMsg);
          
          deleteReminder(authorId, reminderMsg, momentReminder.format(), roleId, channelId);
      }, moment.duration(momentReminder.diff(moment())).as("milliseconds"));
    }
  }
  else if (isWs) wsReply(client, message, usageMessage);
  else message.channel.send(usageMessage);
}

export const initSendReminder = async (client) => {
  const reminders = await getAllReminders();
    
  for (const reminder of reminders) {
    setTimeout(() => {
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
    }, moment.duration(moment(reminder.dateTime).diff(moment())).as("milliseconds"));
  }
}
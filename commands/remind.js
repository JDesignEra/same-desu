import dotenv from "dotenv";
import { MessageEmbed } from 'discord.js';
import moment from 'moment';
import trimStartingIndent from "../utils/trimStartingIndent.js";
import { createReminder, deleteReminder, getAllReminders } from "../databases/remindersDb.js";
import momentFormats from "../data/moment/momentFormats.js";

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
export const execute = async (client, interaction, args, isWs = false) => {
  const tagUser = interaction.author?.toString() ?? `<@${interaction.member.user.id.toString()}>`;
  const authorId = interaction.author?.id ?? interaction.member?.user?.id;
  const usageMessage = trimStartingIndent(`
    **どうも ${tagUser}, サメです。**
    \u2022 Use \`/remind <when> <message> <role?>\` or tag me with \`remind <when> <message> <role?>\` to set a reminder.
    \u2022 Use \`/help remind\` or tag me with \`help remind\` for more information about **remind** command.
  `);

  if (isWs && args.length > 0 || !isWs && args.length > 1) {
    const keywords = {
      "years": ["years", "year", "yrs", "yr"],
      "months": ["months", "month", "mths", "mth"],
      "days": ["days", "day"],
      "hours": ["hours", "hour", "hrs", "hr"],
      "minutes": ["minutes", "minute", "mins", "min"]
    }
    const whenArgs = isWs ? args[0].split(" ") : args;

    let momentReminder = moment(`${args[0]} ${args[1]} ${args[2]} ${args[3]}`, momentFormats, true);
    let whenIdx = 3;

    if (!momentReminder.isValid()) {
      momentReminder = moment(`${args[0]} ${args[1]} ${args[2]}`, momentFormats, true);
      whenIdx = 2;
    }

    if (!momentReminder.isValid()) {
      momentReminder = moment(`${args[0]} ${args[1]}`, momentFormats, true);
      whenIdx = 1;
    }

    if (!momentReminder.isValid()) {
      momentReminder = moment(args[0], momentFormats, true);
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
      else momentReminder = undefined;
    }

    const momentNow = moment();

    if (momentReminder === undefined || momentReminder === null) {
      if (isWs) interaction.reply(usageMessage);
      else interaction.channel.send(usageMessage);
    }
    else if (momentNow.isSameOrAfter(momentReminder.format())) {
      const whenErrorMsg = `\`<when>\` argument has to be later then **${moment().format("DD/MM/YYYY hh:mm a")}**.`;

      if (isWs) interaction.reply(whenErrorMsg);
      else interaction.channel.send(whenErrorMsg);
    }
    else {
      const roleId = isWs ? args[2] ?? null : /^<@&\d+>$/g.test(whenArgs[whenArgs.length - 1]) ? whenArgs[whenArgs.length - 1].slice(3, -1) : null;
      const reminderMsg = isWs ? args[1] : whenArgs.slice(whenIdx + 1, roleId ? -1 : whenArgs.length).join(" ");
      const channelId = roleId ? isWs ? interaction.channel_id : interaction.channel.id : null;
      const sendMsg = `${tagUser}, ${roleId ? `<@&${roleId}>` : "you"} will be reminded about **${reminderMsg}** on **${momentReminder.format("DD/MM/YYYY hh:mm a")}**.`;

      const reminders = await getAllReminders();

      await createReminder(authorId, reminderMsg, momentReminder.format(), roleId, channelId);

      if (isWs) interaction.reply(sendMsg);
      else interaction.channel.send(sendMsg);

      // Send reminder with interval or timeout
      const msDelay = momentReminder.diff(momentNow);

      if (reminders.length < 1 && msDelay > -2147483648 && msDelay < 2147483647) {
        client.setTimeout(() => {
          sendReminder(client, authorId, reminderMsg, momentReminder.format(), roleId, channelId);
        }, msDelay);
      }
      else if (reminders.length < 1) initSendRemindersInterval(client);
    }
  }
  else if (isWs) interaction.reply(usageMessage);
  else interaction.channel.send(usageMessage);
}

export const initSendRemindersInterval = async (client) => {
  let reminders = await getAllReminders();

  if (reminders.length > 0) {
    const remindInterval = setInterval(async () => {
      reminders = await getAllReminders();

      reminders.forEach((reminder, i) => {
        if (moment().isSameOrAfter(reminder.dateTime)) {
          sendReminder(client, reminder.authorId, reminder.message, reminder.dateTime, reminder.roleId, reminder.channelId);
          reminders.splice(i, 1);
        }
      });
  
      if (reminders.length < 1) clearInterval(remindInterval);
    }, 15000);
  }
}

const sendReminder = async (client, authorId, message, dateTime, roleId, channelId) => {
  const embed = new MessageEmbed()
    .setColor("#2576A3")
    .setTitle("REMINDER")
    .setDescription(roleId && channelId ? `<@&${roleId}>, ${message}` : message)
    .addFields({
      name: "Created by",
      value: client.users.cache.get(authorId)?.toString() ?? "\u200b"
    })
    .setFooter(process.env.EMBED_HOST_FOOTER, client.user.avatarURL())
    .setTimestamp();

  if (roleId && channelId) client.channels.cache.get(channelId)?.send({ embeds: [embed] });
  else client.users.cache.get(authorId)?.send({ embeds: [embed] });

  deleteReminder(authorId, message, dateTime, roleId, channelId);
}
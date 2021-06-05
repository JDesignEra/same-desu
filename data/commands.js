import trimStartingIndent from "../utils/trimStartingIndent.js";
import deeplLanguages from "../data/translate/deeplLanguages.js";
import googleLanguages from "../data/translate/googleLanguages.js";
import organization from "../data/vtuber/organization.js";

export default [
  {
    command: "about",
    description: "I will provide you with information about my creator.",
    admin: false,
    roles: null,
    usage: ["`about`"]
  },
  {
    command: "anime",
    description: "I will retrieve anime related information for you.",
    admin: false,
    roles: null,
    usage: [
      "`anime latest` - I will retrieve the latest anime episodes on 9Anime.",
      "`anime season <year?> <season?>` - I will provide a list of anime for that season. (Both year and season are optional together as a set)",
      "`anime <name>` - I will provide a list of anime that matches that name. (Spaces are allowed)",
    ]
  },
  {
    command: "define",
    description: "I will get the definitions of that word",
    admin: false,
    roles: null,
    usage: [
      "`define <word>` - I will find the proper definitions for a word.",
      "`define word <word>` - I will find the proper definitions for a word.",
      "`define urban <word>` - I will find the definitions for that word on Urban Dictionary.",
    ]
  },
  {
    command: "hello",
    description: "I shall greet you.",
    admin: false,
    roles: null,
    usage: ["`hello`"]
  },
  {
    command: "help",
    description: "I will tell you about what I can do.",
    admin: false,
    roles: null,
    usage: [
      "`help` - I will tell you about what I can do.",
      "`help <command>` - Command detailed help information."
    ]
  },
  {
    command: "insult",
    description: "I shall insult someone for you or yourself.",
    admin: false,
    roles: null,
    usage: [
      "`insult` - I will insult you.",
      "`insult <@user>` - I will insult that person you tag."
    ]
  },
  {
    command: "nekopunch",
    description: "I will Neko Punch you or someone.",
    admin: false,
    roles: null,
    usage: [
      "`nekopunch` - I will Neko Punch you.",
      "`nekopunch <@user>` - I will Neko Punch that person you tag"
    ]
  },
  {
    command: "remind",
    description: trimStartingIndent(`I shall remind you or a role about something.

      Some valid formats for \`when\` argument are:
      \u2022 25/12/2022 01:00 pm
      \u2022 25/12/2022 1:00 pm
      \u2022 25/12/2022 24:00
      \u2022 25/12/2022 1:00
      \u2022 1:00 pm
      \u2022 24:00
      \u2022 1:00
      \u2022 1 year
      \u2022 2 months
      \u2022 2 days
      \u2022 2 hours
      \u2022 2 minutes
      \u2022 1 year 2 months 2 days 2 hours 2 minutes`),
    admin: false,
    roles: null,
    usage: [
      "`remind <when> <message>` - I shall remind you about something with a DM.",
      "`remind <when> <message> <role>` - I shall remind a role about something."
    ],
  },
  {
    command: "translate",
    description: trimStartingIndent(`I will translate for you.

      **__Valid Language Code__**
      ${Object.entries({...googleLanguages, ...deeplLanguages}).map(([k, v]) => `**${k}** - ${v}`).join("\n")}
    `),
    admin: false,
    roles: null,
    usage: ["`\`translate <sentence> <to language?>\``"]
  },
  {
    command: "vtuber",
    description: trimStartingIndent(`vTuber related commands.

      Some valid formats for \`organization\` argument:
      ${organization.map(org => `\u2022 ${org}`).join("\n")}`),
    admin: false,
    roles: null,
    usage: [
      "`vtuber list <organization>` - I will provide you a  list of of vTuber's related information.",
      "`vtuber live <organization> <type?>` - I will provide you a list of vTuber's streams that are currently streaming.",
      "`vtuber upcoming <organization> <hours?> <type?>` - I will provide you a list of vTuber's upcoming streams that are not live yet."
    ]
  },
  {
    command: "clear",
    description: "I shall clean the chat for you. This is an **administrator** only command.",
    admin: true,
    roles: null,
    usage: [
      "`clear all` - I will clear all messages in that channel.",
      "`clear <int>` - I will will clear that last x number of messages from that channel."
    ]
  }
];
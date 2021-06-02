import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import chalk from "chalk";
import Sequelize from "sequelize";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import deeplLanguages from "../data/deeplLanguages.js";
import googleLanguages from "../data/googleLanguages.js";

dotenv.config();

const name = "commandsDb";
const sequelize = new Sequelize.Sequelize(process.env.DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: process.env.SQLITE_FILENAME
});
const Commands = sequelize.define("commands", {
  "command": {
    type: Sequelize.DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  "description": {
    type: Sequelize.DataTypes.STRING,
    defaultValue: "",
    allowNull: false
  },
  "admin": {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  "roles": {
    type: Sequelize.DataTypes.STRING,
    defaultValue: null,
    allowNull: true
  },
  "usage": {
    type: Sequelize.DataTypes.STRING,
    defaultValue: null,
    allowNull: true
  }
}, { timestamps: false });

export const execute = async () => {
  await Commands.sync();
}

export const getAllCommands = async () => {
  return Commands.findAll({ raw: true });
}


export const getCommandRoles = async (command) => {
  const data = await Commands.findByPk(command, {
    raw: true,
    attributes: ["roles"]
  });

  return data?.roles;
}


export const getCommandAdmin = async (command) => {
  const data = await Commands.findByPk(command, {
    raw: true,
    attributes: ["admin"]
  });

  return data?.admin ?? false;
}

export const init = async (force = false) => {
  if (!fs.existsSync(`../${process.env.SQLITE_FILENAME}`) || force) {
    try {
      console.log(chalk.magenta.bold(`${name} > `) + chalk.yellow(`creating ${name}.`));
      
      await Commands.truncate();
      await Commands.bulkCreate([
        {
          command: "about",
          description: "I will provide you with information about my creator.",
          usage: "`about`"
        },
        {
          command: "anime",
          description: "I will retrieve anime related information for you.",
          usage: [
            "`anime latest`                   - I will retrieve the latest anime episodes on 9Anime.",
            "`anime season <year?> <season?>` - I will provide a list of anime for that season. (Both year and season are optional together as a set)",
            "`anime <name>`                   - I will provide a list of anime that matches that name. (Spaces are allowed)",
          ].join("::")
        },
        {
          command: "define",
          description: "I will get the definitions of that word",
          usage: [
            "`define <word>`        - I will find the proper definitions for a word.",
            "`define word <word>`   - I will find the proper definitions for a word.",
            "`define urban <word>`  - I will find the definitions for that word on Urban Dictionary.",
          ].join("::")
        },
        {
          command: "hello",
          description: "I shall greet you.",
          usage: "`hello`"
        },
        {
          command: "help",
          description: "I will tell you about what I can do.",
          usage: [
            "`help`           - I will tell you about what I can do.",
            "`help <command>` - Command detailed help information."
          ].join("::")
        },
        {
          command: "insult",
          description: "I shall insult someone for you or yourself.",
          usage: [
            "`insult`         - I will insult you.",
            "`insult <@user>` - I will insult that person you tag."
          ].join("::")
        },
        {
          command: "nekopunch",
          description: "I will Neko Punch you or someone.",
          usage: [
            "`nekopunch`         - I will Neko Punch you.",
            "`nekopunch <@user>` - I will Neko Punch that person you tag"
          ].join("::")
        },
        {
          command: "remind",
          description: trimStartingIndent(`
            I shall remind you or a role about something.
  
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
          usage: [
            "`remind <when> <message>`        - I shall remind you about something with a DM.",
            "`remind <when> <message> <role>` - I shall remind a role about something."
          ].join("::"),
        },
        {
          command: "translate",
          description: trimStartingIndent(`
            I will translate for you.
  
            **__Valid Language Code__**
            ${Object.entries({...googleLanguages, ...deeplLanguages}).map(([k, v]) => `**${k}** - ${v}`).join("\n")}
          `),
          usage: "`\`translate <sentence> <to language?>\``"
        },
        {
          command: "clear",
          description: "I shall clean the chat for you. This is an **administrator** only command.",
          admin: true,
          usage: [
            "`clear all` - I will clear all messages in that channel.",
            "`clear <int>` - I will will clear that last x number of messages from that channel."
          ].join("::"),
        }
      ]);
    }
    catch (e) {
      if (e.name !== "SequelizeUniqueConstraintError") {
        console.log(chalk.red(`Failed to init ${name.toUpperCase()} database.`));
        console.log(chalk.red(`${e.name}: ${e.message}\n`));
      }
    }
  }
}
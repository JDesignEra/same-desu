import dotenv from "dotenv";
import chalk from "chalk";
import Sequelize from "sequelize";
import trimStartingIndent from "../utils/trimStartingIndent.js";

dotenv.config();

const name = "commandsDb";
const sequelize = new Sequelize.Sequelize(process.env.DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite"
});
const Commands = sequelize.define("commands", {
  "command": {
    type: Sequelize.DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  "description": {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false,
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
  return await Commands.findAll({ raw: true });
}


export const getCommandRoles = async (command) => {
  const data = await Commands.findByPk(command, {
    raw: true,
    attributes: ["roles"]
  });

  return data?.roles;
}

export const init = async () => {
  try {
    await Commands.truncate();
    await Commands.bulkCreate([
      {
        command: "about",
        description: "I will provide you with information about my creator.",
        usage: "`about`"
      },
      {
        command: "anime",
        description: trimStartingIndent(`
          I will retrieve anime related information for you.
        `),
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
        command: "insult",
        description: "I shall insult someone for you or yourself.",
        usage: [
          "`insult`       - I will insult you.",
          "`insult <@user?>` - I will insult that person you tagged. Leaving @user parameter empty and I will insult you. "
        ].join("::"),
      },
      {
        command: "clear",
        description: "I shall clean the chat for you. This is an **administrator** only command.",
        admin: true,
        roles: "278178035927351298",
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
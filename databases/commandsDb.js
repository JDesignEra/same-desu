import dotenv from "dotenv";
import chalk from "chalk";
import Sequelize from "sequelize";

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
    unique: true,
    allowNull: false
  },
  "description": {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  "usage": {
    type: Sequelize.DataTypes.STRING,
    defaultValue: null,
    allowNull: true
  }
}, { timestamps: false });

export const execute = () => {
  Commands.sync();
}

export const getAllCommands = async () => {
  return await Commands.findAll({ raw: true });
}

export const init = async () => {
  try {
    await Commands.bulkCreate([
      {
        command: "about",
        description: "I will provide you with information about my creator.",
        usage: "`about`",
      },
      {
        command: "anime",
        description: "I will retrieve anime related information for you.",
        usage: "`anime latest` - I will retrieve the latest anime episodes on 9Anime."
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
          "`insult @user` - I will insult that person."
        ].join("::"),
      },
      {
        command: "clear",
        description: "I shall clean the chat for you. This is an **administrator** only command.",
        usage: [
          "`clear <all>` - I will clear all messages in that channel.",
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
import dotenv from "dotenv";
import chalk from "chalk";
import Sequelize from "sequelize";

dotenv.config();

const name = "greetingsDb";
const sequelize = new Sequelize.Sequelize(process.env.DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite"
});
const Greetings = sequelize.define("greetings", {
  "greeting": {
    type: Sequelize.DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  "state": {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, { timestamps: false });

export const execute = async () => {
  await Greetings.sync();
}

export const getAllGreetings = async () => {
  return Greetings.findAll({ raw: true });
}

export const init = async () => {
  try {    
    await Greetings.truncate();
    await Greetings.bulkCreate([
      {
        greeting: "bonjour",
        state: true,
      },
      {
        greeting: "domo",
        state: true,
      },
      {
        greeting: "hello",
        state: true,
      },
      {
        greeting: "hey",
        state: true,
      },
      {
        greeting: "hi",
        state: true,
      },
      {
        greeting: "howdy",
        state: true,
      },
      {
        greeting: "sup",
        state: true,
      },
      {
        greeting: "greeting",
        state: true,
      },
      {
        greeting: "greetings",
        state: true,
      },
      {
        greeting: "ども",
        state: true,
      },
      {
        greeting: "こんにちわ",
        state: true,
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
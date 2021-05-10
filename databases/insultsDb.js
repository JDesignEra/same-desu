import dotenv from "dotenv";
import chalk from "chalk";
import Sequelize from "sequelize";

dotenv.config();

const name = "insultsDb";
const sequelize = new Sequelize.Sequelize(process.env.DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite"
});
const Insults = sequelize.define("insults", {
  "insult": {
    type: Sequelize.DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  "state": {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  }
}, { timestamps: false });

export const execute = () => {
  Insults.sync();
}

export const getAllInsults = async () => {
  return await Insults.findAll({ raw: true });
}

export const init = async () => {
  try {
    await Insults.bulkCreate([
      {
        insult: "FAQ <user>!",
        state: true
      },
      {
        insult: "FAQ you <user>!",
        state: true
      },
      {
        insult: "F*ck you <user>!",
        state: true
      },
      {
        insult: "Are you fucking kidding me <user>!?",
        state: true
      },
      {
        insult: "Stay home dayo <user>!",
        state: true
      },
      {
        insult: "You're too small <user>.",
        state: true
      },
      {
        insult: "Stop it <user>, eeewwww.",
        state: true
      },
      {
        insult: "<user> weirdo, or dare I say ばか。",
        state: true
      },
      {
        insult: "<user>、ボコボコにするよ、まじで。",
        state: true
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
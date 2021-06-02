import fs from "fs";
import dotenv from "dotenv";
import chalk from "chalk";
import Sequelize from "sequelize";

dotenv.config();

const name = "insultsDb";
const sequelize = new Sequelize.Sequelize(process.env.DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: process.env.SQLITE_FILENAME
});
const Insults = sequelize.define("insults", {
  "insult": {
    type: Sequelize.DataTypes.STRING,
    primaryKey: true,
    unique: true,
    allowNull: false
  },
  "state": {
    type: Sequelize.DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, { timestamps: false });

export const execute = async () => {
  await Insults.sync();
}

export const getAllInsults = async () => {
  return Insults.findAll({ raw: true });
}

export const init = async (force = false) => {
  fs.access(`./${process.env.SQLITE_FILENAME}`, fs.F_OK, async err => {
    if (err || force) {
      console.log(chalk.magenta.bold(`${name} > `) + chalk.yellow(`creating ${name}.`));
      if (err) console.log(chalk.red.bold(`${err.name}: `) + chalk.red(`${err.message}\n`));

      try {
        await Insults.truncate();
        await Insults.bulkCreate([
          { insult: "FAQ <user>!" },
          { insult: "FAQ you <user>!" },
          { insult: "<user>, Pol... Poltato? You are a Poltato PC. I am beef PC." },
          { insult: "F*ck you <user>!" },
          { insult: "Are you fucking kidding me <user>!?" },
          { insult: "Stay home dayo <user>!" },
          { insult: "You're too small <user>." },
          { insult: "Stop it <user>, eeewwww." },
          { insult: "<user> weirdo, or dare I say ばか。" },
          { insult: "<user>、ボコボコにするよ、まじで。" }
        ]);
      }
      catch (e) {
        if (e.name !== "SequelizeUniqueConstraintError") {
          console.log(chalk.red(`Failed to init ${name.toUpperCase()} database.`));
          console.log(chalk.red(`${e.name}: ${e.message}\n`));
        }
      }
    }
  });
}
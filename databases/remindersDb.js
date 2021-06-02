import dotenv from "dotenv";
import chalk from "chalk";
import Sequelize from "sequelize";

dotenv.config();

const name = "remindersDb";
const sequelize = new Sequelize.Sequelize(process.env.DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: process.env.SQLITE_FILENAME
});
const Reminders = sequelize.define("reminders", {
  "authorId": {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  "message": {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  "dateTime": {
    type: Sequelize.DataTypes.STRING,
    allowNull: false
  },
  "roleId": {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  },
  "channelId": {
    type: Sequelize.DataTypes.STRING,
    allowNull: true
  }
}, { timestamps: false });

export const execute = async () => {
  await Reminders.sync();
}

export const getAllReminders = async () => {
  return Reminders.findAll({ raw: true });
}

export const createReminder = async (authorId, message, dateTime, roleId = null, channelId = null) => {
  let status = false;

  try {
    await Reminders.create({ authorId, message, dateTime, roleId, channelId }).then(() => {
      status = true;
    });
  }
  catch (e) {
    if (e.name !== "SequelizeUniqueConstraintError") {
      console.log(chalk.red(`Failed to create entry in ${name.toUpperCase()} database.`));
      console.log(chalk.red(`${e.name}: ${e.message}\n`));
    }
  }

  return status;
}

export const deleteReminder = async (authorId, message, dateTime, roleId = null, channelId = null) => {
  const reminder = await Reminders.findOne({where: {
    authorId,
    message,
    dateTime,
    roleId,
    channelId
  }});

  if (reminder) await reminder.destroy();
}

export const init = async (force = false) => { return null; };
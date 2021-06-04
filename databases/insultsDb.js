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
  "attachment": {
    type: Sequelize.DataTypes.STRING,
    allowNull: true,
  },
  "attachmentType": {
    type: Sequelize.DataTypes.STRING,
    allowNull: true,
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
  return Insults.findAll({
    where: { state: true },
    attributes: ["insult", "attachment", "attachmentType"],
    raw: true
  });
}

export const init = async () => {
  console.log(chalk.magenta.bold(`${name} > `) + chalk.yellow(`creating ${name}.`));

  try {
    await Insults.truncate();
    await Insults.bulkCreate([
      { insult: "B <user>!" },
    ]);
    await Insults.bulkCreate([
      {
        insult: "Orae! Bitch! FAQ <user>!",
        attachment: "Miko/bitch_faq.mp3",
        attachmentType: "audio"
      },
      {
        insult: "You're die <user>!",
        attachment: "Miko/you_are_die.mp3",
        attachmentType: "audio"
      },
      {
        insult: "ハアアア、うるせえ <user>！",
        attachment: "Miko/haaah_usae.mp3",
        attachmentType: "audio"
      },
      {
        insult: "English motherfucker, do you speak it <user>!?",
        attachment: "Miko/english_motherfucker.wav",
        attachmentType: "audio"
      },
      {
        insult: "What the faq <user>!?",
        attachment: "Miko/what_the_faq.mp3",
        attachmentType: "audio"
      },
      {
        insult: "FAQQQQQ <user>!",
        attachment: "Miko/faqqqqqq.mp3",
        attachmentType: "audio"
      },
      {
        insult: "Kiss my ass <user>!",
        attachment: "Miko/kiss_my_ass.mp3",
        attachmentType: "audio"
      },
      {
        insult: "Stay home だよ <user>!",
        attachment: "Miko/stay_home_dayo.wav",
        attachmentType: "audio"
      },
      {
        insult: "<user> ばか、ばか、ばか、ウンチ、ウンチ、ウンチ。",
        attachment: "Miko/baka_baka_baka_poop_poop_poop.mp3",
        attachmentType: "audio"
      },
      {
        insult: "<user> ばかーばかーばかーばかーばかだねぇ、ぷぷぷ！",
        attachment: "Miko/baka_baka_pupu.mp3",
        attachmentType: "audio"
      },
      {
        insult: "ばか！おおおうう、ばか、ばか <user>！",
        attachment: "Pekora/baka_oh_baka_baka.wav",
        attachmentType: "audio"
      },
      {
        insult: "くそガキがよ、早くご飯食いに行けよ、<user> 馬鹿野郎！",
        attachment: "Pekora/damn_you_kid_get_out_now_and_go_dinner,_you_idiot.mp3",
        attachmentType: "audio"
      },
      {
        insult: "<user> 見てんじゃねよこの放送をよ！くそガキが！",
        attachment: "Pekora/don_you_fucking_watch_this_fucking_broadcast_you_little_shit.mp3",
        attachmentType: "audio"
      },
      {
        insult: "早く正月あけれ… <user> 明けて学校に行ってみろよ！",
        attachment: "Pekora/finish_your_winter_vacation_and_go_back_to_grade_school.mp3",
        attachmentType: "audio"
      },
      {
        insult: "<user> おまえ、体育館の裏に来いよ。ボコボコにしてやっからな。",
        attachment: "Pekora/come_to_gym_afterward_i_am_going_to_kick_your_ass.mp3",
        attachmentType: "audio"
      },
      {
        insult: "You're too small <user>.",
        attachment: "Gura/yeah_well_your_is_too_small.mp3",
        attachmentType: "audio"
      },
    ]);
  }
  catch (e) {
    if (e.name !== "SequelizeUniqueConstraintError") {
      console.log(chalk.red(`Failed to init ${name.toUpperCase()} database.`));
      console.log(chalk.red(`${e.name}: ${e.message}\n`));
    }
  }
}
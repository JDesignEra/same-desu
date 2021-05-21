import axios from "axios";
import chalk from "chalk";
import wsPatch from "../addons/wsPatch.js";
import wsReply from "../addons/wsReply.js";
import deeplLangs from "../data/deeplLanguages.js";
import googleLangs from "../data/googleLanguages.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";

const deeplLanguages = deeplLangs;
const googleLanguages = googleLangs;
const languages = {...googleLanguages, ...deeplLanguages};

export const name = "translate";
export const description = "I will translate for you.";
export const options = [
  {
    name: "text",
    description: "Text to translate.",
    type: 3,
    required: true
  },
  {
    name: "to",
    description: "Language to translate to. [Defaults to English]",
    type: 3,
    choices: Object.keys(languages).map(key => { return { name: languages[key], value: key } })
  }
]

export const execute = async (client, message, args, isWs = false) => {
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;
  
  const deeplUrl = "https://api-free.deepl.com/v2";
  const googleUrl = "https://translate.googleapis.com"

  let toLang = Object.keys(deeplLanguages).find(key => deeplLanguages[key]?.toLowerCase() === args[args.length - 1]?.toLowerCase() || args[args.length - 1] === key) ??
    Object.keys(googleLanguages).find(key => googleLanguages[key]?.toLowerCase() === args[args.length - 1]?.toLowerCase() || args[args.length - 1] === key) ??
    "en";
  const sentence = Object.keys(deeplLanguages).find(key => deeplLanguages[key]?.toLowerCase() === args[args.length - 1]?.toLowerCase() || args[args.length - 1] === key)
    || Object.keys(googleLanguages).find(key => googleLanguages[key]?.toLowerCase() === args[args.length - 1]?.toLowerCase() || args[args.length - 1] === key)
    ? args.slice(0, -1).join(" ") : args.join(" ");

  let translation;
  let sendMsg;

  const googleTranslate = async (sentence, toLang) => {
    const parameters = `?client=gtx&sl=auto&tl=${toLang}&dt=t&q=${encodeURI(sentence)}`;
    const res = await axios.get(`${googleUrl}/translate_a/single${parameters}`);

    if(res.status === 200) return res.data[0][0][0];
    
    return undefined;
  }

  if (isWs) wsReply(client, message, "Please wait, I am translating...", null, 5);

  if (args.length > 0) {
    console.log(args);
    if (sentence && sentence.trim()) {
      if (deeplLanguages[toLang]) {
        const parameters = `?auth_key=${process.env.DEEPL_API_KEY}&text=${encodeURI(sentence)}${toLang && toLang.trim().length > 0 ? `&target_lang=${toLang}` : ""}`;
        const res = await axios.get(`${deeplUrl}/translate${parameters}`).catch(e => {
          console.log(chalk.red("\nDeepL translate failed to retrieve."));
          console.log(chalk.red(`${e.name}: ${e.message}`));
        });
        
        if (res?.status === 200) translation = res.data?.translations?.map(translated => translated.text).join("\n");
        else console.log(chalk.red(`\nDeepL translate failed to retrieve.`));

        if (!translation && !translation?.trim()) {
          translation = await googleTranslate(sentence, toLang);

          if (!translation && !translation?.trim()) sendMsg = "This is embarrassing, it seems that I am having some trouble translating it, please try again later.";
        }
      }
      else {
        translation = await googleTranslate(sentence, toLang);

        if (!translation && !translation?.trim()) sendMsg = "This is embarrassing, it seems that I am having some trouble translating it, please try again later.";
      }
    }
    else {
      sendMsg = trimStartingIndent(`
        **どうも ${tagUser}, サメです。**
        Use \`/translate <word> <to language?>\` or tag me with \`translate <word> <to language?>\` for a translation.
      `);
    }
  }
  else {
    sendMsg = trimStartingIndent(`
      **どうも ${tagUser}, サメです。**
      Use \`/translate <word> <to language?>\` or tag me with \`translate <word> <to language?>\` for a translation.
    `);
  }

  if (translation && translation?.trim().length > 0) {
    sendMsg = trimStartingIndent(`
      ${tagUser} here is the translation.
      ${sentence}

      ${translation}
    `);
  }

  if (isWs) wsPatch(client, message, sendMsg);
  else message.channel.send(sendMsg);
}
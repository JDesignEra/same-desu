import dotenv from "dotenv";
import axios from "axios";
import chalk from "chalk";
import wsPatch from "../addons/wsPatch.js";
import wsReply from "../addons/wsReply.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import deeplLanguages from "../data/translate/deeplLanguages.js";
import googleLanguages from "../data/translate/googleLanguages.js";
import microsoftLanguages from "../data/translate/microsoftLanguages.js";

dotenv.config();

const languages = {...googleLanguages, ...microsoftLanguages, ...deeplLanguages};
const deeplUrl = "https://api-free.deepl.com/v2";
const microsoftUrl = "https://api.cognitive.microsofttranslator.com";
const googleUrl = "https://translate.googleapis.com";

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
  const toLang = Object.keys(languages).find(key => languages[key]?.toLowerCase() === args[args.length - 1]?.toLowerCase() || args[args.length - 1] === key) ?? "en";
  const sentence = Object.keys(languages).find(key => languages[key]?.toLowerCase() === args[args.length - 1]?.toLowerCase() || args[args.length - 1] === key)
    ? args.slice(0, -1).join(" ") : args.join(" ");

  let translation;
  let sendMsg;

  if (isWs) wsReply(client, message, "Please wait, I am translating...", null, 5);

  if (args.length > 0) {
    if (sentence && sentence.trim()) {
      if (deeplLanguages[toLang]) {
        translation = await deeplTranslate(sentence, toLang);

        if (!translation && !translation?.trim()) {
          translation = await microsoftTranslate(sentence, toLang);

          if (!translation && !translation?.trim()) {
            translation = await googleTranslate(sentence, toLang);
            sendMsg = "This is embarrassing, it seems that I am having some trouble translating it, please try again later.";
          }
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

const deeplTranslate = async (sentences, toLanguage) => {
  const parameters = `?auth_key=${process.env.DEEPL_API_KEY}&text=${encodeURI(sentences)}${toLanguage && toLanguage.trim().length > 0 ? `&target_lang=${toLanguage}` : ""}`;
  const res = await axios.get(`${deeplUrl}/translate${parameters}`).catch(e => {
    console.log(chalk.red("\nDeepL translate failed to retrieve."));
    console.log(chalk.red(`${e.name}: ${e.message}`));
  });

  return res?.status === 200 ? res?.data?.translations?.map(translated => translated.text).join("\n") : undefined;
}

const microsoftTranslate = async (sentences, toLanguage) => {
  const res = await axios.request({
    url: `${microsoftUrl}/translate`,
    method: "post",
    headers: {
      "Ocp-Apim-Subscription-Key": process.env.AZURE_TRANSLATOR_API_KEY,
      "Ocp-Apim-Subscription-Region": "southeastasia",
      "Content-Type": "application/json"
    },
    params: {
      "api-version": "3.0",
      "to": toLanguage
    },
    data: [{"text": sentences}],
    responseType: "json"
  }).catch(e => {
    console.log(chalk.red("\nMicrosoft translate failed to retrieve."));
    console.log(chalk.red(`${e.name}: ${e.message}`));
  });

  return res?.status === 200 ? res?.data[0]?.translations[0]?.text : undefined;
}

const googleTranslate = async (sentences, toLanguage) => {
  const parameters = `?client=gtx&sl=auto&tl=${toLanguage}&dt=t&q=${encodeURI(sentences)}`;
  const res = await axios.get(`${googleUrl}/translate_a/single${parameters}`);
  
  return res.status === 200 ? res?.data[0][0][0] : undefined;
}
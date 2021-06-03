import axios from "axios";
import chalk from "chalk";
import { MessageEmbed } from "discord.js";
import pageReaction from "../addons/pageReaction.js";
import wsEditReplyPage from "../addons/wsEditReplyPage.js";
import wsPatch from "../addons/wsPatch.js";
import wsReply from "../addons/wsReply.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";

export const name = "define";
export const description = "I will get the definitions of that word.";
export const options = [
  {
    name: "word",
    description: "I will find the proper definitions for a word.",
    type: 1,
    options: [
      {
        name: "word",
        description: "Give me an English word for me to define.",
        type: 3,
        required: true
      }
    ]
  },
  {
    name: "urban",
    description: "I will find the definitions for that word on Urban Dictionary.",
    type: 1,
    options: [
      {
        name: "word",
        description: "Give me a word for me to define.",
        type: 3,
        required: true
      }
    ]
  }
]

export const execute = async (client, message, args, isWs = false) => {
  const oxfordUrl = "https://od-api.oxforddictionaries.com/api/v2"
  const urbanUrl = "https://mashape-community-urban-dictionary.p.rapidapi.com"

  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;
  const authorId = message.author?.id ?? message.member?.user?.id;
  const duration = 300000;

  const usageMessage = trimStartingIndent(`
    **どうも ${tagUser}, サメです。**
    \u2022 Use \`/define word <word>\`, or tag me with \`define word <word>\` or \`define <word>\` to search for a proper definition.
    \u2022 Use \`/define slang <word>\` or tag me with \`define slang <word>\` to search for a slang definition.
  `);

  if (isWs) wsReply(client, message, "Please wait, I am getting the word definitions.", null, 5);

  if (args.length > 0) {
    if (args.length > 1 && args[0] === "urban") {
      const word = args[1];
      const res = await axios.get(`${urbanUrl}/define?term=${word}`, {
        headers: {
          "x-rapidapi-key": "c323cf37afmsh6b084d8dec30f42p17981ajsne76728201303",
          "useQueryString": true
        }
      });
      
      if (res.status === 200) {
        const data = res.data.list;
        let embedMsgs = [];

        if (data.length > 0) {
          data.forEach((definition, i) => {
            embedMsgs.push(
              new MessageEmbed()
                .setColor("#2576A3")
                .setTitle(definition.word.replace(/^\w/, (c) => c.toUpperCase()))
                .setURL(definition.permalink)
                .setDescription(trimStartingIndent(`
                  ${definition.definition.replace(/\[|\]/gm, "")}
                  ${definition.example && definition.example.trim().length > 0 ? trimStartingIndent(`
                    **__Example(s)__**
                    ${trimStartingIndent(definition.example.replace(/\[|\]/gm, ""))}
                  `) : ""}
                  
                  ${data.length > 1 ? trimStartingIndent(`
                    ***Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.*
                  `) : ""}
                `))
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 1} / ${data.length}`, client.user.avatarURL())
                .setTimestamp()
            )
          });

          if (isWs) wsEditReplyPage(client, message, duration, authorId, embedMsgs);
          else {
            message.channel.send(embedMsgs[0]).then(async msg => {
              if (embedMsgs.length > 1) pageReaction(authorId, duration, embedMsgs, msg);
            }).catch(e => {
              console.log(chalk.red("\nFailed to send message"));
              console.log(chalk.red(`${e?.name}: ${e?.message}`));
              message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the definitions for that word, please kindly try again later.`);
            });
          }
        }
        else {
          console.log(chalk.red("\nUrban Dictionary no such word."));

          if (isWs) wsPatch(client, message, `${tagUser} it seems like that word does not exist.`);
          else message.channel.send(`${tagUser} it seems like that word does not exist.`);
        }
      }
      else {
        console.log(chalk.red(`\n${res.status}: Failed to send message`));
        
        if (isWs) wsPatch(client, message, `${tagUser} this is embarrassing, it seems that I am having trouble getting the definitions for that slang word, please kindly try again later.`);
        else message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the definitions for that slang word, please kindly try again later.`);
      }
    }
    else {
      const word = args.length > 1 && args[0] === "word" ? args[1] : args[0];
      const res = await axios.get(`${oxfordUrl}/entries/en-gb/${word}?fields=definitions%2Cexamples&strictMatch=false`, {
        headers: {
          Accept:  "application/json",
          app_id: process.env.OXFORD_DICT_ID,
          app_key: process.env.OXFORD_DICT_KEY
        }
      });
      
      if (res.status === 200) {
        let embedMsgs = [];
        const results = res?.data?.results;
        let definitionCount = 0;
        let definitions = {};
        
        for (const result of results) {
          for (const lexical of result.lexicalEntries) {
            if (!definitions[lexical.lexicalCategory.text]?.length > 0) {
              definitions[lexical.lexicalCategory.text] = [];
            }

            let category = definitions[lexical.lexicalCategory.text];

            for (const entry of lexical.entries) {
              for (const sense of entry.senses) {
                definitionCount++;

                category.push({
                  definition: sense.definitions[0],
                  examples: sense.examples?.map(eg => eg.text)
                });

                if (sense.subsenses) {
                  for (const subsense of sense.subsenses) {
                    definitionCount++;

                    category.push({
                      definition: subsense.definitions[0],
                      examples: subsense.examples?.map(eg => eg.text)
                    });
                  }
                }
              }
            }

            definitions[lexical.lexicalCategory.text] = category;
          }
        }

        let idx = 0;

        for (const category of Object.keys(definitions)) {
          for (let i = 0; i < definitions[category].length; i++) {
            const definition = definitions[category][i];

            embedMsgs.push(
              new MessageEmbed()
                .setColor("#2576A3")
                .setTitle(`${word.replace(/^\w/, (c) => c.toUpperCase())} (${category})`)
                .setDescription(trimStartingIndent(`
                  ${definition.definition.replace(/^\w/, (c) => c.toUpperCase())}
                  ${definition.examples?.length > 0 ? trimStartingIndent(`
                      **__Example(s)__**
                      ${definition.examples?.map(example => `\u2022\u2003${example.replace(/^\w/, (c) => c.toUpperCase())}`).join("\n")}
                    `) : ""
                  }
                  
                  ${definitions[category].length > 1 || Object.keys(definitions).length > 1 ? trimStartingIndent(`
                    ***Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.*
                  `) : ""}
                `))
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${idx + 1} / ${definitionCount}`, client.user.avatarURL())
                .setTimestamp()
            );

            idx++;
          }
        }

        if (isWs) wsEditReplyPage(client, message, duration, authorId, embedMsgs);
        else {
          message.channel.send(embedMsgs[0]).then(async msg => {
            if (embedMsgs.length > 1) pageReaction(authorId, duration, embedMsgs, msg);
          }).catch(e => {
            console.log(chalk.red("\nFailed to send message"));
            console.log(chalk.red(`${e.name}: ${e.message}`));
            message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the definitions for that word, please kindly try again later.`);
          });
        }
      }
      else if (res.status === 403) {
        console.log(chalk.red(`\n${res.status}: Oxford Dictionary API limit exceed.`));

        if (isWs) wsPatch(client, message, `${tagUser} this is embarrassing, it seems that I can't look up for any word definition for this month.`);
        else message.channel.send(`${tagUser} this is embarrassing, it seems that I can't look up for any word definition for this month.`);
      }
      else if (res.status === 404) {
        if (isWs) wsPatch(client, message, `${tagUser} it seems like that word may not exist.`);
        else message.channel.send(`${tagUser} it seems like that word may not exist`);
      }
      else {
        console.log(chalk.red(`\n${res.status}: Oxford Dictionary failed to retrieve.`));

        if (isWs) wsPatch(client, message, `${tagUser} this is embarrassing, it seems that I am having trouble defining that word. Please kindly try again later.`);
        else message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble defining that word. Please kindly try again later.`);
      }
    }
  }
  else if (isWs) {
    wsPatch(client, message, usageMessage);
  }
  else {
    message.channel.send(usageMessage);
  }
}
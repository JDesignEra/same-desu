import dotenv from "dotenv";
import axios from "axios";
import chalk from "chalk";
import { MessageEmbed } from "discord.js";
import pageReaction from "../addons/pageReaction.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import wsPageReaction from "../addons/wsPageReaction.js";

dotenv.config();

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
];
export const execute = async (client, interaction, args, isWs = false) => {
  const oxfordUrl = "https://od-api.oxforddictionaries.com/api/v2"
  const urbanUrl = "https://mashape-community-urban-dictionary.p.rapidapi.com"

  const tagUser = interaction.author?.toString() ?? `<@${interaction.member.user.id.toString()}>`;
  const authorId = interaction.author?.id ?? interaction.member?.user?.id;
  const reactDuration = 300000;

  const usageMessage = trimStartingIndent(`
    **どうも ${tagUser}, サメです。**
    \u2022 Use \`/define word <word>\`, or tag me with \`define word <word>\` or \`define <word>\` to search for a proper definition.
    \u2022 Use \`/define slang <word>\` or tag me with \`define slang <word>\` to search for a slang definition.
  `);
  const retrieveErrorMsg = `${tagUser} this is embarrassing, it seems that I am having trouble getting the definitions for that word, please kindly try again later.`;
  const limitErrorMsg = `${tagUser} this is embarrassing, it seems that I can't look up for any word definition for this month.`;

  if (isWs) interaction.defer();

  if (args.length > 0) {
    if (args.length > 1 && args[0] === "urban") {
      const word = args[1];
      const res = await axios.get(`${urbanUrl}/define?term=${word}`, {
        headers: {
          "x-rapidapi-key": process.env.RAPID_API_KEY,
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
                    **Example(s)**
                    ${trimStartingIndent(definition.example.replace(/\[|\]/gm, ""))}
                  `) : ""}
                  ${data.length > 1 ? trimStartingIndent(`
                    ***Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.*
                  `) : ""}
                `))
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 1} / ${data.length}`, client.user.avatarURL())
                .setTimestamp()
            )
          });

          if (isWs) wsPageReaction(client, interaction, authorId, reactDuration, embedMsgs);
          else {
            interaction.channel.send({ embeds: [embedMsgs[0]] }).then(async msg => {
              if (embedMsgs.length > 1) pageReaction(msg, authorId, reactDuration, embedMsgs);
            }).catch(e => {
              console.log(chalk.red("\nFailed to send message"));
              console.log(chalk.red(`${e?.name}: ${e?.message}`));

              interaction.channel.send(retrieveErrorMsg);
            });
          }
        }
        else {
          const notFoundMsg = `${tagUser} it seems like that word does not exist.`;

          console.log(chalk.red("\nUrban Dictionary no such word."));

          if (isWs) interaction.followUp(notFoundMsg);
          else interaction.channel.send(notFoundMsg);
        }
      }
      else {
        console.log(chalk.red(`\n${res.status}: Failed to send message`));
        
        if (isWs) interaction.followUp(retrieveErrorMsg);
        else interaction.channel.send(retrieveErrorMsg);
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
                      **Example(s)**
                      ${definition.examples?.map(example => `\u2022\u2003${example.replace(/^\w/, (c) => c.toUpperCase())}`).join("\n")}
                    `) : ""
                  }
                  ${definitions[category].length > 1 || Object.keys(definitions).length > 1 ? trimStartingIndent(`
                    ***Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.*
                  `) : ""}
                `))
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${idx + 1} / ${definitionCount}`, client.user.avatarURL())
                .setTimestamp()
            );

            idx++;
          }
        }

        if (isWs) wsPageReaction(client, interaction, authorId, reactDuration, embedMsgs);
        else {
          interaction.channel.send({ embeds: [embedMsgs[0]] }).then(async msg => {
            if (embedMsgs.length > 1) pageReaction(interaction, authorId, reactDuration, embedMsgs);
          }).catch(e => {
            console.log(chalk.red("\nFailed to send message"));
            console.log(chalk.red(`${e.name}: ${e.message}`));
            interaction.channel.send(retrieveErrorMsg);
          });
        }
      }
      else if (res.status === 403) {
        console.log(chalk.red(`\n${res.status}: Oxford Dictionary API limit exceed.`));

        if (isWs) interaction.reply(limitErrorMsg);
        else interaction.channel.send(limitErrorMsg);
      }
      else if (res.status === 404) {
        if (isWs) interaction.followUp( `${tagUser} it seems like that word may not exist.`);
        else interaction.channel.send(`${tagUser} it seems like that word may not exist`);
      }
      else {
        console.log(chalk.red(`\n${res.status}: Oxford Dictionary failed to retrieve.`));

        if (isWs) interaction.followUp(retrieveErrorMsg)
        else interaction.channel.send(retrieveErrorMsg);
      }
    }
  }
  else if (isWs) interaction.followUp(usageMessage);
  else interaction.channel.send(usageMessage);
}
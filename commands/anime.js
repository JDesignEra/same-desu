import axios from "axios";
import chalk from "chalk";
import { MessageEmbed } from "discord.js";
import moment from "moment";
import puppeteer from 'puppeteer';
import trimStartingIndent from "../utils/trimStartingIndent.js";
import shortenUrl from "../utils/shortenUrl.js";
import pageReaction from "../addons/pageReaction.js";
import puppeteerOpt from "../data/puppeteer/options.js";
import wsPageReaction from "../addons/wsPageReaction.js";

const nineAnimeUrl = "https://9anime.to";
const jikanUrl = "https://api.jikan.moe/v3";
const malUrl = "https://myanimelist.net";
const reactDuration = 300000;

export const name = "anime";
export const description = "I will retrieve anime related information for you.";
export const options = [
  {
    name: "search",
    description: "I will provide you a list of anime that matches the title.",
    type: 1,
    options: [
      {
        name: "title",
        description: "Give me an anime title or a title that is close enough.",
        type: 3,
        required: true
      }
    ]
  },
  {
    name: "season",
    description: "I will show you a list of anime from that year and season.",
    type: 1,
    options: [
      {
        name: "year",
        description: "Give me the year to narrow the search.",
        type: 4
      },
      {
        name: "season",
        description: "Give me the season to narrow the search.",
        type: 3,
        choices: [
          {
            name: "summer",
            value: "summer"
          },
          {
            name: "spring",
            value: "spring"
          },
          {
            name: "Fall",
            value: "fall"
          },
          {
            name: "Winter",
            value: "winter"
          }
        ]
      }
    ]
  },
  {
    name: "latest",
    description: "I will get the latest anime episodes on 9Anime.",
    type: 1
  }
];
export const execute = async (client, interaction, args, isWs = false) => {
  const tagUser = interaction.author?.toString() ?? `<@${interaction.member.user.id.toString()}>`;
  const authorId = interaction.author?.id ?? interaction.member?.user?.id;
  const argument = args[0] ?? null;
  const usageMessage = trimStartingIndent(`
    **どうも ${tagUser}, サメです。**
    \u2022 Use \`/anime search <Anime Name>\` or tag me with \`anime <anime name>\` to search for an anime.
    \u2022 use \`/anime latest\` or tag me with \`anime latest\` to get the latest episodes on **9Anime**.
    \u2022 Use \`/anime season <year?> <season?>\` or tag me with \`anime season <year?> <season?>\` to get the anime from that year of season.
  `);

  if (args.length > 0) {
    if (isWs) interaction.defer();
    else {
      interaction.delete();

      interaction.channel.send(`${tagUser} please wait, I am retrieving it now.`).then(msg => {
        msg?.delete({ timeout: 30000 });
      });
    }

    const browser = await puppeteer.launch(puppeteerOpt);
    const page = await browser.newPage();

    switch (argument) {
      case "latest":
        const retrieveErrorMsg = `${tagUser} this is embarrassing, it seems that I am having trouble getting the latest episodes of anime, please kindly try again later.`;

        try {
          await page.goto(`${nineAnimeUrl}/updated`);
          await page.waitForNavigation();

          const animeLatest = await page.$$eval("ul.anime-list > li", (el) => {
            const list = [];

            el.forEach(element => {
              list.push({
                name: element.querySelector("a.name")?.innerText,
                episode: element.querySelector("a.poster > div.tag.ep")?.innerText,
                link: element.querySelector("a.name")?.href,
                image: element.querySelector("a.poster > img")?.src
              });
            });

            return list;
          });

          await browser.close();

          const embedMsgs = [
            new MessageEmbed()
              .setColor("#5a2e98")
              .setTitle("Latest Episodes on 9Anime")
              .setURL(`${nineAnimeUrl}/updated`)
              .setDescription(trimStartingIndent(`
                ${tagUser}, here are the latest episodes on 9Anime.

                **Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.
              `))
              .addFields(animeLatest.map(anime => {
                return {
                  name: `${anime.name}`,
                  value: `[${anime.episode}](${anime.link})`,
                  inline: true
                }
              }))
              .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page 1 / ${animeLatest.length + 1}`, client.user.avatarURL())
              .setTimestamp()
          ];

          animeLatest.forEach((anime, i) => {
            embedMsgs.push(
              new MessageEmbed()
                .setColor("#5a2e98")
                .setTitle(anime.name)
                .setURL(anime.link)
                .setImage(anime.image)
                .addFields(
                  {
                  name: "Episode",
                  value: `[${anime.episode}](${anime.link})`,
                  inline: true
                  },
                  {
                    name: "\u200b",
                    value: `[Watch Now](${anime.link})`,
                    inline: true
                  }
                )
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${animeLatest.length + 1}`, client.user.avatarURL())
                .setTimestamp()
            );
          });

          if (isWs) wsPageReaction(client, interaction, authorId, reactDuration, embedMsgs);
          else {
            interaction.channel?.send({embeds: [embedMsgs[0]]}).then(async msg => {
              pageReaction(msg, authorId, reactDuration, embedMsgs);
            }).catch(e => {
              console.log(chalk.red("\nFailed to send message"));
              console.log(chalk.red(`${e.name}: ${e.message}`));
              interaction.channel.send(retrieveErrorMsg);
            });
          }
        }
        catch (e) {
          console.log(chalk.red("\nFailed to get latest anime."));
          console.log(chalk.red(`${e.name}: ${e.message}`));

          if (isWs) interaction.followUp(retrieveErrorMsg);
          else interaction.channel.send(retrieveErrorMsg);
        }
        break;

      // Anime from that season
      case "season":
        if (args.length > 0) {
          let year;
          let season;

          if (!isNaN(args[2])) year = `${args[2]}`;
          if (!isNaN(args[1])) year = `${args[1]}`;
          if (typeof (args[2]) === "string" && /\b^summer\b|\b^spring\b|\b^fall\b|\b^winter\b/gi.test(args[2])) season = args[2];
          if (typeof (args[1]) === "string" && /\b^summer\b|\b^spring\b|\b^fall\b|\b^winter\b/gi.test(args[1])) season = args[1];

          const parameter = year && season ? `/${year}/${season}` : "";
          const res = await axios.get(`${jikanUrl}/season${parameter}`);
          const data = res.data;
          const retrieveErrorMsg = `${tagUser} this is embarrassing, it seems that I am having trouble getting anime from that season, please kindly try again later.`;

          if (data?.anime && data?.anime.length > 0) {
            const maxSize = 15
            const fieldValMaxLen = 150;
            const descMaxLen = 900;
            const animeList = data.anime.slice(0, maxSize);

            const embedMsgs = [
              new MessageEmbed()
                .setColor("#3552A4")
                .setTitle(`${maxSize} Anime for ${data?.season_name} ${data?.season_year}`)
                .setURL(`${malUrl}/anime/season/${data?.season_year}/${data?.season_name.toLowerCase()}`)
                .setDescription(trimStartingIndent(`
                  [Full List of **${data?.season_name} ${data?.season_year}** Anime](${await shortenUrl(`${malUrl}/anime/season/${data?.season_year}/${data?.season_name.toLowerCase()}`)})

                  **Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.
                `))
                .addFields(await Promise.all(animeList.map(async anime => {
                  const url = await shortenUrl(anime.url);
                  const synopsis = anime.synopsis.length > fieldValMaxLen ?
                    anime.synopsis.replace(/(\r\n|\n|\r)/gm, " ").substring(0, fieldValMaxLen).trimEnd() + "..." :
                    anime.synopsis.replace(/\r\n\r\n.*/gmi, "");

                  return {
                    name: `${anime.title}`,
                    value: trimStartingIndent(`
                      ${synopsis}

                      **__Type__**
                      ${anime.type}

                      **__Episodes__**
                      ${anime.episodes ?? "TBA"}
                      
                      **__Airing Start__**
                      ${moment(anime.airing_start).utcOffset("+0800").format("D MMM YYYY [at] h:mm a (Z)")}

                      [Read More](${url})
                    `),
                    inline: true
                  }
                })))
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page 1 / ${maxSize + 1}`, client.user.avatarURL())
                .setTimestamp()
            ];

            animeList.forEach((anime, i) => {
              const synopsis = anime.synopsis.length > descMaxLen ?
                anime.synopsis.replace(/(\r\n|\n|\r)/gm, " ").substring(0, descMaxLen).trimEnd() + "..." :
                anime.synopsis.replace(/\r\n\r\n.*/gmi, "");

              embedMsgs.push(
                new MessageEmbed()
                  .setColor("#3552A4")
                  .setTitle(anime.title)
                  .setURL(anime.url)
                  .setImage(anime.image_url)
                  .setDescription(trimStartingIndent(`
                    ${synopsis}

                    [Read More](${anime.url})
                  `))
                  .addFields(
                    {
                      name: "Type",
                      value: anime.type
                    },
                    {
                      name: "Episodes",
                      value: anime.episodes?.toString() ?? "TBD"
                    },
                    {
                      name: "Start Date",
                      value: moment(anime.airing_start).utcOffset("+0800").format("D MMM YYYY [at] h:mm a (Z)")
                    },
                    {
                      name: "Genres",
                      value: anime.genres.map(genre => genre.name).join(", ")
                    },
                    {
                      name: "Score",
                      value: anime.score.toString()
                    }
                  )
                  .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${maxSize + 1}`, client.user.avatarURL())
                  .setTimestamp()
              );
            });

            if (isWs) wsPageReaction(client, interaction, authorId, reactDuration, embedMsgs);
            else {
              interaction.channel.send({ embeds: [embedMsgs[0]] }).then(async msg => {
                pageReaction(msg, authorId, reactDuration, embedMsgs);
              }).catch(e => {
                console.log(chalk.red("\nFailed to send message"));
                console.log(chalk.red(`${e.name}: ${e.message}`));
                interaction.channel.send();
              });
            }
          }
          else if (isWs) interaction.followUp(retrieveErrorMsg);
          else interaction.channel.send(retrieveErrorMsg);
        }
        else {
          interaction.channel.send(trimStartingIndent(`
            **どうも ${tagUser}, サメです。**
            Use \`/anime season\` or me with \`anime season\` to get the current season of anime.
            To get a specific season's of anime use \`/anime season <year> <season>\` or tag me with \`anime season <year> <season>\`.
          `));
        }
        break;

      // Defaults to anime search
      default:
        const searchUsageMsg = trimStartingIndent(`
          **どうも ${tagUser}, サメです。**
          Use \`/anime <Anime Name>\` or tag me with \`anime <Anime Name>\` to search for an anime.
        `);

        if (args?.length > 1) {
          const descMaxLen = 2048;
          const searchQuery = encodeURI(args?.slice(1).join(" "));
          const res = await axios.get(`${jikanUrl}/search/anime?q=${searchQuery}&page=1`);
          const animeList = res.data.results;

          const embedMsgs = animeList.map((anime, i) => {
            const status = moment().isBetween(anime.start_date, anime.end_date) ? "Airing" : anime.airing ? "Not yet aired" : "No";
            const synopsis = anime.synopsis.length > descMaxLen ?
              anime.synopsis.replace("...", " ").substring(0, descMaxLen).trimEnd() + "..." :
              anime.synopsis;

            return new MessageEmbed()
              .setColor("#3552A4")
              .setTitle(anime.title)
              .setURL(anime.url)
              .setImage(anime.image_url)
              .setDescription(trimStartingIndent(`
                ${synopsis}

                [Read More](${anime.url})
              `))
              .addFields(
                {
                  name: "Status",
                  value: status,
                  inline: true
                },
                {
                  name: "Type",
                  value: anime.type,
                  inline: true
                },
                {
                  name: "Episodes",
                  value: anime.episodes === 0 && !moment().isBetween(anime.start_date, anime.end_date) ? "TBD" : anime.episodes?.toString(),
                  inline: true
                },
                {
                  name: "Start Date",
                  value: moment(anime.start_date).utcOffset("+0800").format("D MMM YYYY [at] h:mm a (Z)"),
                  inline: true
                },
                {
                  name: "End Date",
                  value: !anime.airing ? moment(anime.end_date).utcOffset("+0800").format("D MMM YYYY [at] h:mm a (Z)") : "?",
                  inline: true
                },
                {
                  name: "Score",
                  value: anime.score?.toString()
                }
              )
              .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 1} / ${animeList.length}`, client.user.avatarURL())
              .setTimestamp();
          });

          if (isWs) wsPageReaction(client, interaction, authorId, reactDuration, embedMsgs);
          else {
            interaction.channel.send({ embeds: [embedMsgs[0]] }).then(async msg => {
              pageReaction(msg, authorId, reactDuration, embedMsgs);
            }).catch(e => {
              console.log(chalk.red("\nFailed to send message"));
              console.log(chalk.red(`${e.name}: ${e.message}`));
              interaction.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble finding an anime with that name, please kindly try again later.`);
            });
          }
        }
        else if (isWs) interaction.followUp(searchUsageMsg);
        else interaction.channel.send(searchUsageMsg);
        break;
    }
  }
  else if (isWs) interaction.followUp(usageMessage);
  else interaction.channel.send(usageMessage);
}
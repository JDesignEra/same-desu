import axios from "axios";
import chalk from "chalk";
import { MessageEmbed } from "discord.js";
import moment from "moment";
import puppeteer from 'puppeteer';
import trimStartingIndent from "../utils/trimStartingIndent.js";
import wsReply from "../addons/wsReply.js";
import embedPageReaction from "../addons/embedPageReaction.js";
import wsEditReplyEmbedPage from "../addons/wsEditReplyEmbedPage.js";
import wsPatch from "../addons/wsPatch.js";

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

export const execute = async (client, message, args, isWs = false) => {
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;
  const authorId = message.author?.id ?? message.member?.user?.id;

  const duration = 180000;
  const nineAnimeUrl = "https://9anime.to";
  const jikanUrl = "https://api.jikan.moe/v3";
  const malUrl = "https://myanimelist.net";

  const argument = args[0] ?? null;
  const usageMessage = trimStartingIndent(`
    **どうも ${tagUser}, サメです。**
    \u2022 Use \`/anime search <Anime Name>\` or tag me with \`anime <anime name>\` to search for an anime.
    \u2022 use \`/anime latest\` or tag me with \`anime latest\` to get the latest episodes on **9Anime**.
    \u2022 Use \`/anime season <year?> <season?>\` or tag me with \`anime season <year?> <season?>\` to get the anime from that year of season.
  `);

  if (args.length > 0) {
    const puppeteerOpt = {
      headless: true,
      defaultViewport: null,
      ignoreHTTPSErrors: true,
      args: [
        "--no-pings",
        "--no-zygote",
        "--mute-audio",
        "--no-sandbox",
        "--disable-sync",
        "--enable-webgl",
        "--no-first-run",
        "--hide-scrollbars",
        "--disable-breakpad",
        "--disable-infobars",
        "--enable-async-dns",
        "--disable-translate",
        "--use-mock-keychain",
        "--disable-extensions",
        "--disable-speech-api",
        "--use-gl=swiftshader",
        "--disable-voice-input",
        "--disable-cloud-import",
        "--disable-default-apps",
        "--disable-hang-monitor",
        "--disable-wake-on-wifi",
        "--enable-tcp-fast-open",
        "--ignore-gpu-blacklist",
        "--password-store=basic",
        "--disable-dev-shm-usage",
        "--disable-notifications",
        "--disable-print-preview",
        "--disable-gesture-typing",
        "--disable-popup-blocking",
        "--disable-setuid-sandbox",
        "--metrics-recording-only",
        "--disable-prompt-on-repost",
        "--disk-cache-size=33554432",
        "--no-default-browser-check",
        "--media-cache-size=33554432",
        "--enable-simple-cache-backend",
        "--disable-tab-for-desktop-share",
        "--prerender-from-omnibox=disabled",
        "--disable-offer-upload-credit-cards",
        "--disable-background-timer-throttling",
        "--disable-client-side-phishing-detection",
        "--disable-offer-store-unmasked-wallet-cards"
      ]
    };

    if (isWs) {
      await wsReply(client, message, `${tagUser} please wait, I am retrieving it now.`, null, 5);
    }
    else {
      message.delete();

      message.channel.send(`${tagUser} please wait, I am retrieving it now.`).then(msg => {
        msg?.delete({ timeout: 30000 });
      });
    }

    const browser = await puppeteer.launch(puppeteerOpt);
    const page = await browser.newPage();

    switch (argument) {
      case "latest":
        try {
          await page.goto(`${nineAnimeUrl}/updated`);
          await page.waitForNavigation();

          const animeLatest = await page.$$eval("ul.anime-list > li", (el) => {
            const list = [];

            el.forEach(el => {
              list.push({
                name: el.querySelector("a.name")?.innerText,
                episode: el.querySelector("a.poster > div.tag.ep")?.innerText,
                link: el.querySelector("a.name")?.href,
                image: el.querySelector("a.poster > img")?.src
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

                You can react with the reaction below to navigate through the list of latest episodes with an image of that anime.

                **Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.
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
                .setDescription(`[${anime.episode}](${anime.link})`)
                .setImage(anime.image)
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${animeLatest.length + 1}`, client.user.avatarURL())
                .setTimestamp()
            );
          });

          if (isWs) wsEditReplyEmbedPage(client, message, duration, authorId, embedMsgs);
          else {
            message.channel.send(embedMsgs[0]).then(async msg => {
              embedPageReaction(authorId, duration, embedMsgs, msg);
            }).catch(e => {
              console.log(chalk.red("\nFailed to send message"));
              console.log(chalk.red(`${e.name}: ${e.message}`));
              message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the latest episodes of anime, please kindly try again later.`);
            });
          }
        }
        catch (e) {
          console.log(chalk.red("\nFailed to get latest anime."));
          console.log(chalk.red(`${e.name}: ${e.message}`));

          if (isWs) {
            wsPatch(client, message, `${tagUser} this is embarrassing, it seems that I am having trouble getting the latest episodes of anime, please kindly try again later.`);
          }
          else {
            message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the latest episodes of anime, please kindly try again later.`);
          }
        }
        break;

      // Anime from that season
      case "season":
        if (args.length > 0) {
          const duration = 300000;
          let year;
          let season;

          if (!isNaN(args[2])) year = `${args[2]}`;
          if (!isNaN(args[1])) year = `${args[1]}`;
          if (typeof (args[2]) === "string" && /\b^summer\b|\b^spring\b|\b^fall\b|\b^winter\b/gi.test(args[2])) season = args[2];
          if (typeof (args[1]) === "string" && /\b^summer\b|\b^spring\b|\b^fall\b|\b^winter\b/gi.test(args[1])) season = args[1];

          const parameter = year && season ? `/${year}/${season}` : "";
          const res = await axios.get(`${jikanUrl}/season${parameter}`);
          const data = res.data;

          if (data?.anime && data?.anime.length > 0) {
            const maxSize = 12;
            const fieldValMaxLen = 150;
            const descMaxLen = 900;
            const animeList = data.anime.slice(0, maxSize);

            const embedMsgs = [
              new MessageEmbed()
                .setColor("#3552A4")
                .setTitle(`${maxSize} Anime for ${data?.season_name} ${data?.season_year}`)
                .setURL(`${malUrl}/season/${data?.season_year}/${data?.season_name}`)
                .setDescription(trimStartingIndent(`
                  ${tagUser}, here are ${maxSize} **${data?.season_name} ${data?.season_year}** anime.

                  You can react with the reaction below to navigate through the list of anime with more information.

                  **Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.
                  
                  [Full List of **${data?.season_name} ${data?.season_year}** Anime](${malUrl}/season/${data?.season_year}/${data?.season_name})
                `))
                .addFields(animeList.map(anime => {
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
                      ${anime.episodes}
                      
                      **__Airing Start__**
                      ${moment(anime.airing_start).utcOffset("+0800").format("D/MMM/YYYY [at] h:mm a (Z)")}

                      [Read More](${anime.url})
                    `),
                    inline: true
                  }
                }))
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
                      value: anime.episodes
                    },
                    {
                      name: "Start Date",
                      value: moment(anime.airing_start).utcOffset("+0800").format("D/MMM/YYYY [at] h:mm a (Z)")
                    },
                    {
                      name: "Genres",
                      value: anime.episodes
                    },
                    {
                      name: "Score",
                      value: anime.score
                    }
                  )
                  .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${maxSize + 1}`, client.user.avatarURL())
                  .setTimestamp()
              );
            });

            if (isWs) {
              wsEditReplyEmbedPage(client, message, duration, authorId, embedMsgs);
            }
            else {
              message.channel.send(embedMsgs[0]).then(async msg => {
                embedPageReaction(authorId, duration, embedMsgs, msg);
              }).catch(e => {
                console.log(chalk.red("\nFailed to send message"));
                console.log(chalk.red(`${e.name}: ${e.message}`));
                message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting anime from that season, please kindly try again later.`);
              });
            }
          }
          else if (isWs) {
            wsPatch(client, message, `${tagUser} this is embarrassing, it seems that I am having trouble getting anime from that season, please kindly try again later.`);
          }
          else {
            message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting anime from that season, please kindly try again later.`);
          }
        }
        else {
          message.channel.send(trimStartingIndent(`
            **どうも ${tagUser}, サメです。**
            Use \`/anime season\` or me with \`anime season\` to get the current season of anime.
            To get a specific season's of anime use \`/anime season <year> <season>\` or tag me with \`anime season <year> <season>\`.
          `));
        }
        break;

      // Defaults to anime search
      default:
        if (args?.length > 1) {
          const maxSize = 12;
          const fieldValMaxLen = 200;
          const descMaxLen = 150;

          const searchQuery = encodeURI(args?.slice(1).join(" "));
          const res = await axios.get(`${jikanUrl}/search/anime?q=${searchQuery}&page=1`);
          const data = res.data.results;
          const animeList = data.slice(0, maxSize);

          const embedMsgs = [
            new MessageEmbed()
              .setColor("#3552A4")
              .setTitle(`${maxSize} Anime that Matched`)
              .setURL(`${malUrl}`)
              .setDescription(trimStartingIndent(`
                ${tagUser}, here are ${maxSize} anime titles that matches.

                You can react with the reaction below to navigate through the list of anime with more information.

                **Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.
              `))
              .addFields(animeList.map(anime => {
                const synopsis = anime.synopsis.length > fieldValMaxLen ?
                  anime.synopsis.replace("...", " ").substring(0, fieldValMaxLen).trimEnd() + "..." :
                  anime.synopsis;

                return {
                  name: `${anime.title}`,
                  value: trimStartingIndent(`
                    ${synopsis}

                    **__Type__**
                    ${anime.type}

                    **__Episodes__**
                    ${anime.episodes}
                    
                    **__Start Date__**
                    ${moment(anime.start_date).utcOffset("+0800").format("D/MMM/YYYY [at] h:mm a (Z)")}

                    **__End Date__**
                    ${!anime.airing ? `${moment(anime.end_date).utcOffset("+0800").format("D/MMM/YYYY [at] h:mm a (Z)")}\n` : "*Still Airing*"}

                    [Read More](${anime.url})
                  `),
                  inline: true
                }
              }))
              .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page 1 / ${maxSize + 1}`, client.user.avatarURL())
              .setTimestamp()
          ];

          animeList.forEach((anime, i) => {
            const synopsis = anime.synopsis.length > descMaxLen ?
              anime.synopsis.replace("...", " ").substring(0, descMaxLen).trimEnd() + "..." :
              anime.synopsis;

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
                    name: "Airing",
                    value: anime.airing ? "Yes" : "No"
                  },
                  {
                    name: "Type",
                    value: anime.type
                  },
                  {
                    name: "Episodes",
                    value: anime.episodes
                  },
                  {
                    name: "Start Date",
                    value: moment(anime.start_date).utcOffset("+0800").format("D/MMM/YYYY [at] h:mm a (Z)")
                  },
                  {
                    name: "End Date",
                    value: !anime.airing ? moment(anime.end_date).utcOffset("+0800").format("D/MMM/YYYY [at] h:mm a (Z)") : "?"
                  },
                  {
                    name: "Score",
                    value: anime.score
                  }
                )
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${maxSize + 1}`, client.user.avatarURL())
                .setTimestamp()
            );
          });

          if (isWs) {
            wsEditReplyEmbedPage(client, message, duration, authorId, embedMsgs);
          }
          else {
            message.channel.send(embedMsgs[0]).then(async msg => {
              embedPageReaction(authorId, duration, embedMsgs, msg);
            }).catch(e => {
              console.log(chalk.red("\nFailed to send message"));
              console.log(chalk.red(`${e.name}: ${e.message}`));
              message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble finding an anime with that name, please kindly try again later.`);
            });
          }
        }
        else if (isWs) {
          wsPatch(client, message, trimStartingIndent(`
            **どうも ${tagUser}, サメです。**
            Use \`/anime <Anime Name>\` or tag me with \`anime <Anime Name>\` to search for an anime.
          `));
        }
        else {
          message.channel.send(trimStartingIndent(`
            **どうも ${tagUser}, サメです。**
            Use \`/anime <Anime Name>\` or tag me with \`anime <Anime Name>\` to search for an anime.
          `));
        }
        break;
    }
  }
  else if (isWs) {
    wsPatch(client, message, usageMessage);
  }
  else {
    message.channel.send(usageMessage);
  }
}
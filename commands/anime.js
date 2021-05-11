import chalk from "chalk";
import { MessageEmbed } from "discord.js";
import puppeteer from 'puppeteer';
import trimExtraSpace from "../utils/trimExtraSpace.js";

export const name = "anime";
export const execute = async (client, message, args) => {
  const DURATION = 180000;
  const nineAnimeUrl = "https://9anime.to";
  const malUrl = "https://myanimelist.net";
  const argument = args[1];
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

  message.delete();
  message.channel.send(`${message.author.toString()} please wait, I am retrieving it now.`).then(msg => {
    msg?.delete({ timeout: 30000});
  });
  
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
            .setDescription(trimExtraSpace(`
              ${message.author.toString()}, here are the latest episodes on 9Anime.

              You can react with the reaction below to navigate through the list of latest episodes with an image of that anime.

              **Note:** This embed message will be deleted after **${Math.floor(DURATION / 60000)}** minute.
            `))
            .setFooter(`Living in ${process.env.HOST_PLATFORM}  \u2022  Page 1 / ${animeLatest.length + 1}`, client.user.avatarURL())
            .setTimestamp()
            .addFields(animeLatest.map(anime => {
              return {
                name: `${anime.name}`,
                value: `[${anime.episode}](${anime.link})`,
                inline: true
              }
            }))
        ];

        animeLatest.forEach(anime => {
          embedMsgs.push(
            new MessageEmbed()
            .setColor("#5a2e98")
            .setTitle(anime.name)
            .setURL(anime.link)
            .setDescription(`[${anime.episode}](${anime.link})`)
            .setImage(anime.image)
            .setFooter(`Living in ${process.env.HOST_PLATFORM}  \u2022  Page 1 / ${animeLatest.length + 1}`, client.user.avatarURL())
            .setTimestamp()
          );
        });

        message.channel.send(embedMsgs[0]).then(async msg => {
          await msg.react("⬅️");
          await msg.react("➡️");
      
          let currentPage = 0;
          const filter = (reaction, user) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && !user.bot && user.id === message.author.id;
          const collector = msg.createReactionCollector(filter, { time: DURATION, dispose: true });
          
          collector.on("collect", (reaction, user) => currentPage = updateEmbedPage(msg, embedMsgs, currentPage, reaction));
          collector.on("remove", (reaction, user) => currentPage = updateEmbedPage(msg, embedMsgs, currentPage, reaction));
      
          collector.on("end", () => {
            try {
              msg.delete();
              console.log(chalk.yellow("Embed latest anime message deleted.\n"));
            }
            catch (e) {
              console.log(chalk.yellow("Embed message might have been delete already."));
              console.log(chalk.yellow(`${e.name}: ${e.message}\n`));
            }
          });
        });
      }
      catch (e) {
        console.log(chalk.red("Failed to get latest anime."));
        console.log(chalk.red(`${e.name}: ${e.message}\n`));
        message.channel.send(`${message.author.toString()} I fail to get latest episodes of anime, please try again later.`);
      }
      break;
  
    default:
      const encodedQuery = encodeURI(args.slice(1).join(" "));
      const searchUrl = `${malUrl}/anime.php?q=${encodedQuery}&cat=anime`;

      try {
        await page.goto(searchUrl, { waitUntil: "networkidle0" });

        const searchList = await page.$$eval("div.js-categories-seasonal.js-block-list.list > table > tbody > tr", (el) => {
          const list = [];
          
          for (let i = 1; i < el.length && i < 11; i++) {
            const td = el[i].querySelectorAll("td");
            
            list.push({
              image: td[0]?.querySelector("div.picSurround > a.hoverinfo_trigger > img")?.src?.replace(/(\/r\/\d*x\d*)/gi, ""),
              name: td[1]?.querySelector("a.hoverinfo_trigger > strong")?.innerText,
              summary: td[1]?.querySelector("div.pt4")?.innerText.slice(0, -10),
              link: td[1]?.querySelector("a.hoverinfo_trigger").href,
              type: td[2]?.innerText,
              episodes: td[3]?.innerText,
              score: td[4]?.innerText
            });
          }
          
          return list;
        });
        
        await browser.close();
        
        const embedMsgs = [
          new MessageEmbed()
            .setColor("#3552A4")
            .setTitle("Search result from MyAnimeList")
            .setURL(searchUrl)
            .setDescription(trimExtraSpace(`
              ${message.author.toString()}, here are the search results on MyAnimeList.

              You can react with the reaction below to navigate through the list of results with an image of that anime.

              **Note:** This embed message will be deleted after **${Math.floor(DURATION / 60000)}** minute.
            `))
            .setFooter(`Living in ${process.env.HOST_PLATFORM}  \u2022  Page 1 / ${searchList.length + 1}`, client.user.avatarURL())
            .setTimestamp()
            .addFields(searchList.map(anime => {
              return {
                name: `${anime.name}`,
                value: trimExtraSpace(`
                  ${anime.summary}

                  **Episodes:** ${anime.episodes}
                  **Type:** ${anime.type}
                  **Score:** ${anime.score}

                  [LEARN MORE](${anime.link})
                `),
                inline: true
              }
            }))
        ];

        searchList.forEach((anime, i) => {
          embedMsgs.push(
            new MessageEmbed()
            .setColor("#3552A4")
            .setTitle(anime.name)
            .setURL(anime.link)
            .setDescription(trimExtraSpace(`
              ${anime.summary}

              **Episodes:** ${anime.episodes}
              **Type:** ${anime.type}
              **Score:** ${anime.score}
            `))
            .setImage(anime.image)
            .setFooter(`Living in ${process.env.HOST_PLATFORM}  \u2022  Page ${i + 2} / ${searchList.length + 1}`, client.user.avatarURL())
            .setTimestamp()
          );
        });

        message.channel.send(embedMsgs[0]).then(async msg => {
          await msg.react("⬅️");
          await msg.react("➡️");
      
          let currentPage = 0;
          const filter = (reaction, user) => (reaction.emoji.name === "⬅️" || reaction.emoji.name === "➡️") && !user.bot && user.id === message.author.id;
          const collector = msg.createReactionCollector(filter, { time: DURATION, dispose: true });
          
          collector.on("collect", (reaction, user) => currentPage = updateEmbedPage(msg, embedMsgs, currentPage, reaction));
          collector.on("remove", (reaction, user) => currentPage = updateEmbedPage(msg, embedMsgs, currentPage, reaction));
      
          collector.on("end", () => {
            try {
              msg.delete();
              console.log(chalk.yellow("Embed search anime message deleted.\n"));
            }
            catch (e) {
              console.log(chalk.yellow("Embed message might have been delete already."));
              console.log(chalk.yellow(`${e.name}: ${e.message}\n`));
            }
          });
        });
      }
      catch (e) {
        console.log(chalk.red("Failed to get search anime."));
        console.log(chalk.red(`${e.name}: ${e.message}\n`));
        message.channel.send(`${message.author.toString()} I fail to get the search result, please try again later.`);
      }
      break;
  }
}

const updateEmbedPage = (msg, embedMsgs, currentPage, reaction) => {
  let page = currentPage;

  if (reaction.emoji.name === "⬅️" && page > 0) {
    page--;
    msg.edit(embedMsgs[page]);
  }
  else if (reaction.emoji.name === "➡️" && page < embedMsgs.length - 1) {
    page++;
    msg.edit(embedMsgs[page]);
  }
  
  return page;
}
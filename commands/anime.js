import chalk from "chalk";
import puppeteer from 'puppeteer';

export const name = "anime";
export const execute = async (client, message, args) => {
  const cmd = args[1];
  const url = "https://9anime.to";

  switch (cmd) {
    case "latest":
      try {
        const puppeteerOpt = {
          headless: false,
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
        
        const browser = await puppeteer.launch(puppeteerOpt);
        const page = await browser.newPage();
        await page.goto(`${url}/updated`);

        await page.waitForNavigation();
        const animeLatest = await page.$$eval("ul.anime-list > li", (el) => {
          const list = [];
          
          el.forEach(el => {
            list.push({
              names: el.querySelector("a.name").innerText,
              links: el.querySelector("a.name").href,
              images: el.querySelector("a.poster > img").src
            });
          });
          
          return list;
        });
        
        await browser.close();
      }
      catch (e) {
        console.log(chalk.red("Failed to get anime."));
        console.log(chalk.red(e.message));
      }
      break;
  
    default:
      break;
  }
}
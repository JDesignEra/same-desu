import axios from "axios";
import { MessageEmbed } from "discord.js";
import moment from "moment-timezone";
import pageReaction from "../addons/pageReaction.js";
import wsEditReplyPage from "../addons/wsEditReplyPage.js";
import wsPatch from "../addons/wsPatch.js";
import wsReply from "../addons/wsReply.js";
import organization from "../data/vtuber/organization.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";

const holodexUrl = "https://holodex.net/api/v2";

export const name = "vtuber";
export const description = "vTuber related commands";
export const options = [
  {
    name: "list",
    description: "I will provide you a list of of vTuber's related information.",
    type: 1,
    options: [
      {
        name: "organization",
        description: "Give me an organization name.",
        type: 3,
        required: true,
        choices: ["All", ...organization].map(org => { return { name: org === "All" ? "All" : org, value: org }; })
      }
    ]
  },
  {
    name: "live",
    description: "I will provide you a list of vTuber's streams that are currently streaming.",
    type: 1,
    options: [
      {
        name: "organization",
        description: "Give me an organization name.",
        type: 3,
        required: true,
        choices: ["All", ...organization].map(org => { return { name: org === "All" ? "All" : org, value: org }; })
      },
      {
        name: "type",
        description: "Details: embed pages with detailed info without previews, Previews: links with previews only.",
        type: 3,
        required: false,
        choices: [
          {
            name: "Details",
            value: "details"
          },
          {
            name: "Previews",
            value: "previews"
          }
        ]
      }
    ]
  },
  {
    name: "upcoming",
    description: "I will provide you a list of vTuber's upcoming streams that are not live yet.",
    type: 1,
    options: [
      {
        name: "organization",
        description: "Give me an organization name.",
        type: 3,
        required: true,
        choices: ["All", ...organization].map(org => { return { name: org === "All" ? "All" : org, value: org }; })
      },
      {
        name: "hours",
        description: "How many hours ahead do you want me to retrieve? (Default 24)",
        type: 4,
        required: false
      },
      {
        name: "type",
        description: "Details: embed pages with detailed info without previews, Previews: links with previews only.",
        type: 3,
        required: false,
        choices: [
          {
            name: "Details",
            value: "details"
          },
          {
            name: "Previews",
            value: "previews"
          }
        ]
      }
    ]
  }
];

export const execute = async (client, message, args, isWs = false) => {
  const duration = 300000;
  const tagUser = message.author?.toString() ?? `<@${message.member.user.id.toString()}>`;
  const authorId = message.author?.id ?? message.member?.user?.id;
  const usageMessage = trimStartingIndent(`
    **どうも ${tagUser}, サメです。**
    \u2022 Use \`/vtuber list <organization>\` or tag me with \`anime <organization>\` for a list of vTuber's related information.
    \u2022 use \`/vtuber live <organization> <type?>\` or tag me with \`vtuber live <organization> <type?>\` for a list of vTubers that are currently streaming.
    \u2022 Use \`/vtuber upcoming <organization> <hours?> <type?>\` or tag me with \`vtuber upcoming <organization> <hours?> <type?>\` for a list of vTuber's upcoming streams.
  `);
  
  if (args.length > 0) {
    const org = organization.find(o => o.toLowerCase() === args[1].toLowerCase()) ?? "All";

    if (isWs) await wsReply(client, message, `${tagUser} please wait, I am retrieving it now.`, null, 5);
    else {
      message.channel.send(`${tagUser} please wait, I am retrieving it now.`).then(msg => {
        msg?.delete({ timeout: 30000 });
      });
    }

    switch (args[0]) {
      case "list":
        if (org) {
          const vTubers = await getHolodexChannels([], 0, org === "All" ? undefined : org);
          
          if (vTubers.length > 0) {
            const embedMsgs = [
              new MessageEmbed()
                .setColor("#2576A3")
                .setTitle(`${org} vTubers`)
                .setDescription(trimStartingIndent(`${vTubers.map(vTuber => vTuber?.name ? `\u2022 ${vTuber.name}` : "").join("\n")}
    
                **Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.
                `))
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page 1 / ${vTubers.length + 1}`, client.user.avatarURL())
                .setTimestamp()
            ];
    
            vTubers.forEach((vTuber, i) => {
              const infos = [];
    
              if (vTuber.organization) infos.push({ "Organization": vTuber.organization });
              if (vTuber.group) infos.push({ "Group": vTuber.group });
              if (vTuber.twitter) infos.push({ "Twitter": `[${vTuber.twitter}](https://twitter.com/${vTuber.twitter})` });
              if (vTuber.id && vTuber.channel_name) infos.push({ "YouTube": `[${vTuber.channel_name}](https://www.youtube.com/channel/${vTuber.id})` });
              if (vTuber.subscriber_count) infos.push({ "Subscriber Count": `${vTuber.subscriber_count}` });
              if (vTuber.video_count) infos.push({ "Video Count": `${vTuber.video_count}` });
    
              embedMsgs.push(
                new MessageEmbed()
                  .setColor("#2576A3")
                  .setTitle(vTuber.name)
                  .setURL(vTuber.id ? `https://www.youtube.com/channel/${vTuber.id}` : "")
                  .setThumbnail(vTuber.photo)
                  .setDescription(trimStartingIndent(`
                    ${infos.map(info => `**__${Object.keys(info)[0]}__**\n${Object.values(info)[0]}`).join("\n\n")}
    
                    **Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.
                  `))
                  .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${vTubers.length + 1}`, client.user.avatarURL())
                  .setTimestamp()
              );
            });
    
            if (isWs) wsEditReplyPage(client, message, duration, authorId, embedMsgs);
            else {
              message.channel.send(embedMsgs[0]).then(async msg => {
                pageReaction(authorId, duration, embedMsgs, msg);
              }).catch(e => {
                console.log(chalk.red("\nFailed to send message"));
                console.log(chalk.red(`${e.name}: ${e.message}`));
                message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the list of vTubers, please kindly try again later.`);
              });
            }
          }
          else {
            if (isWs) wsPatch(client, message, `${tagUser} it seems that there might not be any vTuber under that organization.`);
            else message.channel.send(`${tagUser} it seems that there might not be any vTuber under that organization.`);
          }
        }
        else {
          if (isWs) wsPatch(client, message, usageMessage);
          else message.channel.send(usageMessage);
        }
        break;
      
      case "upcoming":
        const hours = !isNaN(args[3]) ? parseInt(args[3]) : !isNaN(args[2]) ? parseInt(args[2]) : 24;
      case "live":
        if (org) {
          const type = args[3] === "details" || args[3] === "previews" ? args[3]  : isNaN(args[2]) ? args[2] : "details";
          const noLiveErrorMsg = `${tagUser} it seems that there isn't any ${args[0]} channel currently, please kindly try again later.`;
          let data = args[0] === "upcoming" ? await getHolodexUpcoming(org, hours) : await getHolodexLive24Hours(org);
          
          if (data.length > 0) {
            if (type === "previews") {
              const urlMsgs = data.map(vid => `https://www.youtube.com/watch?v=${vid.id}`).join("\n");

              if (isWs) wsPatch(client, message, urlMsgs);
              else message.channel.send(urlMsgs);
            }
            else {
              const videos = data.filter(vid => vid.channel.type === "vtuber").map(vid => {
                let info = {};

                if (vid.id) info.id = vid.id;
                if (vid.title) info.title = vid.title;
                if (vid.topic_id) info.topic = vid.topic_id.replace(/^\w/, (c) => c.toUpperCase()).replace(/_/g, " ");
                if (vid.start_scheduled) info.live_on = vid.start_scheduled;
                if (vid.available_at) info.live_on = vid.available_at;
                if (vid.live_viewers) info.viewers = vid.live_viewers;
                if (vid.channel && vid.channel.id) info.channel_id = vid.channel.id;
                if (vid.channel && vid.channel.name) info.channel_name = vid.channel.name;
                if (vid.channel && vid.channel.photo) info.photo = vid.channel.photo;
                if (vid.channel && vid.channel.english_name) info.name = vid.channel.english_name;

                return info;
              });

              const embedMsgs = [
                new MessageEmbed()
                  .setColor("#2576A3")
                  .setTitle(`${org} vTubers`)
                  .setDescription(trimStartingIndent(`
                    Here are the list of${org === "All" ? " all" : org === "Independents" ? " independent" : ""} vTuber's streams${org !== "All" && org !== "Independents" ? ` from **${org}**` : ""} that are ${args[0] === "live" ? "currently live" : "upcoming"}.

                    ${videos.map(vid => `**__${vid.name}__**\n[${vid.title}](https://www.youtube.com/watch?v=${vid.id})`).join("\n\n")}
                  
                    **Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.
                  `))
                  .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page 1 / ${videos.length + 1}`, client.user.avatarURL())
                  .setTimestamp()
              ];

              videos.forEach((vid, i) => {
                const infos = [];
    
                if (vid.name) infos.push({ "Name": vid.name });
                if (vid.topic_id) infos.push({ "Topic": vid.topic_id });

                if (vid.live_on) {
                  if (args[0] === "live") infos.push({ "Live": moment(vid.live_on).fromNow(true) });
                  else infos.push({ "Scheduled": moment(vid.live_on).utcOffset("+0800").format("DD/MM/YYYY hh:mm a (Z)") });
                }
                
                if (vid.viewers) infos.push({ "Viewers": vid.viewers });
                if (vid.channel_id && vid.channel_name) infos.push({ "YouTube Channel": `[${vid.channel_name}](https://www.youtube.com/channel/${vid.channel_id})` });

                embedMsgs.push(
                  new MessageEmbed()
                    .setColor("#2576A3")
                    .setTitle(trimStartingIndent(vid.title))
                    .setURL(vid.id ? `https://www.youtube.com/watch?v=${vid.id}` : "")
                    .setThumbnail(vid.photo)
                    .setDescription(trimStartingIndent(`
                      ${infos.map(info => `**__${Object.keys(info)[0]}__**\n${Object.values(info)[0]}`).join("\n\n")}


                      **[Watch on YouTube](https://www.youtube.com/watch?v=${vid.id})**
                      
                      **Note:** You will not be able to interact with this embed message after **${Math.floor(duration / 60000)}** minute.
                    `))
                    .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${videos.length + 1}`, client.user.avatarURL())
                    .setTimestamp()
                );
              });

              if (isWs) wsEditReplyPage(client, message, duration, authorId, embedMsgs);
              else {
                message.channel.send(embedMsgs[0]).then(async msg => {
                  pageReaction(authorId, duration, embedMsgs, msg);
                }).catch(e => {
                  console.log(chalk.red("\nFailed to send message"));
                  console.log(chalk.red(`${e.name}: ${e.message}`));
                  message.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the list of ${args[0]} channels, please kindly try again later.`);
                });
              }
            }
          }
          else {
            if (isWs) wsPatch(client, message, noLiveErrorMsg);
            else message.channel.send(noLiveErrorMsg);
          }
        }
        else {
          if (isWs) wsPatch(client, message, usageMessage);
          else message.channel.send(usageMessage);
        }
        break;

      default:
        break;
    }
  }
  else if (isWs) wsPatch(client, message, usageMessage);
  else message.channel.send(usageMessage);
}

export const getHolodexUpcoming = async (organization = "All", durationHour = 24, limit = undefined) => {
  const parameters = `?status=upcoming&type=stream${organization !== "All" ? `&org=${organization}` : ""}&order=desc${limit ? `&limit=${limit}` : ""}&paginated=%3Cempty%3E&max_upcoming_hours=${durationHour}`
  const res = await axios.get(`${holodexUrl}/live${parameters}`);
  
  return res.status === 200 && res.data.items ? res.data.items : [];
}

const getHolodexLive24Hours = async (organization = "All", limit = undefined) => {
  const parameters = `?status=live&type=stream${organization !== "All" ? `&org=${organization}` : ""}&order=desc${limit ? `&limit=${limit}` : ""}&paginated=%3Cempty%3E&max_upcoming_hours=24`
  const res = await axios.get(`${holodexUrl}/live${parameters}`);
  
  return res.status === 200 && res.data.items ? res.data.items : [];
}

const getHolodexChannels = async (lists = [], offset = 0, organization = "All", limit = undefined) => {
  const sizeLimit = 100;  // Allowed size limit for API.
  const parameters = `?type=vtuber&offset=${offset}&limit=${limit && limit < sizeLimit ? limit : sizeLimit}${organization !== "All" ? `&org=${organization}` : ""}`;
  const res = await axios.get(`${holodexUrl}/channels${parameters}`);
  const data = res.data;

  let vTubers = lists;

  if (res.status === 200 && data && data.length > 0) {
    let infos = await data.filter(vTuber => vTuber !== "INACTIVE").map(vtuber => {
      let info = {};

      if (vtuber.id) info.id = vtuber.id;
      if (vtuber.name) info.channel_name = vtuber.name;
      if (vtuber.name) info.name = vtuber.english_name;
      if (vtuber.org) info.organization = vtuber.org;
      if (vtuber.group) info.group = vtuber.group;
      if (vtuber.photo) info.photo = vtuber.photo;
      if (vtuber.twitter) info.twitter = vtuber.twitter;
      if (vtuber.video_count) info.video_count = vtuber.video_count;
      if (vtuber.subscriber_count) info.subscriber_count = vtuber.subscriber_count;

      return info;
    });

    vTubers = vTubers.concat(infos);
  }

  if (data.length < limit || !limit && data.length >= sizeLimit) await getHolodexChannels(vTubers, offset + sizeLimit, organization, limit);

  return vTubers;
}
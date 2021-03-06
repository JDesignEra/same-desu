import axios from "axios";
import { MessageEmbed } from "discord.js";
import moment from "moment-timezone";
import pageReaction from "../addons/pageReaction.js";
import channelIdExclude from "../data/vtuber/channelIdExclude.js";
import organization from "../data/vtuber/organization.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import wsPageReaction from "../addons/wsPageReaction.js";

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
    name: "search",
    description: "I will search for vTuber's by name.",
    type: 1,
    options: [
      {
        name: "name",
        description: "Name of the vTuber or partial name.",
        type: 3,
        required: true
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
export const execute = async (client, interaction, args, isWs = false) => {
  const reactDuration = 300000;
  const tagUser = interaction.author?.toString() ?? `<@${interaction.member.user.id.toString()}>`;
  const authorId = interaction.author?.id ?? interaction.member?.user?.id;
  const usageMessage = trimStartingIndent(`
    **????????? ${tagUser}, ???????????????**
    \u2022 Use \`/vtuber list <organization>\` or tag me with \`anime <organization>\` for a list of vTuber's related information.
    \u2022 use \`/vtuber live <organization> <type?>\` or tag me with \`vtuber live <organization> <type?>\` for a list of vTubers that are currently streaming.
    \u2022 Use \`/vtuber upcoming <organization> <hours?> <type?>\` or tag me with \`vtuber upcoming <organization> <hours?> <type?>\` for a list of vTuber's upcoming streams.
  `);
  
  if (args.length > 0) {
    const org = organization.find(o => o.toLowerCase() === args[1]?.toLowerCase()) ?? "All";

    if (isWs) interaction.defer();
    else {
      interaction.channel.send(`${tagUser} please wait, I am retrieving it now.`).then(msg => {
        msg?.delete({ timeout: 30000 });
      });
    }

    switch (args[0]) {
      case "list":
        if (org) {
          const vTubers = await getHolodexChannels([], 0, org === "All" ? undefined : org);
          
          if (vTubers.length > 0) {
            let vTubersNameDesc = `${vTubers.map(vTuber => vTuber?.name ? `\u2022 ${vTuber.name}` : "").join("\n")}`;

            if (vTubersNameDesc.length > 2048 - 100) {
              vTubersNameDesc = vTubersNameDesc.substring(0, 2048 - 100);
              vTubersNameDesc = vTubersNameDesc.substring(0, vTubersNameDesc.lastIndexOf("\n"));
              vTubersNameDesc += "\n\u2022 And more..."
            }

            const embedMsgs = [
              new MessageEmbed()
                .setColor("#FF0000")
                .setTitle(`${org} vTubers`)
                .setDescription(trimStartingIndent(`${vTubersNameDesc}
    
                  **Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.
                `))
                .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page 1 / ${vTubers.length + 1}`, client.user.avatarURL())
                .setTimestamp()
            ];
    
            vTubers.forEach((vTuber, i) => {
              const fields = [];
    
              if (vTuber.organization) fields.push({
                name: "Organization",
                value: vTuber.organization,
                inline: true
              });

              if (vTuber.group) fields.push({
                name: "Group",
                value: vTuber.group,
                inline: true
              });
              else fields.push({
                name: "\u200b",
                value: "\u200b",
                inline: true
              });

              fields.push({
                name: "\u200b",
                value: "\u200b",
                inline: true
              });

              if (vTuber.id && vTuber.channel_name) fields.push({
                name: "YouTube",
                value: `[${vTuber.channel_name}](https://www.youtube.com/channel/${vTuber.id})`,
                inline: true
              });

              if (vTuber.subscriber_count) fields.push({
                name: "Subscribers",
                value: `${vTuber.subscriber_count}`,
                inline: true
              });

              if (vTuber.video_count) fields.push({
                name: "Video Counts",
                value: `${vTuber.video_count}`,
                inline: true
              });

              if (vTuber.twitter) fields.push({
                name: "Twitter",
                value: `[${vTuber.twitter}](https://twitter.com/${vTuber.twitter})`
              });
    
              embedMsgs.push(
                new MessageEmbed()
                  .setColor("#FF0000")
                  .setTitle(vTuber.name)
                  .setURL(vTuber.id ? `https://www.youtube.com/channel/${vTuber.id}` : "")
                  .setThumbnail(vTuber.photo)
                  .addFields([...fields, {
                    name: "\u200b",
                    value: `**Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.`
                  }])
                  .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 2} / ${vTubers.length + 1}`, client.user.avatarURL())
                  .setTimestamp()
              );
            });
    
            if (isWs) wsPageReaction(interaction, authorId, reactDuration, embedMsgs);
            else {
              interaction.channel.send({ embeds: [embedMsgs[0]] }).then(async msg => {
                pageReaction(msg, authorId, reactDuration, embedMsgs);
              }).catch(e => {
                console.log(chalk.red("\nFailed to send message"));
                console.log(chalk.red(`${e.name}: ${e.message}`));
                interaction.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the list of vTubers, please kindly try again later.`);
              });
            }
          }
          else {
            const orgNotFoundMsg = `${tagUser} it seems that there might not be any vTuber under that organization.`;

            if (isWs) interaction.followUp(orgNotFoundMsg);
            else interaction.channel.send(orgNotFoundMsg);
          }
        }
        else {
          if (isWs) interaction.followUp(usageMessage);
          else interaction.channel.send(usageMessage);
        }
        break;

      case "search":
        if (args[1]) {
          let vTubers = await getHolodexChannels([], 0, "All");
          vTubers = vTubers?.filter(vtuber => vtuber.name.toLowerCase().includes(args[1].toLowerCase()));
          
          if (vTubers.length > 0) {
            let vTubersNameDesc = `${vTubers.map(vTuber => vTuber?.name ? `\u2022 ${vTuber.name}` : "").join("\n")}`;

            if (vTubersNameDesc.length > 2048 - 100) {
              vTubersNameDesc = vTubersNameDesc.substring(0, 2048 - 100);
              vTubersNameDesc = vTubersNameDesc.substring(0, vTubersNameDesc.lastIndexOf("\n"));
              vTubersNameDesc += "\n\u2022 And more..."
            }

            const embedMsgs = [];
    
            vTubers.forEach((vTuber, i) => {
              const fields = [];
    
              if (vTuber.organization) fields.push({
                name: "Organization",
                value: vTuber.organization,
                inline: true
              });

              if (vTuber.group) fields.push({
                name: "Group",
                value: vTuber.group,
                inline: true
              });
              else fields.push({
                name: "\u200b",
                value: "\u200b",
                inline: true
              });

              fields.push({
                name: "\u200b",
                value: "\u200b",
                inline: true
              });

              if (vTuber.id && vTuber.channel_name) fields.push({
                name: "YouTube",
                value: `[${vTuber.channel_name}](https://www.youtube.com/channel/${vTuber.id})`,
                inline: true
              });

              if (vTuber.subscriber_count) fields.push({
                name: "Subscribers",
                value: `${vTuber.subscriber_count}`,
                inline: true
              });

              if (vTuber.video_count) fields.push({
                name: "Video Counts",
                value: `${vTuber.video_count}`,
                inline: true
              });

              if (vTuber.twitter) fields.push({
                name: "Twitter",
                value: `[${vTuber.twitter}](https://twitter.com/${vTuber.twitter})`
              });
    
              embedMsgs.push(
                new MessageEmbed()
                  .setColor("#FF0000")
                  .setTitle(vTuber.name)
                  .setURL(vTuber.id ? `https://www.youtube.com/channel/${vTuber.id}` : "")
                  .setThumbnail(vTuber.photo)
                  .addFields([...fields, {
                    name: "\u200b",
                    value: `**Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.`
                  }])
                  .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 1} / ${vTubers.length}`, client.user.avatarURL())
                  .setTimestamp()
              );
            });
    
            if (isWs) wsPageReaction(interaction, authorId, reactDuration, embedMsgs);
            else {
              interaction.channel.send({ embeds: [embedMsgs[0]] }).then(async msg => {
                pageReaction(msg, authorId, reactDuration, embedMsgs);
              }).catch(e => {
                console.log(chalk.red("\nFailed to send message"));
                console.log(chalk.red(`${e.name}: ${e.message}`));
                interaction.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the list of vTubers, please kindly try again later.`);
              });
            }
          }
          else {
            const orgNotFoundMsg = `${tagUser} it seems that there might not be any vTuber with that name.`;

            if (isWs) interaction.followUp(orgNotFoundMsg);
            else interaction.channel.send(orgNotFoundMsg);
          }
        }
        else {
          if (isWs) interaction.followUp(usageMessage);
          else interaction.channel.send(usageMessage);
        }
        break;
      
      case "upcoming":
        const hours = !isNaN(args[3]) ? parseInt(args[3]) : !isNaN(args[2]) ? parseInt(args[2]) : 24;
      case "live":
        if (org) {
          const type = args[3] === "details" || args[3] === "previews" ? args[3]  : isNaN(args[2]) ? args[2] : "details";
          const noLiveErrorMsg = `${tagUser} it seems that there isn't any ${args[0]} channel currently, please kindly try again later.`;
          let data = args[0] === "upcoming" ? await getHolodexUpcoming(org, hours) : await getHolodexLive(org);
          
          if (data.length > 0) {
            if (type === "previews") {
              const urlMsgs = data.map(vid => `https://www.youtube.com/watch?v=${vid.id}`).join("\n");

              if (isWs) interaction.followUp(urlMsgs);
              else interaction.channel.send(urlMsgs);
            }
            else {
              const videos = await Promise.all(data.filter(vid => vid.channel.type === "vtuber").map(async vid => {
                let info = {};

                if (vid.id) {
                  info.url = `https://www.youtube.com/watch?v=${vid.id}`;
                  info.thumbnail = `https://i3.ytimg.com/vi/${vid.id}/maxresdefault.jpg`;
                }
                if (vid.title) info.title = vid.title;
                if (vid.topic_id) info.topic = vid.topic_id.replace(/^\w| \w|_\w/g, (c) => c.toUpperCase()).replace(/_/g, " ");
                if (vid.start_scheduled) info.live_on = vid.start_scheduled;
                if (vid.available_at) info.live_on = vid.available_at;
                if (vid.live_viewers) info.viewers = vid.live_viewers;
                if (vid.channel && vid.channel.id) info.channel_url = `https://www.youtube.com/channel/${vid.channel.id}`;
                if (vid.channel && vid.channel.name) info.channel_name = vid.channel.name;
                if (vid.channel && vid.channel.photo) info.photo = vid.channel.photo;
                if (vid.channel && vid.channel.english_name) info.name = vid.channel.english_name;
                
                return info;
              }));
              
              const embedMsgs = videos.map((vid, i) => {
                const fields = [];
    
                if (vid.name) fields.push({name: "Name", value: vid.name});

                if (vid.topic) fields.push({name: "Topic", value: vid.topic, inline: true});

                if (vid.live_on) {
                  if (args[0] === "live") fields.push({name: "Live Duration", value: moment(vid.live_on).fromNow(true), inline: true});
                  else fields.push({name: "Starts At", value: moment(vid.live_on).utcOffset("+0800").format("DD/MM/YYYY hh:mm a (Z)"), inline: true});
                }
                
                if (vid.viewers) fields.push({name: "Viewers", value: `${vid.viewers}`, inline: true});

                if (vid.channel_url && vid.channel_name) fields.push({name: "YouTube Channel", value: `[${vid.channel_name}](${vid.channel_url})`});

                return new MessageEmbed()
                  .setColor("#FF0000")
                  .setTitle(trimStartingIndent(vid.title))
                  .setURL(vid.url ? vid.url : "")
                  .setThumbnail(vid.photo)
                  .setImage(vid.thumbnail)
                  .addFields([...fields,
                    {
                      name: "\u200b",
                      value: `**[Watch on YouTube](${vid.url})**`
                    },
                    {
                      name: "\u200b",
                      value: `**Note:** You will not be able to interact with this embed message after **${Math.floor(reactDuration / 60000)}** minute.`
                    }
                  ])
                  .setFooter(`${process.env.EMBED_HOST_FOOTER}  \u2022  Page ${i + 1} / ${videos.length}`, client.user.avatarURL())
                  .setTimestamp()
              });

              if (isWs) wsPageReaction(interaction, authorId, reactDuration, embedMsgs);
              else {
                interaction.channel.send({ embeds: [embedMsgs[0]] }).then(async msg => {
                  pageReaction(msg, authorId, reactDuration, embedMsgs);
                }).catch(e => {
                  console.log(chalk.red("\nFailed to send message"));
                  console.log(chalk.red(`${e.name}: ${e.message}`));
                  interaction.channel.send(`${tagUser} this is embarrassing, it seems that I am having trouble getting the list of ${args[0]} channels, please kindly try again later.`);
                });
              }
            }
          }
          else {
            if (isWs) interaction.followUp(noLiveErrorMsg);
            else interaction.channel.send(noLiveErrorMsg);
          }
        }
        else {
          if (isWs) interaction.followUp(usageMessage);
          else interaction.channel.send(usageMessage);
        }
        break;

      default:
        break;
    }
  }
  else if (isWs) interaction.followUp(usageMessage);
  else interaction.channel.send(usageMessage);
}

export const getHolodexUpcoming = async (org = "All", durationHour = 24, limit = undefined) => {
  const parameters = `?status=upcoming&type=stream${org !== "All" ? `&org=${org}` : ""}&order=desc${limit ? `&limit=${limit}` : ""}&paginated=%3Cempty%3E&max_upcoming_hours=${durationHour}`
  const res = await axios.get(`${holodexUrl}/live${parameters}`);
  
  return res.status === 200 && res.data.items ? res.data.items : [];
}

const getHolodexLive = async (org = "All", limit = undefined) => {
  const parameters = `?status=live&type=stream${org !== "All" ? `&org=${org}` : ""}${limit ? `&limit=${limit}` : ""}&paginated=%3Cempty%3E`
  const res = await axios.get(`${holodexUrl}/live${parameters}`);
  
  return res.status === 200 && res.data.items ? res.data.items.filter(d => d.start_actual) : [];
}

const getHolodexChannels = async (lists = [], offset = 0, org = "All", limit = undefined) => {
  const sizeLimit = 100;  // Allowed size limit for API.
  const parameters = `?type=vtuber&offset=${offset}&limit=${limit && limit < sizeLimit ? limit : sizeLimit}${org !== "All" ? `&org=${org}` : ""}${org !== "All" || org !== "Independents" ? "&sort=group" : ""}`;
  const res = await axios.get(`${holodexUrl}/channels${parameters}`);
  const data = res.data?.filter(d => channelIdExclude.indexOf(d.id) < 0);

  let vTubers = lists;

  if (res.status === 200 && data && data.length > 0) {
    let infos = await data.filter(vTuber => vTuber !== "INACTIVE" && vTuber.english_name).map(vtuber => {
      let info = {};

      if (vtuber.id) info.id = vtuber.id;
      if (vtuber.name) info.channel_name = vtuber.name;
      if (vtuber.english_name) info.name = vtuber.english_name;
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

  if (res.data?.length < limit || !limit && res.data?.length >= sizeLimit) {
    return getHolodexChannels(vTubers, offset + sizeLimit, org, limit);
  }

  vTubers.sort((a, b) => {
    if(a.name < b.name) return -1;
    if(a.name > b.name) return 1;

    return 0;
  });

  return vTubers;
}
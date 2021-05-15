import { APIMessage } from "discord.js";

export default async (client, interaction, content, embed) => {
  let data = { content }
  
  if (typeof(content) === "object") {
    data.content = null
    embed = content;
    content = null;
  }

  if (!embed && (!content || !content?.trim())) data.content = "\u200b";
  if (embed) data = await createAPIMessage(client, interaction, content, embed);

  return await client.api.webhooks(client.user.id, interaction.token).messages('@original').patch({
    data
  });
}

const createAPIMessage = async (client, interaction, content, embed) => {
  const { data, files } = await APIMessage.create(
    client.channels.resolve(interaction.channel_id),
    content && content?.trim() ? content : embed,
    embed && content && content?.trim() ? embed : undefined
  ).resolveData().resolveFiles();

  return { ...data, files };
}
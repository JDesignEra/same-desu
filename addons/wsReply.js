import { APIMessage } from "discord.js";

export default async (client, interaction, content, embed = undefined, type = 4) => {
  let data = { content }

  if (typeof(content) === "object") {
    data.content = null
    embed = content;
    content = "\u200b";
  }

  if (embed) data = await createAPIMessage(client, interaction, content, embed);
  if (!embed && (!content || !content?.trim())) data.content = "\u200b";

  await client.api.interactions(interaction.id, interaction.token).callback.post({
    data: {
      type,
      data
    }
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
export default async (client, interaction) => {
  client.api.webhooks(client.user.id, interaction.token).messages('@original').delete();
  // client.api.interactions(interaction.id, interaction.token).callback.delete();
}
export default async (client, interaction) => {
  client.api.interactions(interaction.id, interaction.token).callback.delete();
}
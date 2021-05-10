import { MessageEmbed } from "discord.js";
import trimExtraSpace from "../utils/trimExtraSpace.js";

export const name = "about";
export const execute = async (client, message, args) => {
  const embed = new MessageEmbed()
    .setColor("#2576A3")
    .setTitle("サメです、here is more info about creator!")
    .setAuthor("JDεꜱɪɢɴ",
      "https://www.dropbox.com/s/88t69bfojsw4df1/avatar.png?raw=1",
      "https://jdesignera.com/"
    )
    .setDescription(trimExtraSpace(`
      
      Here are some links where you can learn more about him:
    `))
    .addFields(
      {
        name: "Platform",
        value: trimExtraSpace(`
          [Website](https://jdesignera.com/)
          [Discord](https://discord.com/users/156834654140235776)
          [GitHub](https://github.com/jdesignera)
          [GPG](https://jdesignera.com/JDesign_0xA313E5EF_public.asc)

        `)
      }
    )
    .setFooter("</> with <3 by JDεꜱɪɢɴ™#1111");

    message.channel.send(embed);
}
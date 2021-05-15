import { MessageEmbed } from "discord.js";
import trimExtraSpaces from "../utils/trimExtraSpaces.js";
import wsReply from "../addons/wsReply.js";

export const name = "about";
export const description = "I will provide you with information about my creator.";

export const execute = async (client, message, args, isWs = false) => {
  const embed = new MessageEmbed()
    .setColor("#2576A3")
    .setTitle("サメです、here is more info about creator!")
    .setAuthor("JDεꜱɪɢɴ",
      "https://www.dropbox.com/s/88t69bfojsw4df1/avatar.png?raw=1",
      "https://jdesignera.com/"
    )
    .setDescription(trimExtraSpaces(`
      
      Here are some links where you can learn more about him:
    `))
    .addFields(
      {
        name: "Platform",
        value: trimExtraSpaces(`
          [Website](https://jdesignera.com/)
          [Discord](https://discord.com/users/156834654140235776)
          [GitHub](https://github.com/jdesignera)
          [GPG](https://jdesignera.com/JDesign_0xA313E5EF_public.asc)

        `)
      }
    )
    .setFooter("</> with <3 by JDεꜱɪɢɴ™#1111");

    if (isWs) {
      wsReply(client, message, "", embed);
    }
    else {
      message.channel?.send(embed);
    }
}
import { MessageEmbed } from "discord.js";
import trimStartingIndent from "../utils/trimStartingIndent.js";
import wsReply from "../addons/wsReply.js";

export const name = "about";
export const description = "I will provide you with information about my creator.";

export const execute = async (client, message, args, isWs = false) => {
  const embed = new MessageEmbed()
    .setColor("#2576A3")
    .setTitle("サメです、here is more info about creator!")
    .setAuthor("JDεꜱɪɢɴ",
      "https://jdesignera.com/email/main/avatar.jpg",
      "https://jdesignera.com/"
    )
    .setDescription(trimStartingIndent(`
      Here are some links where you can learn more about him or get in touch with:
    `))
    .addFields(
      {
        name: "Platform",
        value: trimStartingIndent(`
          [Website](https://jdesignera.com/)
          [Discord](https://discord.com/users/156834654140235776)
          [Email](https://jdesignera.com/?_email&subject=%5BSame%20Desu%5D%20)
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
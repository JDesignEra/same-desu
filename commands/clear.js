import chalk from "chalk";
import trimExtraSpace from "../utils/trimExtraSpace.js";

export const name = "clear";
export const execute = async (client, message, args) => {
  if (message.member.hasPermission("ADMINISTRATOR")) {
    let amt = args[1] ?? null;

    switch (amt) {
      case "all":
        (async () => {
          let deleted;
  
          do {
            try {
              deleted = await message.channel.bulkDelete(100);
            }
            catch (e) {
              console.log(chalk.red(`${e.name}: ${e.message}\n`));
            }
          } while(deleted.size != 0);
        })();
        break;
    
      default:
        if (!isNaN(amt) || !isNaN(parseFloat(amt))) {
          amt = parseInt(amt);

          (async () => {
            if (amt > 100) {
              let deleted;

              do {
                try {
                  deleted = await message.channel.bulkDelete(amt);
                }
                catch (e) {
                  console.log(chalk.red(`${e.name}: ${e.message}\n`));
                }
              } while(deleted.size != 0);
            }
            else {
              await message.channel.bulkDelete(amt);
            }
          })();
        }
        break;
    }
  }
  else {
    message.channel.send(trimExtraSpace(`
      ${message.author.toString()} 申し訳ありませんが、その許可はありません。
      Sorry, you do not have that permission.
    `));
  }
}
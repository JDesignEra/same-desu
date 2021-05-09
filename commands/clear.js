export const name = "clear";
export function execute(client, message, args) {
  if (message.member.hasPermission("ADMINISTRATOR")) {
    let amt = args.length > 1 && args[1] ? args[1] : null;

    switch (amt) {
      case "all":
        (async () => {
          let deleted;
  
          do {
            deleted = await message.channel.bulkDelete(100);
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
                deleted = await message.channel.bulkDelete(amt);
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
    message.channel.send(`
      ${message.author.toString()}　申し訳ありませんが、その許可はありません。
      ${message.author.toString()} Sorry, you do not have that permission.
    `.replace(/  +/g, ''));
  }
}
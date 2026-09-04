import type { CommandCallbackOpts } from "../../types/command.ts";
import { resetContext } from "../../utils/context.ts";

export default {
  name: "resetctx",
  description: "Reset your conversation context",
  aliases: ["resetcontext", "clearctx", "resetai"],
  async execute({ message }: CommandCallbackOpts) {
    if (message.author.bot) return;

    const mentioned = message.mentions.users.first();
    if (mentioned && mentioned.id !== message.author.id) {
      await message.reply("You can only reset your own context.");
      return;
    }

    resetContext(message.author.id);
    await message.reply("Your conversation context has been reset.");
  },
};

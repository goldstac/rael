import { PermissionFlagsBits } from "discord.js";
import type { CommandCallbackOpts } from "../../types/command.ts";
import { resetContext } from "../../utils/context.ts";

export default {
  name: "resetctx",
  description: "Reset conversation context for a user",
  aliases: ["resetcontext", "clearctx", "resetai"],
  async execute({ message }: CommandCallbackOpts) {
    if (message.author.bot) return;

    const targetUser = message.mentions.users.first() || message.author;
    const isSelf = targetUser.id === message.author.id;

    if (!isSelf) {
      const hasPerms = message.member?.permissions.has(
        PermissionFlagsBits.ManageMessages,
      );
      if (!hasPerms) {
        await message.reply(
          "You need the **Manage Messages** permission to reset someone else's context.",
        );
        return;
      }
    }

    resetContext(targetUser.id);

    if (isSelf) {
      await message.reply("Your conversation context has been reset.");
    } else {
      await message.reply(
        `Conversation context for <@${targetUser.id}> has been reset.`,
      );
    }
  },
};

import { AttachmentBuilder } from "discord.js";
import { HOURLY_TOKEN_LIMIT } from "../../constants/usage.ts";
import type { CommandCallbackOpts } from "../../types/command.ts";
import { canUseAI } from "../../utils/usage.ts";
import { renderUsageCard } from "../../visuals/usageCard.ts";

export default {
  name: "usage",
  description: "Show current token usage for yourself or another user",
  aliases: ["tokens", "limit", "session"],
  async execute({ message, args }: CommandCallbackOpts) {
    if (message.author.bot) return;

    const hasMention = message.mentions?.users?.first();
    const hasArgs = args && args.length > 0;

    if (hasArgs && !hasMention) {
      await message.reply(
        "Use `$usage` to see your usage, or `$usage @user` to see someone else's.",
      );
      return;
    }

    const target = hasMention || message.author;
    const userId = target.id;

    const member = message.guild
      ? await message.guild.members.fetch(target.id).catch(() => null)
      : null;

    const displayName =
      member?.displayName || target.displayName || target.username;
    const handle = `@${target.username}`;
    const avatarUrl = target.displayAvatarURL({
      extension: "png",
      size: 256,
    });

    const { tokensUsed, msUntilReset } = await canUseAI(userId);
    const overBudget = tokensUsed >= HOURLY_TOKEN_LIMIT;

    const cardOptions = {
      displayName,
      handle,
      avatarUrl,
      brand: "Token Usage",
      active: true,
      tokensUsed,
      tokenBudget: HOURLY_TOKEN_LIMIT,
      timeRemainingMs: msUntilReset,
      messageCount: 0,
      imageCount: 0,
      overBudget,
    };

    try {
      const buffer = await renderUsageCard(cardOptions);
      const attachment = new AttachmentBuilder(buffer, {
        name: `usage-${target.id}.png`,
      });
      await message.reply({ files: [attachment] });
    } catch (err) {
      console.error("[Usage] Command error:", err);
      await message.reply("Couldn't generate usage card.");
    }
  },
};

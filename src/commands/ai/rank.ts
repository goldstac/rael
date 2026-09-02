import { AttachmentBuilder } from "discord.js";
import type { CommandCallbackOpts } from "../../types/command.ts";
import { getUserRank } from "../../utils/stats.ts";
import { renderRankCard } from "../../visuals/rankCard.ts";

export default {
  name: "rank",
  description: "Show your rank on the leaderboard",
  aliases: ["myrank"],
  async execute({ message }: CommandCallbackOpts) {
    if (message.author.bot) return;

    try {
      const target = message.mentions?.users?.first() || message.author;
      const userId = target.id;

      const rankData = await getUserRank(userId);

      if (!rankData) {
        const who =
          target.id === message.author.id
            ? "You have"
            : `${target.username} has`;

        await message.reply(
          `${who} no AI usage recorded yet. Use \`$ai\` or \`,\` with a question to start tracking your stats.`,
        );
        return;
      }

      const member = message.guild
        ? await message.guild.members.fetch(target.id).catch(() => null)
        : null;

      const avatarUrl =
        target.displayAvatarURL({ extension: "png", size: 256 }) || null;

      const buffer = await renderRankCard({
        rank: rankData,
        avatarUrl,
        brand: "Rael",
      });

      const attachment = new AttachmentBuilder(buffer, {
        name: `rank-${target.id}.png`,
      });

      await message.reply({ files: [attachment] });
    } catch (err) {
      console.error("[Rank] Command error:", err);
      await message.reply("Could not generate your rank card right now.");
    }
  },
};

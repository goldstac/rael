import { AttachmentBuilder } from "discord.js";
import type { CommandCallbackOpts } from "../../types/command.ts";
import { getLeaderboard } from "../../utils/stats.ts";
import { renderLeaderboardCard } from "../../visuals/leaderboardCard.ts";

export default {
  name: "leaderboard",
  description: "Show the top users by lifetime token usage",
  aliases: ["lb", "top"],
  async execute({ message }: CommandCallbackOpts) {
    if (message.author.bot) return;

    try {
      const entries = await getLeaderboard(10);

      if (entries.length === 0) {
        await message.reply(
          "No usage data yet. Use `$ai` or `,` with a question to start tracking your stats.",
        );
        return;
      }

      const buffer = await renderLeaderboardCard({
        entries,
        brand: "Rael",
      });

      const attachment = new AttachmentBuilder(buffer, {
        name: "leaderboard.png",
      });

      await message.reply({ files: [attachment] });
    } catch (err) {
      console.error("[Leaderboard] Command error:", err);
      await message.reply("Could not generate the leaderboard right now.");
    }
  },
};

import { groq } from "@ai-sdk/groq";
import { generateText, stepCountIs } from "ai";
import type { ModelMessage } from "ai";
import { MAX_QUESTION_CHARS } from "../../constants/askai.ts";
import { MODELS } from "../../constants/model.ts";
import { SYSTEM_PROMPT } from "../../prompts/base.ts";
import { tools } from "../../tools/index.ts";
import type { CommandCallbackOpts } from "../../types/command.ts";
import { openRouter } from "../../utils/ai.ts";
import { addToContext, getContext } from "../../utils/context.ts";
import { pretty } from "../../utils/pretty.ts";
import { sanitizeForPrompt } from "../../utils/sanitize.ts";
import { recordUsage } from "../../utils/stats.ts";
import { canUseAI, formatTimeLeft, setUsage } from "../../utils/usage.ts";

export let CURRENT_MODEL_INDEX = 0;

const processedMessages = new WeakSet<object>();

type ChatMessages = ModelMessage[];

export default {
  name: "askai",
  description: "Ask the AI model",
  aliases: ["ai", "ask"],
  async execute({ message, args, ctx }: CommandCallbackOpts) {
    if (message.author.bot) return;
    if (processedMessages.has(message)) return;
    processedMessages.add(message);

    const question = args.join(" ").trim();
    if (!question) return;

    if (question.length > MAX_QUESTION_CHARS) {
      await message.reply(
        `Your message is too long. Please keep it under ${MAX_QUESTION_CHARS} characters.`,
      );
      return;
    }

    const userId = message.author.id;
    const { allowed, tokensUsed, msUntilReset } = await canUseAI(userId);

    if (!allowed) {
      const timeLeft = formatTimeLeft(msUntilReset);
      await message.reply(
        `You have finished your hourly token limit (${tokensUsed} tokens used). ` +
          `Please try again after an hour (${timeLeft} remaining).`,
      );
      return;
    }

    try {
      if (message.channel && "sendTyping" in message.channel) {
        await message.channel.sendTyping();
      }
    } catch (error) {
      console.error("[askai] Failed to send typing indicator:", error);
    }

    try {
      let systemPrompt =
        SYSTEM_PROMPT +
        `\n- Current Channel ID: "${message.channelId}"\n- Current Message ID: "${message.id}"`;

      if (ctx) {
        systemPrompt += `\n\nThe user is replying to this message (your message):\n"${sanitizeForPrompt(ctx)}"`;
      }

      const history = getContext(userId);
      addToContext(userId, "user", question);

      const messages: ChatMessages = [
        ...(Array.isArray(history)
          ? history.map(({ role, content }) => ({ role, content }))
          : []),
        { role: "user", content: question },
      ];

      const result = await executeAiRequest(systemPrompt, messages);

      if (!result?.text) {
        await message.reply(
          "Sorry, I encountered an issue processing your request right now.",
        );
        return;
      }

      addToContext(userId, "assistant", result.text);
      await message.reply({ content: pretty(result.text) });

      const tokensUsedByModel = result.usage?.totalTokens ?? 0;
      if (tokensUsedByModel > 0) {
        await setUsage(userId, tokensUsedByModel);
      }

      const profile = {
        username: message.author.username,
        displayName: message.author.displayName,
        avatar: message.author.displayAvatarURL({
          extension: "png",
          size: 256,
        }),
      };

      recordUsage(userId, profile, tokensUsedByModel).catch((err) => {
        console.error("[Stats] Failed to record usage:", err);
      });
    } catch (error) {
      console.error("[askai] Unexpected error while handling request:", error);
      await message
        .reply(
          "Sorry, I encountered an issue processing your request right now.",
        )
        .catch(() => {});
    }
  },
};

async function executeAiRequest(systemPrompt: string, messages: ChatMessages) {
  const modelCount = MODELS.length;
  if (modelCount === 0) return null;

  const startIndex = CURRENT_MODEL_INDEX;

  for (let step = 0; step < modelCount; step++) {
    const index = (startIndex + step) % modelCount;
    const modelConfig = MODELS[index];
    if (!modelConfig || !modelConfig.id) continue;

    try {
      const provider = modelConfig.provider === "groq" ? groq : openRouter;

      const result = await generateText({
        model: provider(modelConfig.id as string),
        system: systemPrompt,
        messages,
        temperature: 0.9,
        maxOutputTokens: 1024,
        topP: 1,
        stopWhen: stepCountIs(5),
        tools,
        toolChoice: "auto",
      });

      if (!result.text) {
        console.error(
          `[askai] Model "${modelConfig.name}" returned no text, trying next.`,
        );
        continue;
      }

      CURRENT_MODEL_INDEX = (index + 1) % modelCount;
      return result;
    } catch (error) {
      console.error(`[askai] Model "${modelConfig.name}" failed:`, error);
    }
  }

  CURRENT_MODEL_INDEX = (startIndex + 1) % modelCount;
  return null;
}

export function resetIndex() {
  CURRENT_MODEL_INDEX = 0;
}

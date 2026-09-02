import {
  createCanvas,
  GlobalFonts,
  loadImage,
  type CanvasRenderingContext2D,
} from "@napi-rs/canvas";
import path from "path";
import { fileURLToPath } from "url";
import type { UserRank } from "../utils/stats.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, "..", "..", "assets", "fonts");

let fontsRegistered = false;

function ensureFonts() {
  if (fontsRegistered) return;
  try {
    GlobalFonts.registerFromPath(
      path.join(FONTS_DIR, "Inter-Regular.ttf"),
      "Inter",
    );
    GlobalFonts.registerFromPath(
      path.join(FONTS_DIR, "Inter-SemiBold.ttf"),
      "InterSemiBold",
    );
    GlobalFonts.registerFromPath(
      path.join(FONTS_DIR, "Inter-Bold.ttf"),
      "InterBold",
    );
    fontsRegistered = true;
  } catch (err) {
    console.error("Failed to register fonts:", err);
  }
}

const WIDTH = 800;
const HEIGHT = 280;

const COLORS = {
  background: "#1a1a2e",
  backgroundLight: "#16213e",
  accent: "#3b82f6",
  accentPurple: "#8b5cf6",
  text: "#ffffff",
  muted: "#a0a0a0",
  mutedDark: "#7a7a7a",
  border: "#ffffff",
  rank1Gold: "#facc15",
  barBg: "rgba(255,255,255,0.1)",
};

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function formatTokens(value: number): string {
  const n = Number(value) || 0;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TIMEOUT = 5000;
const ALLOWED_HOSTS = ["cdn.discordapp.com", "media.discordapp.net"];

async function loadAvatar(url?: string | null) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) return null;

    const pngUrl = url.replace(/\.(webp|gif)(\?|$)/i, ".png$2");
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), AVATAR_TIMEOUT);

    const res = await fetch(pngUrl, { signal: controller.signal });
    clearTimeout(timeout);

    if (!res.ok) return null;

    const contentLength = Number(res.headers.get("content-length") || 0);
    if (contentLength > MAX_AVATAR_SIZE) return null;

    return await loadImage(Buffer.from(await res.arrayBuffer()));
  } catch {
    return null;
  }
}

function truncate(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let result = text;
  while (result.length > 1 && ctx.measureText(`${result}…`).width > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

export interface RankCardOptions {
  rank: UserRank;
  avatarUrl?: string | null;
  brand?: string;
}

export async function renderRankCard(opts: RankCardOptions): Promise<Buffer> {
  ensureFonts();

  try {
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext("2d");

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
    bgGrad.addColorStop(0, COLORS.background);
    bgGrad.addColorStop(1, COLORS.backgroundLight);
    ctx.fillStyle = bgGrad;
    roundRectPath(ctx, 0, 0, WIDTH, HEIGHT, 20);
    ctx.fill();

    // Left accent bar
    const accentGrad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    accentGrad.addColorStop(0, COLORS.accent);
    accentGrad.addColorStop(1, COLORS.accentPurple);
    ctx.fillStyle = accentGrad;
    roundRectPath(ctx, 0, 0, 6, HEIGHT, 3);
    ctx.fill();

    // Avatar with white border
    const avatar = await loadAvatar(opts.avatarUrl);
    const avatarSize = 130;
    const avatarX = 100;
    const avatarY = HEIGHT / 2 - avatarSize / 2;

    ctx.save();
    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2 + 4,
      0,
      Math.PI * 2,
    );
    ctx.fillStyle = COLORS.border;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(
      avatarX + avatarSize / 2,
      avatarY + avatarSize / 2,
      avatarSize / 2,
      0,
      Math.PI * 2,
    );
    ctx.closePath();
    ctx.clip();
    if (avatar) {
      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
    } else {
      ctx.fillStyle = COLORS.accent;
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
      ctx.font = "bold 48px InterBold";
      ctx.fillStyle = COLORS.text;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        opts.rank.username.charAt(0).toUpperCase(),
        avatarX + avatarSize / 2,
        avatarY + avatarSize / 2,
      );
    }
    ctx.restore();

    // Text section
    const textX = avatarX + avatarSize + 30;

    // Display name
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = COLORS.text;
    ctx.font = "bold 32px InterBold";
    ctx.fillText(
      truncate(ctx, opts.rank.displayName || "Unknown", 300),
      textX,
      90,
    );

    // Username
    ctx.font = "20px Inter";
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(`@${opts.rank.username}`, textX, 120);

    // Stats row
    ctx.font = "18px Inter";
    ctx.fillStyle = COLORS.accent;
    ctx.fillText(`💬 ${formatTokens(opts.rank.tokens)} tokens`, textX, 165);
    ctx.fillStyle = COLORS.mutedDark;
    ctx.fillText(`🔥 ${opts.rank.currentStreak} day streak`, textX, 195);

    // Rank badge (top right)
    const rankStr = `#${opts.rank.rank}`;
    const rankBadgeW = rankStr.length > 3 ? 80 : 60;
    const rankBadgeColor =
      opts.rank.rank === 1
        ? COLORS.rank1Gold
        : opts.rank.rank <= 3
          ? COLORS.accent
          : COLORS.barBg;
    ctx.fillStyle = rankBadgeColor;
    roundRectPath(ctx, WIDTH - rankBadgeW - 30, 20, rankBadgeW, 34, 17);
    ctx.fill();
    ctx.font = "bold 16px InterBold";
    ctx.fillStyle = opts.rank.rank <= 3 ? COLORS.text : COLORS.muted;
    ctx.textAlign = "center";
    ctx.fillText(rankStr, WIDTH - rankBadgeW / 2 - 30, 43);

    // Progress bar
    const barX = textX;
    const barY = 220;
    const barW = WIDTH - barX - 40;
    const barH = 14;

    // Calculate progress
    const progress =
      opts.rank.rank <= 10
        ? 0.9
        : opts.rank.rank <= 50
          ? 0.6
          : opts.rank.rank <= 100
            ? 0.4
            : 0.2;

    // Bar background
    ctx.fillStyle = COLORS.barBg;
    roundRectPath(ctx, barX, barY, barW, barH, 7);
    ctx.fill();

    // Bar fill
    if (progress > 0) {
      const fillGrad = ctx.createLinearGradient(
        barX,
        0,
        barX + barW * progress,
        0,
      );
      fillGrad.addColorStop(0, COLORS.accent);
      fillGrad.addColorStop(1, COLORS.accentPurple);
      ctx.fillStyle = fillGrad;
      roundRectPath(ctx, barX, barY, barW * progress, barH, 7);
      ctx.fill();
    }

    // Progress text
    ctx.font = "13px Inter";
    ctx.fillStyle = COLORS.muted;
    ctx.textAlign = "right";
    ctx.fillText(
      `${opts.rank.rank} of ${opts.rank.totalUsers} users`,
      WIDTH - 40,
      barY + 12,
    );

    // Brand
    if (opts.brand) {
      ctx.fillStyle = COLORS.mutedDark;
      ctx.font = "14px InterSemiBold";
      ctx.textAlign = "left";
      ctx.fillText(opts.brand, barX, HEIGHT - 15);
    }

    return canvas.toBuffer("image/png");
  } catch (err) {
    console.error("[RankCard] Failed to render rank card:", err);
    throw err;
  }
}

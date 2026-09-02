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

const WIDTH = 1000;
const HEIGHT = 350;

const COLORS = {
  background: "#0a0a0a",
  border: "#1c1c1e",
  text: "#f2f2f2",
  muted: "#7a7a7a",
  divider: "#1c1c1e",
  rank1: "#1d4ed8",
  rank2: "#C0C0C0",
  rank3: "#CD7F32",
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

function rankColor(rank: number): string {
  if (rank === 1) return COLORS.rank1;
  if (rank === 2) return COLORS.rank2;
  if (rank === 3) return COLORS.rank3;
  return COLORS.muted;
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

    ctx.fillStyle = COLORS.background;
    roundRectPath(ctx, 0, 0, WIDTH, HEIGHT, 28);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = COLORS.border;
    roundRectPath(ctx, 1, 1, WIDTH - 2, HEIGHT - 2, 28);
    ctx.stroke();

    const padX = 60;

    // Large rank number
    const { rank } = opts.rank;
    ctx.fillStyle = rankColor(rank);
    ctx.font = "120px InterBold";
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.fillText(`#${rank}`, padX, HEIGHT / 2);

    // Divider
    const divX = padX + 200;
    ctx.strokeStyle = COLORS.divider;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(divX, 40);
    ctx.lineTo(divX, HEIGHT - 40);
    ctx.stroke();

    // Avatar
    const avatar = await loadAvatar(opts.avatarUrl);
    const avatarSize = 100;
    const avatarX = divX + 30;
    const avatarY = HEIGHT / 2 - avatarSize / 2;

    ctx.save();
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
      ctx.fillStyle = "#1d4ed8";
      ctx.fillRect(avatarX, avatarY, avatarSize, avatarSize);
    }
    ctx.restore();

    // Display name
    const textX = avatarX + avatarSize + 24;
    ctx.fillStyle = COLORS.text;
    ctx.font = "36px InterBold";
    ctx.textBaseline = "alphabetic";
    ctx.textAlign = "left";
    ctx.fillText(
      truncate(ctx, opts.rank.displayName || "Unknown", 400),
      textX,
      avatarY + 40,
    );

    // Username
    ctx.fillStyle = COLORS.muted;
    ctx.font = "24px Inter";
    ctx.fillText(`@${opts.rank.username}`, textX, avatarY + 72);

    // Stats (right side)
    const statsX = WIDTH - padX;
    ctx.textAlign = "right";

    ctx.fillStyle = COLORS.text;
    ctx.font = "30px InterBold";
    ctx.fillText(
      `${formatTokens(opts.rank.lifetimeTokens)} tokens`,
      statsX,
      avatarY + 30,
    );

    ctx.fillStyle = COLORS.muted;
    ctx.font = "22px Inter";
    ctx.fillText(`${opts.rank.currentStreak} day streak`, statsX, avatarY + 60);

    // Gap info
    if (opts.rank.tokensBehind !== null && opts.rank.rankAbove !== null) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = "20px Inter";
      ctx.fillText(
        `${formatTokens(opts.rank.tokensBehind)} tokens behind #${opts.rank.rankAbove}`,
        statsX,
        avatarY + 92,
      );
    } else if (opts.rank.rank === 1) {
      ctx.fillStyle = rankColor(1);
      ctx.font = "20px InterSemiBold";
      ctx.fillText("Top of the leaderboard!", statsX, avatarY + 92);
    }

    // Total users (bottom right)
    ctx.fillStyle = COLORS.muted;
    ctx.font = "18px Inter";
    ctx.textAlign = "right";
    ctx.fillText(
      `Rank ${opts.rank.rank} of ${opts.rank.totalUsers} users`,
      WIDTH - padX,
      HEIGHT - 30,
    );

    // Brand
    if (opts.brand) {
      ctx.fillStyle = COLORS.muted;
      ctx.font = "18px InterSemiBold";
      ctx.textAlign = "left";
      ctx.fillText(opts.brand, padX, HEIGHT - 30);
    }

    ctx.textAlign = "left";
    return canvas.toBuffer("image/png");
  } catch (err) {
    console.error("[RankCard] Failed to render rank card:", err);
    throw err;
  }
}

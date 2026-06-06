/**
 * videoDownloader.ts
 * Uses yt-dlp to download Instagram Reels / YouTube videos.
 *
 * Instagram requires authentication — we pass --cookies-from-browser
 * so yt-dlp reads the session cookie from the installed browser automatically.
 * Tries: edge → chrome → firefox → chromium (in order, first one that works wins).
 */

import { execFile } from "child_process";
import { promisify } from "util";
import { readFile, unlink, mkdtemp, rmdir, readdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";

const execFileAsync = promisify(execFile);

export interface DownloadResult {
  buffer: Buffer;
  mimeType: string;
  filename: string;
  sizeBytes: number;
}

/** Maximum video we'll send to Gemini (50 MB inline limit) */
const MAX_BYTES = 50 * 1024 * 1024;

/** Browsers to try for cookie extraction (Windows order: Edge first, then Chrome, then Firefox) */
const BROWSERS = ["edge", "chrome", "firefox", "chromium"] as const;

async function tryDownload(url: string, outputTemplate: string, browser?: string): Promise<void> {
  const args = [
    "--no-playlist",
    "--no-part",
    "--quiet",
    "--max-filesize", "50m",
    "-f", "mp4/best[ext=mp4]/best",
  ];

  if (browser) {
    args.push("--cookies-from-browser", browser);
  }

  args.push("-o", outputTemplate, url);

  await execFileAsync("yt-dlp", args, { timeout: 120_000 });
}

async function getDownloadedFilename(url: string, outputTemplate: string, browser?: string): Promise<string> {
  const args = [
    "--no-playlist",
    "--quiet",
    "--print", "filename",
    "-f", "mp4/best[ext=mp4]/best",
    "--skip-download",
  ];
  if (browser) {
    args.push("--cookies-from-browser", browser);
  }
  args.push("-o", outputTemplate, url);

  const { stdout } = await execFileAsync("yt-dlp", args, { timeout: 30_000 });
  return stdout.trim();
}

export async function downloadVideo(url: string): Promise<DownloadResult> {
  const tmpDir = await mkdtemp(join(tmpdir(), "clarifact-video-"));
  const outputTemplate = join(tmpDir, "video.%(ext)s");

  try {
    const isInstagram = /instagram\.com/.test(url);

    if (isInstagram) {
      // Instagram always needs cookies — try each browser in order
      let lastError: Error | null = null;

      for (const browser of BROWSERS) {
        try {
          await tryDownload(url, outputTemplate, browser);
          const filename = await getDownloadedFilename(url, outputTemplate, browser);
          const buffer = await readFile(filename);
          if (buffer.byteLength > MAX_BYTES) {
            throw new Error(`Video too large: ${(buffer.byteLength / 1e6).toFixed(1)} MB (max 50 MB)`);
          }
          const ext = filename.split(".").pop()?.toLowerCase() ?? "mp4";
          const mimeType = ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : "video/mp4";
          return { buffer, mimeType, filename, sizeBytes: buffer.byteLength };
        } catch (err: any) {
          lastError = err;
          // If it's a cookie error, try next browser; otherwise give up
          const msg = String(err?.message ?? "");
          if (!msg.includes("cookies") && !msg.includes("cookie") && !msg.includes("login") && !msg.includes("authentication") && !msg.includes("empty media")) {
            throw err; // Not a cookie-related error — propagate immediately
          }
          // else try next browser
        }
      }

      // All browsers failed — throw a clear actionable message
      throw new Error(
        `Instagram requires browser login cookies. Please log in to Instagram in Chrome, Edge, or Firefox and try again. (Detail: ${lastError?.message})`
      );
    } else {
      // Non-Instagram (YouTube, etc.) — try without cookies first
      try {
        await tryDownload(url, outputTemplate);
      } catch {
        // Try with chrome cookies as fallback for age-restricted content
        await tryDownload(url, outputTemplate, "chrome");
      }
      const filename = await getDownloadedFilename(url, outputTemplate);
      const buffer = await readFile(filename);
      if (buffer.byteLength > MAX_BYTES) {
        throw new Error(`Video too large: ${(buffer.byteLength / 1e6).toFixed(1)} MB (max 50 MB)`);
      }
      const ext = filename.split(".").pop()?.toLowerCase() ?? "mp4";
      const mimeType = ext === "webm" ? "video/webm" : ext === "mov" ? "video/quicktime" : "video/mp4";
      return { buffer, mimeType, filename, sizeBytes: buffer.byteLength };
    }
  } finally {
    // Best-effort cleanup
    try {
      const files = await readdir(tmpDir).catch(() => [] as string[]);
      await Promise.all(files.map((f) => unlink(join(tmpDir, f)).catch(() => {})));
      await rmdir(tmpDir).catch(() => {});
    } catch { /* no-op */ }
  }
}

export async function isYtDlpAvailable(): Promise<boolean> {
  try {
    await execFileAsync("yt-dlp", ["--version"], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

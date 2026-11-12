import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordVideoSent, recordBroadcast, deactivateClient } from './storage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic runtime video configuration
let activeVideoConfig = {
  type: 'local', // 'local' | 'url' | 'file_id'
  source: process.env.VIDEO_PATH || path.join(__dirname, '../media/sample.mp4'),
  caption: process.env.VIDEO_CAPTION || '🎬 Here is your video! Enjoy watching.'
};

// Check if initial env has url or file_id
if (process.env.VIDEO_FILE_ID) {
  activeVideoConfig = {
    type: 'file_id',
    source: process.env.VIDEO_FILE_ID,
    caption: process.env.VIDEO_CAPTION || '🎬 Here is your video! Enjoy watching.'
  };
} else if (process.env.VIDEO_URL) {
  activeVideoConfig = {
    type: 'url',
    source: process.env.VIDEO_URL,
    caption: process.env.VIDEO_CAPTION || '🎬 Here is your video! Enjoy watching.'
  };
}

/**
 * Get current video configuration
 */
export function getVideoConfig() {
  return { ...activeVideoConfig };
}

/**
 * Update video configuration at runtime
 */
export function setVideoConfig({ type, source, caption }) {
  if (type) activeVideoConfig.type = type;
  if (source) activeVideoConfig.source = source;
  if (caption !== undefined) activeVideoConfig.caption = caption;
  return activeVideoConfig;
}

/**
 * Resolve video payload for Telegraf `sendVideo`
 */
export function getTelegrafVideoSource(customSource, customType) {
  const type = customType || activeVideoConfig.type;
  const source = customSource || activeVideoConfig.source;

  if (type === 'file_id') {
    return source; // Telegram file_id is a plain string
  }

  if (type === 'url') {
    return { url: source };
  }

  // Local file
  const resolvedPath = path.isAbsolute(source) ? source : path.resolve(process.cwd(), source);
  if (!fs.existsSync(resolvedPath)) {
    // Fallback to sample if missing
    const fallbackPath = path.join(__dirname, '../media/sample.mp4');
    if (fs.existsSync(fallbackPath)) {
      return { source: fs.createReadStream(fallbackPath) };
    }
    throw new Error(`Video file not found at ${resolvedPath}`);
  }

  return { source: fs.createReadStream(resolvedPath) };
}

/**
 * Send a video to a specific chat ID with progress status and error handling
 */
export async function sendVideoToClient(bot, chatId, options = {}) {
  const caption = options.caption || activeVideoConfig.caption;
  const videoPayload = getTelegrafVideoSource(options.source, options.type);

  try {
    // 1. Send "upload_video" typing action to indicate video is being prepared
    await bot.telegram.sendChatAction(chatId, 'upload_video').catch(() => {});

    // 2. Send the video
    const sentMessage = await bot.telegram.sendVideo(chatId, videoPayload, {
      caption: caption,
      parse_mode: 'HTML',
      supports_streaming: true,
      ...options.extra
    });

    // 3. Record video sent in client record and global stats
    recordVideoSent(chatId);

    // If sent locally and Telegram returned a file_id, we can cache it for ultra-fast future sends!
    if (sentMessage?.video?.file_id && activeVideoConfig.type === 'local') {
      console.log(`[VideoManager] Cached Telegram file_id for faster delivery: ${sentMessage.video.file_id}`);
    }

    return {
      success: true,
      messageId: sentMessage.message_id,
      fileId: sentMessage.video?.file_id
    };
  } catch (error) {
    const errMsg = error.message || String(error);
    console.error(`[VideoManager] Failed to send video to ${chatId}:`, errMsg);

    // If bot was blocked or user deactivated, mark client
    if (errMsg.includes('bot was blocked by the user') || errMsg.includes('chat not found') || errMsg.includes('Forbidden')) {
      deactivateClient(chatId, 'blocked_or_not_found');
    }

    return {
      success: false,
      error: errMsg
    };
  }
}

/**
 * Broadcast video to a list of clients with safe rate limiting
 */
export async function broadcastVideo(bot, clientIds, options = {}) {
  const results = {
    total: clientIds.length,
    sent: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < clientIds.length; i++) {
    const chatId = clientIds[i];
    const res = await sendVideoToClient(bot, chatId, options);

    if (res.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ chatId, error: res.error });
    }

    // Rate-limiting delay to avoid Telegram 429 flood limits (30-40 messages per second limit)
    if (i < clientIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, options.delayMs || 60));
    }
  }

  recordBroadcast(results.sent);
  return results;
}

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { recordVideoSent, recordBroadcast, deactivateClient, getClientSeenVideos } from './storage.js';
import { getTelegrafVideoSource } from './videoManager.js';
import { Markup } from 'telegraf';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const CHANNEL_VIDEOS_FILE = path.join(DATA_DIR, 'channel_videos.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(CHANNEL_VIDEOS_FILE)) {
  fs.writeFileSync(CHANNEL_VIDEOS_FILE, JSON.stringify([], null, 2));
}

function readJsonFile(filePath, defaultValue) {
  try {
    if (!fs.existsSync(filePath)) return defaultValue;
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err.message);
    return defaultValue;
  }
}

function writeJsonFile(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err.message);
  }
}

/**
 * Add a video from channel to the catalog
 */
export function addChannelVideo(videoItem) {
  const videos = readJsonFile(CHANNEL_VIDEOS_FILE, []);

  // Check duplicate by fileUniqueId or (channelId + messageId)
  const isDuplicate = videos.some(v => {
    if (videoItem.fileUniqueId && v.fileUniqueId && v.fileUniqueId === videoItem.fileUniqueId) {
      return true;
    }
    if (videoItem.channelId && videoItem.messageId && v.channelId === videoItem.channelId && v.messageId === videoItem.messageId) {
      return true;
    }
    if (videoItem.fileId && v.fileId && v.fileId === videoItem.fileId) {
      return true;
    }
    return false;
  });

  if (isDuplicate) {
    return { added: false, reason: 'duplicate', total: videos.length };
  }

  const newEntry = {
    id: videoItem.id || `vid_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    fileId: videoItem.fileId || null,
    fileUniqueId: videoItem.fileUniqueId || null,
    channelId: videoItem.channelId || null,
    channelTitle: videoItem.channelTitle || '',
    channelUsername: videoItem.channelUsername || '',
    messageId: videoItem.messageId || null,
    caption: videoItem.caption || '',
    duration: videoItem.duration || null,
    width: videoItem.width || null,
    height: videoItem.height || null,
    addedAt: new Date().toISOString(),
    sourceType: videoItem.sourceType || 'manual' // 'channel_post' | 'forward' | 'scan' | 'link'
  };

  videos.push(newEntry);
  writeJsonFile(CHANNEL_VIDEOS_FILE, videos);
  return { added: true, video: newEntry, total: videos.length };
}

/**
 * Get all videos in the channel catalog
 */
export function getChannelVideos() {
  return readJsonFile(CHANNEL_VIDEOS_FILE, []);
}

/**
 * Get count of cataloged videos
 */
export function getChannelVideoCount() {
  const videos = readJsonFile(CHANNEL_VIDEOS_FILE, []);
  return videos.length;
}

/**
 * Remove a video by ID
 */
export function removeChannelVideo(videoId) {
  const videos = readJsonFile(CHANNEL_VIDEOS_FILE, []);
  const filtered = videos.filter(v => v.id !== videoId && v.fileId !== videoId);
  writeJsonFile(CHANNEL_VIDEOS_FILE, filtered);
  return { removed: videos.length !== filtered.length, total: filtered.length };
}

/**
 * Clear all videos in the catalog
 */
export function clearChannelVideos() {
  writeJsonFile(CHANNEL_VIDEOS_FILE, []);
  return { cleared: true };
}

/**
 * Pick a random video from catalog, only selecting items with valid video file IDs
 */
export function pickRandomVideo(seenIds = []) {
  const videos = readJsonFile(CHANNEL_VIDEOS_FILE, []);
  // Strictly filter for real video files with fileId
  const validVideos = videos.filter(v => Boolean(v.fileId));
  if (validVideos.length === 0) return null;

  // Filter out seen videos if possible
  const unseen = validVideos.filter(v => !seenIds.includes(v.id) && !seenIds.includes(v.fileId));
  const pool = unseen.length > 0 ? unseen : validVideos;

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex];
}

/**
 * Send a random channel video to a client
 */
export async function sendRandomVideoToClient(bot, chatId, options = {}) {
  const videos = getChannelVideos();
  const configuredChannel = process.env.CHANNEL_ID || process.env.TELEGRAM_CHANNEL;

  try {
    // Show typing / uploading indicator
    await bot.telegram.sendChatAction(chatId, 'upload_video').catch(() => {});

    const seenIds = options.seenIds || getClientSeenVideos(chatId);
    const nextButton = Markup.inlineKeyboard([
      [Markup.button.callback('🎲 Next Random Video', 'action_random_video')]
    ]);

    // Case 1: Catalog has indexed channel videos
    if (videos.length > 0) {
      const selectedVideo = pickRandomVideo(seenIds);

      // ONLY send if we have a real video fileId (guarantees in-app video player, NOT a channel link)
      if (selectedVideo && selectedVideo.fileId) {
        try {
          const sentMessage = await bot.telegram.sendVideo(chatId, selectedVideo.fileId, {
            caption: options.customCaption || selectedVideo.caption || '🎬 <b>Random Video</b>',
            parse_mode: 'HTML',
            supports_streaming: true,
            reply_markup: nextButton.reply_markup,
            ...options.extra
          });

          recordVideoSent(chatId, selectedVideo.id);
          return {
            success: true,
            video: selectedVideo,
            messageId: sentMessage.message_id,
            totalAvailable: videos.length
          };
        } catch (sendErr) {
          console.warn(`[ChannelManager] sendVideo with fileId failed:`, sendErr.message);
        }
      }
    }

    // Case 2: Fallback if no channel videos are indexed yet
    // Send local sample video and notify user
    const fallbackSource = getTelegrafVideoSource();
    const fallbackMsg = await bot.telegram.sendVideo(chatId, fallbackSource, {
      caption: '🎬 <b>TellMan Video Player</b>\n<i>(To add videos from your channel, upload or forward video files directly to this chat!)</i>',
      parse_mode: 'HTML',
      supports_streaming: true,
      reply_markup: nextButton.reply_markup
    });

    recordVideoSent(chatId, 'sample_fallback');
    return {
      success: true,
      messageId: fallbackMsg.message_id,
      isFallback: true,
      totalAvailable: 0
    };

  } catch (error) {
    const errMsg = error.message || String(error);
    console.error(`[ChannelManager] Failed to send random video to ${chatId}:`, errMsg);

    if (errMsg.includes('bot was blocked') || errMsg.includes('Forbidden') || errMsg.includes('chat not found')) {
      deactivateClient(chatId, 'blocked_or_not_found');
    }

    return {
      success: false,
      error: errMsg
    };
  }
}

/**
 * Broadcast random video to all clients
 */
export async function broadcastRandomVideo(bot, clientIds, options = {}) {
  const results = {
    total: clientIds.length,
    sent: 0,
    failed: 0,
    errors: []
  };

  for (let i = 0; i < clientIds.length; i++) {
    const chatId = clientIds[i];
    const res = await sendRandomVideoToClient(bot, chatId, options);

    if (res.success) {
      results.sent++;
    } else {
      results.failed++;
      results.errors.push({ chatId, error: res.error });
    }

    if (i < clientIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, options.delayMs || 60));
    }
  }

  recordBroadcast(results.sent);
  return results;
}

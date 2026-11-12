import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { addChannelVideo, getChannelVideoCount } from './channelManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const CHECKPOINT_FILE = path.join(DATA_DIR, 'index_checkpoint.json');

function saveCheckpoint(data) {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch {}
}

/**
 * Fast concurrent channel scanner with rate-limit protection
 */
export async function runChannelIndexer(bot, options = {}) {
  const channelId = options.channelId || process.env.CHANNEL_ID || '-1003865751619';
  const adminChatId = options.adminChatId || process.env.ADMIN_CHAT_ID || '1296727385';
  const startId = options.startId || 4036;
  const endId = options.endId || 2;
  const concurrency = options.concurrency || 8; // Number of parallel workers
  const batchDelayMs = options.batchDelayMs || 150; // Delay between batches to stay under ~30 req/sec

  console.log('='.repeat(60));
  console.log(`🚀 FAST CHANNEL INDEXER STARTING`);
  console.log(`• Range: Messages #${startId} down to #${endId} (${startId - endId + 1} total)`);
  console.log(`• Concurrency: ${concurrency} parallel requests per batch`);
  console.log(`• Target Channel: ${channelId}`);
  console.log(`• Silent Mode: ON (Zero notifications to admin chat)`);
  console.log('='.repeat(60));

  let totalScanned = 0;
  let newVideosIndexed = 0;
  const totalToScan = startId - endId + 1;

  // Process in concurrent batches
  for (let currentId = startId; currentId >= endId; currentId -= concurrency) {
    const batchIds = [];
    for (let i = 0; i < concurrency && (currentId - i) >= endId; i++) {
      batchIds.push(currentId - i);
    }

    // Process batch in parallel
    const results = await Promise.allSettled(
      batchIds.map(async (msgId) => {
        try {
          // Forward message silently
          const fwd = await bot.telegram.forwardMessage(adminChatId, channelId, msgId, {
            disable_notification: true
          });

          // Instantly delete from admin chat so no message remains
          await bot.telegram.deleteMessage(adminChatId, fwd.message_id).catch(() => {});

          // Extract video or video document
          let media = null;
          let type = null;

          if (fwd.video) {
            media = fwd.video;
            type = 'video';
          } else if (fwd.document && (
            fwd.document.mime_type?.startsWith('video/') ||
            fwd.document.file_name?.match(/\.(mp4|mov|avi|mkv|webm|m4v)$/i)
          )) {
            media = fwd.document;
            type = 'document_video';
          } else if (fwd.animation) {
            media = fwd.animation;
            type = 'animation';
          }

          if (media && media.file_id) {
            const addRes = addChannelVideo({
              fileId: media.file_id,
              fileUniqueId: media.file_unique_id,
              channelId: channelId,
              channelTitle: 'Collections',
              messageId: msgId,
              caption: fwd.caption || '',
              duration: media.duration || 0,
              width: media.width || null,
              height: media.height || null,
              sourceType: 'channel_scan'
            });

            return { msgId, isVideo: true, added: addRes.added };
          }

          return { msgId, isVideo: false };
        } catch (err) {
          const errMsg = err.message || '';
          if (err.response?.error_code === 429 || errMsg.includes('429')) {
            const retryAfter = err.response?.parameters?.retry_after || 5;
            return { msgId, rateLimit: true, retryAfter };
          }
          return { msgId, error: true };
        }
      })
    );

    // Check if any request in batch hit rate limit
    let hitRateLimit = false;
    let maxWait = 5;

    results.forEach((r) => {
      totalScanned++;
      if (r.status === 'fulfilled') {
        if (r.value.isVideo && r.value.added) {
          newVideosIndexed++;
        }
        if (r.value.rateLimit) {
          hitRateLimit = true;
          maxWait = Math.max(maxWait, r.value.retryAfter || 5);
        }
      }
    });

    if (hitRateLimit) {
      console.warn(`[ChannelIndexer] Rate limit encountered, pausing ${maxWait}s...`);
      await new Promise(r => setTimeout(r, (maxWait + 1) * 1000));
    }

    // Periodic progress report every 100 messages
    if (totalScanned % 100 < concurrency || totalScanned >= totalToScan) {
      const pct = Math.min(100, Math.round((totalScanned / totalToScan) * 100));
      console.log(`[ChannelIndexer] [${pct}%] Scanned ${totalScanned}/${totalToScan} msgs (at #${currentId}) | Catalog: ${getChannelVideoCount()} videos`);
      saveCheckpoint({
        lastScannedId: currentId,
        totalScanned,
        newVideosIndexed,
        totalInCatalog: getChannelVideoCount(),
        updatedAt: new Date().toISOString()
      });
    }

    // Batch spacing
    await new Promise(r => setTimeout(r, batchDelayMs));
  }

  console.log('='.repeat(60));
  console.log(`🎉 FAST INDEXING COMPLETE!`);
  console.log(`• Total Messages Scanned: ${totalScanned}`);
  console.log(`• Total Videos in Catalog: ${getChannelVideoCount()}`);
  console.log('='.repeat(60));

  saveCheckpoint({
    isCompleted: true,
    totalInCatalog: getChannelVideoCount(),
    completedAt: new Date().toISOString()
  });

  return { totalScanned, catalogTotal: getChannelVideoCount() };
}

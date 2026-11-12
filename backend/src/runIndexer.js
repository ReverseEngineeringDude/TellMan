import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Telegraf } from 'telegraf';
import { runChannelIndexer } from './indexChannelVideos.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env
const localEnvPath = path.join(__dirname, '../.env');
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.CHANNEL_ID || '-1003865751619';
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID || '1296727385';

if (!BOT_TOKEN) {
  console.error('❌ BOT_TOKEN is required.');
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);

console.log('='.repeat(60));
console.log('📼 Starting Full Channel Video Indexer');
console.log('='.repeat(60));
console.log(`Channel: ${CHANNEL_ID}`);
console.log(`Admin ID: ${ADMIN_CHAT_ID} (Silent mode - no DM logs sent)`);

// Run indexer from 4036 down to 2
runChannelIndexer(bot, {
  channelId: CHANNEL_ID,
  adminChatId: ADMIN_CHAT_ID,
  startId: 4010,
  endId: 2,
  delayMs: 60
}).then(res => {
  console.log('✅ Indexing completed successfully:', res);
  process.exit(0);
}).catch(err => {
  console.error('❌ Indexing error:', err);
  process.exit(1);
});

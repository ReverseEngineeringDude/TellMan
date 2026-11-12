import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createBot } from './bot.js';
import { createServer } from './server.js';
import { getStats, loadClientsFromFirestore } from './storage.js';
import { getVideoConfig } from './videoManager.js';
import { getChannelVideoCount } from './channelManager.js';
import { isFirestoreEnabled } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. Load local .env
const localEnvPath = path.join(__dirname, '../.env');
if (fs.existsSync(localEnvPath)) {
  dotenv.config({ path: localEnvPath });
}

// 2. Fallback to parent .env if BOT_TOKEN not set
const parentEnvPath = path.join(__dirname, '../../.env');
if (!process.env.BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN && fs.existsSync(parentEnvPath)) {
  dotenv.config({ path: parentEnvPath });
}

const BOT_TOKEN = process.env.BOT_TOKEN || process.env.TELEGRAM_BOT_TOKEN || process.env.VITE_TELEGRAM_BOT_TOKEN;
const PORT = process.env.PORT || 3001;

async function main() {
  console.log('='.repeat(60));
  console.log('🚀 TellMan Telegram Video Bot starting...');
  console.log('='.repeat(60));

  if (!BOT_TOKEN) {
    console.error('\n❌ ERROR: No Telegram Bot Token found!');
    console.error('Please create a .env file in backend/ with:');
    console.error('  BOT_TOKEN=your_bot_token_from_botfather\n');
    console.error('Or set TELEGRAM_BOT_TOKEN / VITE_TELEGRAM_BOT_TOKEN in .env\n');
    process.exit(1);
  }

  // Obfuscate token for safe logging
  const maskedToken = BOT_TOKEN.slice(0, 8) + '...' + BOT_TOKEN.slice(-5);
  console.log(`🔑 Bot Token: [${maskedToken}]`);

  // Initialize bot
  const bot = createBot(BOT_TOKEN);

  // Initialize API server
  const app = createServer(bot);
  const server = app.listen(PORT, () => {
    console.log(`🌐 HTTP API Server running at http://localhost:${PORT}`);
    console.log(`   - GET  /health                  -> Web Interface & Health Check Dashboard`);
    console.log(`   - GET  /api/stats               -> View bot & client statistics`);
    console.log(`   - GET  /api/clients             -> View registered client list`);
    console.log(`   - GET  /api/channel-videos      -> View indexed channel videos`);
    console.log(`   - POST /api/send-random-video   -> Send random video to client { chatId }`);
    console.log(`   - POST /api/broadcast-random-video -> Broadcast random video to all clients`);
  });

  // Launch Bot Polling with automatic reconnection retries
  let botInfo = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (!botInfo && attempts < maxAttempts) {
    attempts++;
    try {
      console.log(`📡 Connecting to Telegram Bot API (attempt ${attempts}/${maxAttempts})...`);
      botInfo = await bot.telegram.getMe();
    } catch (err) {
      console.warn(`⚠️ Telegram connection attempt ${attempts} failed (${err.code || err.message}). Retrying in 3s...`);
      if (err.message?.includes('404: Not Found') || err.message?.includes('401: Unauthorized')) {
        console.error('👉 The provided BOT_TOKEN appears invalid or placeholder.');
        break;
      }
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  if (botInfo) {
    console.log(`✅ Telegram Bot verified: @${botInfo.username} (${botInfo.first_name}) [ID: ${botInfo.id}]`);

    // Sync from Firestore if enabled
    await loadClientsFromFirestore();

    const stats = getStats();
    const videoConfig = getVideoConfig();
    const channelVideos = getChannelVideoCount();
    const channelName = process.env.CHANNEL_ID || process.env.TELEGRAM_CHANNEL || 'Not set';

    console.log('\n📊 Current Status:');
    console.log(`   - Connected Channel:    ${channelName}`);
    console.log(`   - Channel Videos Total: ${channelVideos}`);
    console.log(`   - Cloud Database:       ${isFirestoreEnabled() ? '🟢 Google Cloud Firestore (Active)' : '⚪ Local JSON Storage'}`);
    console.log(`   - Registered Clients:   ${stats.totalClients}`);
    console.log(`   - Total Videos Sent:    ${stats.totalVideosSent}`);
    console.log(`\n💬 Bot is ONLINE! In Telegram, search for @${botInfo.username} and send /start to test.\n`);

    // Launch polling in background with all required update subscriptions
    bot.launch({
      allowedUpdates: [
        'message',
        'edited_message',
        'channel_post',
        'edited_channel_post',
        'callback_query',
        'my_chat_member',
        'chat_member'
      ]
    }).catch(err => {
      console.error('⚠️ Polling error:', err.message);
    });
  } else {
    console.error('❌ Could not connect to Telegram Bot API after retries.');
    console.log(`ℹ️ HTTP API Server remains online at http://localhost:${PORT}`);
  }

  // Graceful shutdown
  const stopHandler = (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
    try {
      bot.stop(signal);
    } catch {}
    server.close(() => {
      console.log('HTTP server closed. Goodbye!');
      process.exit(0);
    });
  };

  process.once('SIGINT', () => stopHandler('SIGINT'));
  process.once('SIGTERM', () => stopHandler('SIGTERM'));
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});

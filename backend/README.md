# 🎲 TellMan Telegram Channel Random Video Bot

A high-performance Telegram Bot built with **Node.js** and **Telegraf** that delivers **random videos from your Telegram Channel** to your clients and subscribers.

---

## 🌟 How It Works

1. **Automatic Channel Post Sync**:
   Add the bot as an Administrator to your Telegram Channel. Every video you post to the channel is automatically detected and added to the bot's random video catalog.
2. **Instant Forwarding**:
   You can also forward any existing video message from your channel directly to the bot in Telegram chat, and it will immediately index it into the catalog.
3. **Random Non-Repeating Delivery**:
   When clients message the bot, press `/start`, or click **🎲 Random Video**, the bot picks a random video from your channel catalog. It tracks what videos the client has already seen so they receive fresh videos every time!
4. **1-Click "Next Random Video" Button**:
   Every delivered video comes with an inline `[🎲 Next Random Video]` button so users can keep watching clips effortlessly.
5. **⭐ 1-Day VIP Pass via Telegram Stars (XTR)**:
   - Native Telegram Stars integration (`currency: 'XTR'`).
   - Grants **24-hour unlimited access** to all random channel videos.
   - Configurable price in Stars (`STARS_1DAY_PRICE=50`) and free trial count (`FREE_VIDEOS_LIMIT=1`).
   - Admin command to gift/test passes: `/grant_sub <chat_id> [days]`.
6. **Admin Channel Controls & Broadcasts**:
   - `/broadcast_random`: Send a random video to all registered clients at once.
   - `/sync_channel <min_id> <max_id>`: Batch-scan a range of message IDs in your channel.
   - `/add_link <t.me link>`: Add a specific video using its channel link (e.g. `https://t.me/mychannel/42`).

---

## 🚀 Quick Setup

### 1. Create Bot & Get Token
1. Open [@BotFather](https://t.me/botfather) on Telegram and run `/newbot`.
2. Follow prompts to name your bot and copy the **Bot Token**.
3. (Optional) Talk to [@userinfobot](https://t.me/userinfobot) to get your numeric Telegram User ID for Admin rights.

### 2. Connect Your Channel to the Bot
1. Open your Telegram Channel settings -> **Administrators** -> **Add Administrator**.
2. Search for your bot username and add it as an Admin (with at least "Post messages" or read access).
3. Copy your Channel username (e.g. `@my_channel_name`) or numeric Channel ID.

### 3. Configure `.env`
Edit [`.env`](file:///home/red/Documents/Projects/TellMan/backend/.env):

```env
# Your Telegram Bot Token from @BotFather
BOT_TOKEN=7123456789:AAH...

# Your numeric Telegram user ID (for admin commands & broadcasts)
ADMIN_CHAT_ID=123456789

# Your Telegram Channel
CHANNEL_ID=@my_channel_username

# Auto-send a random video when a client types /start
AUTO_SEND_ON_START=true

# Server port for HTTP API
PORT=3001
```

### 4. Start the Bot
```bash
cd /home/red/Documents/Projects/TellMan/backend
npm start
```

---

## 📥 3 Easy Ways to Index Channel Videos

### Method 1: Auto-Sync (Real-Time)
Once your bot is an Admin in your channel, whenever you post a new video in the channel, the bot automatically captures and saves it into `data/channel_videos.json`.

### Method 2: Forward Existing Channel Videos
In Telegram, forward any existing video post from your channel directly to your bot. The bot will recognize the forward and reply:
```
✅ Video Indexed from "My Channel"!
• Message ID: 142
• Total Channel Videos: 25
```

### Method 3: Add via Message Link or Scan Range
- **By Link**:
  ```text
  /add_link https://t.me/my_channel_username/55
  ```
- **By Message ID Range**:
  ```text
  /sync_channel 1 50
  ```

---

## 🤖 Client Commands & Experience

| Action | Description |
|---|---|
| `/start` | Starts the bot, registers the client, displays menu, and delivers a random video |
| `/random` or `🎲 Random Video` | Picks and delivers a random video from the channel |
| `[🎲 Next Random Video]` | Inline button under every video to quickly watch another random clip |
| `/channel` or `ℹ️ Channel Info` | Displays channel name and number of indexed videos |
| `/stats` or `📊 My Stats` | Displays client's personal watch history |

---

## 👑 Admin Commands

- `/broadcast_random`: Broadcasts a random channel video to all registered subscribers.
- `/channel`: View channel connectivity and catalog size.
- `/sync_channel <min_id> <max_id>`: Scans a range of channel message IDs.
- `/add_link <url>`: Adds a video from a Telegram channel link.
- `/clear_channel`: Wipes the catalog if you want to rebuild it from scratch.

---

## 🌐 HTTP REST API

The Express API is running alongside the bot on port `3001`:

- `GET /api/channel-videos`: List all indexed channel videos and count.
- `GET /api/stats`: Bot delivery statistics and subscriber numbers.
- `GET /api/clients`: Registered client list.
- `POST /api/send-random-video`: Send a random channel video to a specific `chatId`.
  ```json
  { "chatId": "123456789" }
  ```
- `POST /api/broadcast-random-video`: Broadcast a random channel video to all clients.

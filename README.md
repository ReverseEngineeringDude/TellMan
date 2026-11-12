# TellMan - React Telegram Web & Multi-Profile Dashboard

A modern React application built with Vite and Tailwind CSS. It features a Home Page, Login Page, and a protected Dashboard that lists profiles directly from `.env`. When Telegram credentials are present in `.env`, the website acts as a full-featured **Telegram Web** client.

---

## 🌟 Key Features

1. **Home Page (`/`)**:
   - Modern hero section introducing TellMan Web 2.0.
   - Live **Environment Credential Inspector** that scans `.env` (`import.meta.env`) and reports Telegram Web activation status.
   - Quick feature breakdown: Multi-Profile Hub, Telegram Web interface, and `.env`-driven configuration.
   - Interactive credentials simulator toggle to test with/without credentials on the fly.

2. **Login Page (`/login`)**:
   - Telegram Web-style authentication UI.
   - **Quick 1-Click Login** using the primary profile loaded from `.env`.
   - **Choose Profile Login**: pick any configured profile from `.env` to sign in.
   - **Phone / Cloud Passcode Login**: custom phone and authentication credentials.
   - Session persistence in `localStorage`.

3. **Dashboard Page (`/dashboard`)**:
   - **Protected Route**: Requires user authentication.
   - **Profiles Directory**:
     - Lists all Telegram profiles defined in `VITE_TELEGRAM_PROFILES` inside `.env`.
     - Displays avatar, name, username, phone, status badge (`online`, `bot`, `away`), bio, unread chat count.
     - Inspect and copy Telegram credentials (`API_ID`, `API_HASH` with hide/reveal toggle, `BOT_TOKEN`).
     - 1-click **Profile Switching**: change active identity seamlessly.
   - **Telegram Web Mode ("Act as Telegram Web")**:
     - Automatically activated when Telegram credentials (`API_ID`, `API_HASH`, or `BOT_TOKEN`) are detected in `.env`.
     - Full Telegram Web client interface with:
       - Sidebar with search, categories (`All`, `Chats`, `Bots`, `Groups`, `Channels`), unread badges, pinned chats.
       - Active conversation window with Telegram message bubbles, status ticks (`✓` sent, `✓✓` read), and timestamps.
       - Interactive message sending with automatic simulated responses (e.g. TellMan Bot, contacts).
       - Emoji quick tray and file attachment buttons.
       - Expandable contact info drawer with bio, phone, notification preferences, and shared items.
     - View mode switcher: **Telegram Web Mode**, **Profiles Grid**, or **Split View**.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration (`.env`)
Create or edit `.env` in the root directory:

```env
# TellMan Telegram Environment Configuration
VITE_TELEGRAM_API_ID=28491024
VITE_TELEGRAM_API_HASH=8f4a7c2e1b3d9501a6723e42f9b8c1d0
VITE_TELEGRAM_BOT_TOKEN=7293849102:AAH9f381jKls0293kdjs9283-kjsdf0
VITE_TELEGRAM_PHONE=+1 (555) 349-2041
VITE_TELEGRAM_USERNAME=@alex_tellman
VITE_TELEGRAM_ACCOUNT_NAME=Alex Mercer

# Pre-configured profiles loaded from .env into Dashboard:
VITE_TELEGRAM_PROFILES='[
  {
    "id": "tg-primary",
    "name": "Alex Mercer (Personal)",
    "username": "@alex_mercer",
    "phone": "+1 (555) 349-2041",
    "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "role": "Primary Account",
    "status": "online",
    "bio": "Software Engineer & Telegram Bot Architect ⚡",
    "apiId": "28491024",
    "apiHash": "8f4a7c2e1b3d9501a6723e42f9b8c1d0",
    "botToken": "",
    "chatsCount": 34,
    "unreadCount": 4
  },
  {
    "id": "tg-support",
    "name": "TellMan Support Bot",
    "username": "@tellman_support_bot",
    "phone": "Automated Bot Service",
    "avatar": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    "role": "Verified Bot",
    "status": "bot",
    "bio": "Official TellMan Dispatcher & Auto-responder service",
    "apiId": "28491024",
    "apiHash": "8f4a7c2e1b3d9501a6723e42f9b8c1d0",
    "botToken": "7293849102:AAH9f381jKls0293kdjs9283-kjsdf0",
    "chatsCount": 142,
    "unreadCount": 18
  },
  {
    "id": "tg-devops",
    "name": "Cloud Infra & DevOps",
    "username": "@devops_cloud_team",
    "phone": "+44 20 7946 0912",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "role": "Channel Administrator",
    "status": "away",
    "bio": "Continuous integration alerts, server cluster monitors",
    "apiId": "19482011",
    "apiHash": "b3e9184fc0a9437181057eac92b8d4f1",
    "botToken": "",
    "chatsCount": 19,
    "unreadCount": 0
  }
]'
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```

---

## 🔍 How Credentials Detection Works

The app checks:
1. Are `VITE_TELEGRAM_API_ID` and `VITE_TELEGRAM_API_HASH` present in `.env`?
2. Or is `VITE_TELEGRAM_BOT_TOKEN` present in `.env`?
3. Or do any profiles in `VITE_TELEGRAM_PROFILES` have API credentials?

- **If YES**: The dashboard unlocks **Telegram Web Mode**, rendering the Telegram Web client with live chats, message threads, search, and Telegram UI styling.
- **If NO**: The dashboard runs in **Standard Mode**, displaying profile cards and providing instructions on how to add credentials to `.env`.
- An interactive **"Simulate Missing / Enable Creds"** toggle button is also available in the UI so you can test both states instantly without editing `.env`.

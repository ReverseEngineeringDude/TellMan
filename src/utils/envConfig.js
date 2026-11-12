// Utility to read and parse Telegram credentials and profile values from .env (import.meta.env)

export const DEFAULT_FALLBACK_PROFILES = [
  {
    id: "tg-primary",
    name: "Alex Mercer",
    username: "@alex_mercer",
    phone: "+1 (555) 349-2041",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    role: "Primary Account",
    status: "online",
    bio: "Software Engineer & Telegram Bot Architect ⚡",
    apiId: "28491024",
    apiHash: "8f4a7c2e1b3d9501a6723e42f9b8c1d0",
    botToken: "",
    chatsCount: 34,
    unreadCount: 4
  },
  {
    id: "tg-support",
    name: "TellMan Support Bot",
    username: "@tellman_support_bot",
    phone: "Automated Bot Service",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    role: "Verified Bot",
    status: "bot",
    bio: "Official TellMan Dispatcher & Auto-responder service",
    apiId: "28491024",
    apiHash: "8f4a7c2e1b3d9501a6723e42f9b8c1d0",
    botToken: "7293849102:AAH9f381jKls0293kdjs9283-kjsdf0",
    chatsCount: 142,
    unreadCount: 18
  },
  {
    id: "tg-devops",
    name: "Cloud Infra & DevOps",
    username: "@devops_cloud_team",
    phone: "+44 20 7946 0912",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    role: "Channel Administrator",
    status: "away",
    bio: "Continuous integration alerts, server cluster monitors",
    apiId: "19482011",
    apiHash: "b3e9184fc0a9437181057eac92b8d4f1",
    botToken: "",
    chatsCount: 19,
    unreadCount: 0
  }
];

export function getEnvConfig() {
  const env = import.meta.env;

  const apiId = env.VITE_TELEGRAM_API_ID || "";
  const apiHash = env.VITE_TELEGRAM_API_HASH || "";
  const botToken = env.VITE_TELEGRAM_BOT_TOKEN || "";
  const phone = env.VITE_TELEGRAM_PHONE || "";
  const username = env.VITE_TELEGRAM_USERNAME || "";
  const accountName = env.VITE_TELEGRAM_ACCOUNT_NAME || "Alex Mercer";

  let profiles = [];
  const rawProfiles = env.VITE_TELEGRAM_PROFILES;

  if (rawProfiles) {
    try {
      profiles = JSON.parse(rawProfiles);
    } catch (e) {
      console.warn("Could not parse VITE_TELEGRAM_PROFILES as JSON from .env, using default format:", e);
    }
  }

  if (!profiles || profiles.length === 0) {
    profiles = DEFAULT_FALLBACK_PROFILES;
  }

  // Telegram credentials condition:
  // User specifies: "the env contain telegram creds if creds in the env then act the website as telegram web"
  // Creds exist if API_ID and API_HASH are present, or BOT_TOKEN is present, or any profile has them.
  const hasTelegramCreds = Boolean(
    (apiId && apiHash) ||
    botToken ||
    profiles.some(p => (p.apiId && p.apiHash) || p.botToken)
  );

  return {
    apiId,
    apiHash,
    botToken,
    phone,
    username,
    accountName,
    profiles,
    hasTelegramCreds,
  };
}

export const INITIAL_CHATS = [
  {
    id: "chat-1",
    type: "user",
    name: "Sarah Connor",
    username: "@sarah_c",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    status: "online",
    verified: false,
    pinned: true,
    unread: 2,
    lastSeen: "Online",
    phone: "+1 555-0128",
    bio: "Senior Frontend Lead @ Cyberdyne Systems",
    messages: [
      {
        id: "m-1",
        sender: "them",
        senderName: "Sarah Connor",
        text: "Hey Alex! Did you manage to deploy the latest Telegram webhook server?",
        time: "10:32 AM",
        status: "read"
      },
      {
        id: "m-2",
        sender: "me",
        senderName: "You",
        text: "Yes, just deployed the container with the environment API keys. Both API_ID and API_HASH are configured!",
        time: "10:34 AM",
        status: "read"
      },
      {
        id: "m-3",
        sender: "them",
        senderName: "Sarah Connor",
        text: "Awesome! The dashboard UI looks super clean. The Telegram Web interface is super snappy.",
        time: "10:38 AM",
        status: "read"
      },
      {
        id: "m-4",
        sender: "them",
        senderName: "Sarah Connor",
        text: "Can you send me the API endpoints for the bot dispatch?",
        time: "10:40 AM",
        status: "unread"
      }
    ]
  },
  {
    id: "chat-2",
    type: "bot",
    name: "TellMan Support Bot",
    username: "@tellman_support_bot",
    avatar: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80",
    status: "bot",
    verified: true,
    pinned: true,
    unread: 1,
    lastSeen: "bot",
    phone: "Official Bot",
    bio: "Automated TellMan bot assistant. Type /help to see all commands.",
    messages: [
      {
        id: "b-1",
        sender: "them",
        senderName: "TellMan Bot",
        text: "👋 Welcome to TellMan Web! Your API credentials were successfully loaded from .env.",
        time: "09:15 AM",
        status: "read"
      },
      {
        id: "b-2",
        sender: "them",
        senderName: "TellMan Bot",
        text: "🟢 Status: Active\n⚡ Mode: Telegram Web Client\n🔑 API ID: Verified\n🛡 Session: Authenticated",
        time: "09:15 AM",
        status: "read"
      },
      {
        id: "b-3",
        sender: "me",
        senderName: "You",
        text: "/status",
        time: "09:18 AM",
        status: "read"
      },
      {
        id: "b-4",
        sender: "them",
        senderName: "TellMan Bot",
        text: "✅ All systems operating normally. 4 active profiles synchronized from .env.",
        time: "09:18 AM",
        status: "unread"
      }
    ]
  },
  {
    id: "chat-3",
    type: "channel",
    name: "Telegram News & Updates",
    username: "@telegram_news",
    avatar: "https://images.unsplash.com/photo-1614680376593-902f749f7ffc?w=150&auto=format&fit=crop&q=80",
    status: "channel",
    verified: true,
    pinned: false,
    unread: 5,
    membersCount: "1,240,500 subscribers",
    bio: "Official channel for major Telegram announcements and platform features.",
    messages: [
      {
        id: "c-1",
        sender: "them",
        senderName: "Telegram News",
        text: "🚀 Telegram Web 2.0 update introduces multi-account profile switching, customizable app badges, and fast media streaming.",
        time: "Yesterday",
        views: "892K",
        status: "read"
      },
      {
        id: "c-2",
        sender: "them",
        senderName: "Telegram News",
        text: "💡 Developers can now authenticate their apps seamlessly using API_ID and API_HASH configured in production environments.",
        time: "08:00 AM",
        views: "410K",
        status: "unread"
      }
    ]
  },
  {
    id: "chat-4",
    type: "group",
    name: "Core Engineering Team",
    username: "@core_engineers",
    avatar: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80",
    status: "group",
    verified: false,
    pinned: false,
    unread: 0,
    membersCount: "24 members, 7 online",
    bio: "Engineering discussions, release coordination, and sprint reviews.",
    messages: [
      {
        id: "g-1",
        sender: "them",
        senderName: "David Kim",
        text: "Has everyone tested the login redirect when session expires?",
        time: "Yesterday",
        status: "read"
      },
      {
        id: "g-2",
        sender: "them",
        senderName: "Elena Rostova",
        text: "Yes, verified on Chrome and Firefox. It smoothly preserves the dashboard state.",
        time: "Yesterday",
        status: "read"
      },
      {
        id: "g-3",
        sender: "me",
        senderName: "You",
        text: "Great! The .env loader also handles fallback profiles gracefully if env is empty.",
        time: "08:45 AM",
        status: "read"
      }
    ]
  },
  {
    id: "chat-5",
    type: "user",
    name: "Michael Chang",
    username: "@mchang_dev",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    status: "offline",
    verified: false,
    pinned: false,
    unread: 0,
    lastSeen: "last seen 2 hours ago",
    phone: "+1 555-0199",
    bio: "Backend enthusiast | Go & Rust | Distributed Systems",
    messages: [
      {
        id: "mc-1",
        sender: "them",
        senderName: "Michael Chang",
        text: "Let's review the Telegram bot webhook latency this afternoon.",
        time: "Nov 11",
        status: "read"
      },
      {
        id: "mc-2",
        sender: "me",
        senderName: "You",
        text: "Sounds good, I'll have the metrics dashboard ready.",
        time: "Nov 11",
        status: "read"
      }
    ]
  }
];

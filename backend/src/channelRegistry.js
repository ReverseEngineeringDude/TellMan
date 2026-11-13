import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getFirestoreDb, isFirestoreEnabled } from './firebase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const CHANNELS_FILE = path.join(DATA_DIR, 'channels.json');
const CHANNEL_VIDEOS_FILE = path.join(DATA_DIR, 'channel_videos.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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
 * Async sync channel record to Cloud Firestore
 */
function syncChannelToFirestore(channelData) {
  if (!isFirestoreEnabled() || !channelData?.id) return;
  const db = getFirestoreDb();
  if (!db) return;

  db.collection('channels')
    .doc(String(channelData.id))
    .set(channelData, { merge: true })
    .catch(err => {
      console.error(`[FirestoreSyncError] Failed to sync channel ${channelData.id}:`, err.message);
    });
}

/**
 * Initial load of channels from Cloud Firestore on boot
 */
export async function loadChannelsFromFirestore() {
  if (!isFirestoreEnabled()) return;
  const db = getFirestoreDb();
  if (!db) return;

  try {
    const snapshot = await db.collection('channels').get();
    if (!snapshot.empty) {
      const channels = readJsonFile(CHANNELS_FILE, {});
      snapshot.forEach(doc => {
        channels[doc.id] = { ...channels[doc.id], ...doc.data() };
      });
      writeJsonFile(CHANNELS_FILE, channels);
      console.log(`✅ [Firestore] Synced ${snapshot.size} channel(s) from Cloud Firestore.`);
    }
  } catch (err) {
    console.error('⚠️ [Firestore] Error syncing channels on boot:', err.message);
  }
}

/**
 * Count how many videos in the catalog belong to a channel ID
 */
export function getVideosCountForChannel(channelId) {
  const videos = readJsonFile(CHANNEL_VIDEOS_FILE, []);
  const idStr = String(channelId);
  return videos.filter(v => String(v.channelId) === idStr).length;
}

/**
 * Initialize Registry with default environment channel
 */
export function initChannelRegistry(defaultChannelId, defaultChannelTitle = 'Collections') {
  const channels = readJsonFile(CHANNELS_FILE, {});

  if (defaultChannelId) {
    const idStr = String(defaultChannelId);
    if (!channels[idStr]) {
      channels[idStr] = {
        id: idStr,
        title: defaultChannelTitle,
        username: '',
        type: 'channel',
        status: 'active', // Default env channel is pre-approved
        addedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        manualConnect: true
      };
      writeJsonFile(CHANNELS_FILE, channels);
      syncChannelToFirestore(channels[idStr]);
    }
  } else if (!fs.existsSync(CHANNELS_FILE)) {
    writeJsonFile(CHANNELS_FILE, {});
  }

  return channels;
}

/**
 * Get all registered channels and groups with enriched video count
 */
export function getChannels(statusFilter = null) {
  const channels = readJsonFile(CHANNELS_FILE, {});
  const list = Object.values(channels).map(c => ({
    ...c,
    videosCount: getVideosCountForChannel(c.id)
  }));

  if (statusFilter) {
    return list.filter(c => c.status === statusFilter);
  }
  return list;
}

/**
 * Get a specific channel by ID
 */
export function getChannel(channelId) {
  if (!channelId) return null;
  const channels = readJsonFile(CHANNELS_FILE, {});
  const idStr = String(channelId);

  if (channels[idStr]) {
    return {
      ...channels[idStr],
      videosCount: getVideosCountForChannel(idStr)
    };
  }

  // Fallback match by username if given with or without @
  const cleanUser = String(channelId).replace(/^@/, '').toLowerCase();
  for (const c of Object.values(channels)) {
    if (c.username && c.username.replace(/^@/, '').toLowerCase() === cleanUser) {
      return {
        ...c,
        videosCount: getVideosCountForChannel(c.id)
      };
    }
  }

  return null;
}

/**
 * Check if a channel or group is actively approved by the administrator
 */
export function isChannelApproved(channelId) {
  if (!channelId) return false;
  const idStr = String(channelId);

  // Check against env default channel
  const envChannel = process.env.CHANNEL_ID || process.env.TELEGRAM_CHANNEL;
  if (envChannel && String(envChannel) === idStr) {
    return true;
  }

  const ch = getChannel(channelId);
  return ch?.status === 'active';
}

/**
 * Register or update a channel/group
 * By default, any new channel or group starts as 'pending' unless it matches the env channel.
 */
export function registerOrUpdateChannel({
  id,
  title = '',
  username = '',
  type = 'channel',
  addedBy = null,
  status = null
}) {
  const channels = readJsonFile(CHANNELS_FILE, {});
  const idStr = String(id);
  const existing = channels[idStr];
  const now = new Date().toISOString();

  const envChannel = process.env.CHANNEL_ID || process.env.TELEGRAM_CHANNEL;
  const isEnvChannel = envChannel && String(envChannel) === idStr;

  // Preserve existing status unless explicitly supplied
  let finalStatus = status;
  if (!finalStatus) {
    if (existing?.status) {
      finalStatus = existing.status;
    } else if (isEnvChannel) {
      finalStatus = 'active';
    } else {
      finalStatus = 'pending'; // Manual admin connection required!
    }
  }

  channels[idStr] = {
    id: idStr,
    title: title || existing?.title || 'Untitled',
    username: username || existing?.username || '',
    type: type || existing?.type || 'channel',
    status: finalStatus,
    addedBy: addedBy || existing?.addedBy || null,
    addedAt: existing?.addedAt || now,
    updatedAt: now
  };

  writeJsonFile(CHANNELS_FILE, channels);
  syncChannelToFirestore(channels[idStr]);

  return {
    ...channels[idStr],
    videosCount: getVideosCountForChannel(idStr)
  };
}

/**
 * Manually update status of a channel (e.g. 'active', 'disconnected', 'pending', 'left')
 */
export function setChannelStatus(channelId, status) {
  const channels = readJsonFile(CHANNELS_FILE, {});
  const idStr = String(channelId);

  if (!channels[idStr]) {
    // If channel wasn't registered yet, register it with the given status
    return registerOrUpdateChannel({
      id: idStr,
      status: status
    });
  }

  channels[idStr].status = status;
  channels[idStr].updatedAt = new Date().toISOString();

  writeJsonFile(CHANNELS_FILE, channels);
  syncChannelToFirestore(channels[idStr]);

  return {
    ...channels[idStr],
    videosCount: getVideosCountForChannel(idStr)
  };
}

/**
 * Remove a channel from registry
 */
export function removeChannel(channelId) {
  const channels = readJsonFile(CHANNELS_FILE, {});
  const idStr = String(channelId);

  if (channels[idStr]) {
    delete channels[idStr];
    writeJsonFile(CHANNELS_FILE, channels);

    if (isFirestoreEnabled()) {
      const db = getFirestoreDb();
      if (db) {
        db.collection('channels').doc(idStr).delete().catch(() => {});
      }
    }
    return true;
  }
  return false;
}
